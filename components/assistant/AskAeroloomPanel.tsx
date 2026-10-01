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
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-paper-primary border border-border-default rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-paper-secondary/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/20 flex items-center justify-center text-signal">
              <Icon name="activity" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="assistant-title" className="text-base font-serif font-bold text-ink-primary">
                  Ask Aeroloom
                </h2>
                <Chip variant="sky">Grounded AI</Chip>
              </div>
              <p className="text-xs text-ink-muted">
                Real-time answers strictly sourced from live ADS-B telemetry and NOAA METAR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ask Aeroloom"
            className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-paper-tertiary transition-colors"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body & Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Context Badge if active */}
          {(contextHint?.selectedCallsign || contextHint?.airportIcao) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-paper-tertiary/70 border border-border-subtle text-xs text-ink-secondary">
              <Icon name="compass" size={14} className="text-signal shrink-0" />
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
              <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
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
                    className="text-left px-3.5 py-2 rounded-lg bg-paper-secondary border border-border-subtle hover:border-signal/40 hover:bg-paper-tertiary text-xs text-ink-secondary hover:text-ink-primary transition-all flex items-center justify-between group"
                  >
                    <span>{sug}</span>
                    <Icon name="arrow-right" size={14} className="opacity-0 group-hover:opacity-100 text-signal transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Response Box */}
          {(responseText || isStreaming || errorMsg) && (
            <div className="p-4 rounded-xl bg-paper-secondary border border-border-subtle space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="activity" size={14} className="text-signal" />
                  Answer
                </span>
                {modelUsed && (
                  <span className="text-[11px] font-mono text-ink-muted">
                    Model: {modelUsed}
                  </span>
                )}
              </div>

              {/* Streaming Content */}
              <div
                aria-live="polite"
                aria-atomic="false"
                className="text-sm leading-relaxed text-ink-primary font-sans whitespace-pre-wrap selection:bg-signal/20"
              >
                {responseText}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-signal animate-pulse" />
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-bad/10 border border-bad/20 text-xs text-bad flex items-start gap-2">
                  <Icon name="alert-triangle" size={14} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Toolbar */}
              {responseText && (
                <div className="pt-2 flex items-center justify-between border-t border-border-subtle text-xs">
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
                      className="text-xs text-signal hover:underline flex items-center gap-1"
                    >
                      <Icon name="layers" size={13} />
                      {sourcesOpen ? 'Hide sources' : `View ${sources.length} sources`}
                    </button>
                  )}
                </div>
              )}

              {/* Sources Disclosure */}
              {sourcesOpen && sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border-subtle space-y-1.5">
                  <span className="text-[11px] font-mono uppercase text-ink-muted tracking-wider">
                    Telemetry Grounding Sources
                  </span>
                  <div className="space-y-1">
                    {sources.map((src, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1.5 rounded bg-paper-tertiary border border-border-subtle text-xs flex items-center justify-between"
                      >
                        <span className="font-mono font-medium text-ink-secondary">
                          {src.tool}({src.query})
                        </span>
                        <span className="text-[11px] text-ink-muted">
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
        <div className="p-4 border-t border-border-subtle bg-paper-secondary/40 space-y-2">
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
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-paper-primary border border-border-default text-sm text-ink-primary placeholder:text-ink-muted focus:outline-hidden focus:border-signal focus:ring-1 focus:ring-signal transition-all disabled:opacity-50"
              />
              {query && !isStreaming && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
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
          <p className="text-[11px] text-center text-ink-muted">
            AI can make mistakes. Synthesized from live ADS-B & NOAA METAR data; strictly not for flight navigation or operational decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
