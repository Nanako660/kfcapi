import { getRandomCopy, getThinkingCopy } from '../../../src/kfc-copy.js';
import {
  generateId,
  formatSSEChunk,
  createStreamChunk,
  createStreamStart,
  createUsageChunk,
  createNonStreamingResponse,
} from '../../../src/sse.js';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleStreamingRequest(body) {
  const id = generateId();
  const content = getRandomCopy();
  const includeUsage = body.stream_options?.include_usage === true;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(formatSSEChunk(createStreamStart(id))));

      if (body.model && body.model.includes('thinking')) {
        const thinking = getThinkingCopy();
        controller.enqueue(encoder.encode(formatSSEChunk({
          id,
          object: 'chat.completion.chunk',
          model: body.model || 'kfc-crazy-thursday',
          choices: [{
            index: 0,
            delta: { reasoning_content: thinking },
            finish_reason: null,
          }],
        })));
        await delay(50);
      }

      for (let i = 0; i < content.length; i++) {
        controller.enqueue(encoder.encode(formatSSEChunk(createStreamChunk(id, content[i]))));
        await delay(Math.random() * 40 + 10);
      }

      controller.enqueue(encoder.encode(formatSSEChunk(createStreamChunk(id, null, 'stop'))));

      if (includeUsage) {
        const promptTokens = body.messages?.reduce((sum, m) => sum + (m.content?.length || 0), 0) || 10;
        controller.enqueue(encoder.encode(formatSSEChunk(createUsageChunk(id, promptTokens, content.length))));
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function handleNonStreamingRequest(body) {
  const content = getRandomCopy();
  const id = generateId();

  let thinkingContent = null;
  if (body.model && body.model.includes('thinking')) {
    thinkingContent = getThinkingCopy();
  }

  const response = createNonStreamingResponse(id, content);
  if (thinkingContent) {
    response.choices[0].message.reasoning_content = thinkingContent;
  }

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestPost(context) {
  const body = await context.request.json();

  if (body.stream) {
    return handleStreamingRequest(body);
  }
  return handleNonStreamingRequest(body);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
