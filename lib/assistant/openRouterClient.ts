import type { AssistantMessage } from './types.ts';

export interface CompletionResult {
  text: string;
  modelUsed: string;
  success: boolean;
  error?: string;
}

const DEFAULT_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'openrouter/free',
];

/**
 * Returns the configured list of OpenRouter models to try in fallback priority order.
 */
export function getAssistantModelChain(): string[] {
  const envVal = process.env.ASSISTANT_MODELS;
  if (envVal && envVal.trim()) {
    const list = envVal
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return DEFAULT_MODELS;
}

/**
 * Executes a streaming or full completion call to OpenRouter with automatic model fallback,
 * hard 20-second per-model timeouts, and graceful error handling.
 */
export async function executeOpenRouterCompletion(
  messages: AssistantMessage[],
  onDelta?: (token: string) => void,
  customApiKey?: string
): Promise<CompletionResult> {
  const apiKey = customApiKey || process.env.OPENROUTER_API_KEY;
  const now = new Date();
  const utcHours = String(now.getUTCHours()).padStart(2, '0');
  const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
  const utcTimeStr = `${utcHours}:${utcMins} UTC`;

  if (!apiKey || apiKey.includes('placeholder') || apiKey.trim() === '') {
    const fallbackMsg = `OpenRouter API key is not configured on this server. To enable live AI flight assistance, set the OPENROUTER_API_KEY environment variable. Data as of ${utcTimeStr}.`;
    if (onDelta) onDelta(fallbackMsg);
    return {
      text: fallbackMsg,
      modelUsed: 'mock-unconfigured',
      success: false,
      error: 'OPENROUTER_API_KEY_MISSING',
    };
  }

  const modelChain = getAssistantModelChain();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aeroloom.internal';

  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': siteUrl,
          'X-Title': 'Aeroloom Grounded Flight Assistant',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.15,
          max_tokens: 500,
          stream: Boolean(onDelta),
        }),
        signal: AbortSignal.timeout(20000), // Hard 20-second timeout
      });

      // Handle 429 rate limit or 5xx server failure by cascading to next model
      if (response.status === 429 || response.status >= 500) {
        console.warn(`[Ask Aeroloom] Model ${model} returned status ${response.status}. Cascading to next model...`);
        continue;
      }

      if (!response.ok) {
        console.warn(`[Ask Aeroloom] Model ${model} returned unexpected status ${response.status}.`);
        continue;
      }

      if (onDelta && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const deltaToken = parsed.choices?.[0]?.delta?.content || '';
                if (deltaToken) {
                  fullText += deltaToken;
                  onDelta(deltaToken);
                }
              } catch {
                // Ignore parse errors on malformed chunks
              }
            }
          }
        }

        if (fullText.trim().length > 0) {
          return {
            text: fullText,
            modelUsed: model,
            success: true,
          };
        } else {
          console.warn(`[Ask Aeroloom] Model ${model} produced empty streaming response. Cascading...`);
          continue;
        }
      } else {
        // Non-streaming JSON response
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (text.trim().length > 0) {
          if (onDelta) onDelta(text);
          return {
            text,
            modelUsed: model,
            success: true,
          };
        } else {
          console.warn(`[Ask Aeroloom] Model ${model} produced empty text. Cascading...`);
          continue;
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`[Ask Aeroloom] Attempt with model ${model} failed (${errorMsg}). Cascading...`);
      continue;
    }
  }

  // All models in fallback chain failed
  const gracefulMessage = `The AI flight assistant is currently busy or experiencing high demand across free models. Please try your question again in a minute. Data as of ${utcTimeStr}.`;
  if (onDelta) onDelta(gracefulMessage);

  return {
    text: gracefulMessage,
    modelUsed: 'fallback-exhausted',
    success: false,
    error: 'ALL_MODELS_EXHAUSTED',
  };
}
