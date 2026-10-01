import { NextRequest, NextResponse } from 'next/server';
import { globalRateLimiter } from '@/lib/cache';
import { sanitizeUntrustedInput, classifyAndRetrieveContext } from '@/lib/assistant/grounding';
import { buildAssistantSystemPrompt } from '@/lib/assistant/systemPrompt';
import { executeOpenRouterCompletion } from '@/lib/assistant/openRouterClient';
import type { AssistantContextHint } from '@/lib/assistant/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // 1. IP Rate Limiting (Stricter: 20 req / minute per client)
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateCheck = globalRateLimiter.check(clientIp, 20, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Assistant rate limit exceeded (20 requests/minute). Please wait before asking another question.',
        timestamp: Date.now(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateCheck.resetMs / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 2. Parse & Validate Input Payload
  let body: { query?: string; context?: AssistantContextHint };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request body.' },
      { status: 400 }
    );
  }

  const rawQuery = body.query || '';
  const cleanQuery = sanitizeUntrustedInput(rawQuery, 500);

  if (!cleanQuery) {
    return NextResponse.json(
      { success: false, error: 'Query parameter cannot be empty.' },
      { status: 400 }
    );
  }

  // 3. Grounded Context Retrieval from Live Internal Telemetry Layers
  const retrieval = await classifyAndRetrieveContext(cleanQuery, body.context);
  const systemPrompt = buildAssistantSystemPrompt(retrieval.groundedXml, retrieval.utcTimeStr);

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: cleanQuery },
  ];

  // 4. Return Server-Sent Events (SSE) Stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial sources metadata event
      controller.enqueue(
        encoder.encode(`event: sources\ndata: ${JSON.stringify(retrieval.sources)}\n\n`)
      );

      try {
        const result = await executeOpenRouterCompletion(messages, (token: string) => {
          controller.enqueue(
            encoder.encode(`event: delta\ndata: ${JSON.stringify({ token })}\n\n`)
          );
        });

        controller.enqueue(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({
              modelUsed: result.modelUsed,
              success: result.success,
              timestamp: Date.now(),
            })}\n\n`
          )
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Assistant stream error';
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: errorMsg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
