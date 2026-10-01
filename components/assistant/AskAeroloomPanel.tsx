'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import type { AssistantContextHint, AssistantToolSource } from '@/lib/assistant/types';

export interface AskAeroloomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contextHint?: AssistantContextHint;
  initialQuery?: string;
}

export function AskAeroloomPanel({
  isOpen,
  onClose,
  contextHint,
  initialQuery = '',
}: AskAeroloomPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isStreaming, setIsStreaming] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [sources, setSources] = useState<AssistantToolSource[]>([]);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  // Auto-scroll when response changes
  useEffect(() => {
    if (responseText) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [responseText]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Context-aware prompt suggestions
  const getContextSuggestions = (): string[] => {
    if (contextHint?.selectedFlightId || contextHint?.selectedCallsign) {
      const id = contextHint.selectedCallsign || contextHint.selectedFlightId;
      return [
        `Where is flight ${id} headed?`,
        `What is the altitude and speed of ${id}?`,
        `Is the destination airport weather OK for ${id}?`,
      ];
    }
    if (contextHint?.airportIcao) {
      const icao = contextHint.airportIcao;
      return [
        `What is the current weather and flight category at ${icao}?`,
        `How busy is the airspace around ${icao}?`,
        `Are there active gust or ceiling warnings at ${icao}?`,
      ];
    }
    return [
      'What is the flight category and wind at KJFK?',
      'How does Aeroloom classify transponder squawk 7700?',
      'Show live traffic around London Heathrow EGLL',
    ];
  };

  const handleAsk = async (textToSubmit?: string) => {
    const q = (textToSubmit ?? query).trim();
    if (!q || isStreaming) return;

    setQuery(q);
    setIsStreaming(true);
    setResponseText('');
    setSources([]);
    setModelUsed(null);
    setErrorMsg(null);
    setSourcesOpen(false);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, context: contextHint }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error || 'Rate limit exceeded (20 req/min). Please pause before sending another question.');
        setIsStreaming(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error || `Request failed with status ${res.status}`);
        setIsStreaming(false);
        return;
      }

      if (!res.body) {
        setErrorMsg('No response stream received from assistant.');
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventStr of events) {
          const lines = eventStr.split('\n');
          let eventType = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim();
            }
          }

          if (eventType === 'sources' && dataStr) {
            try {
              const parsedSources = JSON.parse(dataStr);
              setSources(parsedSources);
            } catch {
              // Ignore
            }
          } else if (eventType === 'delta' && dataStr) {
            try {
              const { token } = JSON.parse(dataStr);
              if (token) {
                setResponseText((prev) => prev + token);
              }
            } catch {
              // Ignore
            }
          } else if (eventType === 'done' && dataStr) {
            try {
              const { modelUsed: model } = JSON.parse(dataStr);
              setModelUsed(model);
            } catch {
              // Ignore
            }
          } else if (eventType === 'error' && dataStr) {
            try {
              const { error } = JSON.parse(dataStr);
              setErrorMsg(error);
            } catch {
              // Ignore
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setErrorMsg(`Failed to connect to flight assistant: ${msg}`);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = () => {
    if (!responseText) return;
    navigator.clipboard.writeText(responseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/30 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--line-strong)] rounded-[var(--r-lg)] shadow-[var(--sh-3)] flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--paper-2)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--signal)]/10 border border-[var(--signal)]/20 flex items-center justify-center text-[var(--signal)]">
              <Icon name="activity" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="assistant-title" className="text-base font-serif font-bold text-[var(--ink)]">
                  Ask Aeroloom
                </h2>
                <Chip variant="sky">Grounded AI</Chip>
              </div>
              <p className="text-xs text-[var(--ink-2)]">
                Real-time answers strictly sourced from live ADS-B telemetry and NOAA METAR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ask Aeroloom"
            className="p-1.5 rounded-md text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body & Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Context Badge if active */}
          {(contextHint?.selectedCallsign || contextHint?.airportIcao) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--paper-2)] border border-[var(--line)] text-xs text-[var(--ink-2)]">
              <Icon name="compass" size={14} className="text-[var(--signal)] shrink-0" />
              <span>
                Active Context:{' '}
                <strong>
                  {contextHint.selectedCallsign
                    ? `Flight ${contextHint.selectedCallsign}`
                    : `Airport ${contextHint.airportIcao}`}
                </strong>
              </span>
            </div>
          )}

          {/* Suggestions */}
          {!responseText && !isStreaming && (
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-3)]">
                Suggested Questions
              </span>
              <div className="flex flex-col gap-1.5">
                {getContextSuggestions().map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQuery(sug);
                      handleAsk(sug);
                    }}
                    className="text-left px-3.5 py-2.5 rounded-[var(--r-md)] bg-[var(--paper-2)] border border-[var(--line)] hover:border-[var(--signal)]/40 hover:bg-[var(--surface-2)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-all flex items-center justify-between group"
                  >
                    <span>{sug}</span>
                    <Icon name="arrow-right" size={14} className="opacity-0 group-hover:opacity-100 text-[var(--signal-ink)] transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Response Box */}
          {(responseText || isStreaming || errorMsg) && (
            <div className="p-4 rounded-[var(--r-lg)] bg-[var(--paper-2)] border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--ink-3)]">
                <span className="font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="activity" size={14} className="text-[var(--signal)]" />
                  Answer
                </span>
                {modelUsed && (
                  <span className="text-[11px] font-mono text-[var(--ink-3)]">
                    Model: {modelUsed}
                  </span>
                )}
              </div>

              {/* Streaming Content */}
              <div
                aria-live="polite"
                aria-atomic="false"
                className="text-sm leading-relaxed text-[var(--ink)] font-sans whitespace-pre-wrap selection:bg-[var(--signal-wash)]"
              >
                {responseText}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-[var(--signal)] animate-pulse" />
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-[var(--bad)]/10 border border-[var(--bad)]/20 text-xs text-[var(--bad-ink)] flex items-start gap-2">
                  <Icon name="alert-triangle" size={14} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Toolbar */}
              {responseText && (
                <div className="pt-2 flex items-center justify-between border-t border-[var(--line)] text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Icon name={copied ? 'check' : 'copy'} size={13} />
                    {copied ? 'Copied' : 'Copy answer'}
                  </Button>

                  {sources.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSourcesOpen(!sourcesOpen)}
                      className="text-xs text-[var(--signal-ink)] hover:underline flex items-center gap-1"
                    >
                      <Icon name="layers" size={13} />
                      {sourcesOpen ? 'Hide sources' : `View ${sources.length} sources`}
                    </button>
                  )}
                </div>
              )}

              {/* Sources Disclosure */}
              {sourcesOpen && sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--line)] space-y-1.5">
                  <span className="text-[11px] font-mono uppercase text-[var(--ink-3)] tracking-wider">
                    Telemetry Grounding Sources
                  </span>
                  <div className="space-y-1">
                    {sources.map((src, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1.5 rounded bg-[var(--surface)] border border-[var(--line)] text-xs flex items-center justify-between"
                      >
                        <span className="font-mono font-medium text-[var(--ink-2)]">
                          {src.tool}({src.query})
                        </span>
                        <span className="text-[11px] text-[var(--ink-3)]">
                          {new Date(src.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--paper-2)]/40 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about a flight, route, airport weather, or airspace..."
                maxLength={500}
                disabled={isStreaming}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-[var(--r-md)] bg-[var(--surface)] border border-[var(--line-strong)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-hidden focus:border-[var(--signal)] focus:ring-1 focus:ring-[var(--signal)] transition-all disabled:opacity-50"
              />
              {query && !isStreaming && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)]"
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>

            <Button
              type="submit"
              variant="signal"
              size="md"
              disabled={isStreaming || !query.trim()}
              className="px-4 shrink-0 gap-1.5"
            >
              {isStreaming ? (
                <>
                  <Icon name="activity" size={14} className="animate-spin" />
                  <span>Checking</span>
                </>
              ) : (
                <>
                  <span>Ask</span>
                  <Icon name="arrow-right" size={14} />
                </>
              )}
            </Button>
          </form>

          {/* Safety Disclaimer Footer */}
          <p className="text-[11px] text-center text-[var(--ink-3)]">
            AI can make mistakes. Synthesized from live ADS-B &amp; NOAA METAR data; strictly not for flight navigation or operational decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
