import { getRandomCopy, getThinkingContent } from '../../../src/kfc-copy.js';
import {
  generateId,
  formatSSEChunk,
  buildTypingFrames,
  createStreamChunk,
  createStreamStart,
  createUsageChunk,
  createNonStreamingResponse,
} from '../../../src/sse.js';

const MODEL = 'kfc-crazy-thursday';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 从请求体中解析 budget_tokens
// 支持: { thinking: { type: 'enabled', budget_tokens: N } }
function getBudgetTokens(body) {
  const t = body.thinking;
  if (!t || t.type !== 'enabled') return 0;
  return typeof t.budget_tokens === 'number' ? t.budget_tokens : 0;
}

async function handleStreamingRequest(body) {
  const id = generateId();
  const content = await getRandomCopy();
  const budgetTokens = getBudgetTokens(body);
  const includeUsage = body.stream_options?.include_usage === true;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data) => controller.enqueue(encoder.encode(data));

      enqueue(formatSSEChunk(createStreamStart(id, MODEL)));

      // 思考块（仅在 thinking.type=enabled 且 budget_tokens>0 时输出）
      if (budgetTokens > 0) {
        const thinkingText = await getThinkingContent(budgetTokens);
        if (thinkingText) {
          enqueue(formatSSEChunk({
            id,
            object: 'chat.completion.chunk',
            model: MODEL,
            choices: [{
              index: 0,
              delta: { reasoning_content: thinkingText },
              finish_reason: null,
            }],
          }));
          // 深度思考后多停顿一下，模拟"想了很久"
          await delay(budgetTokens > 1000 ? 600 + Math.random() * 400 : 80 + Math.random() * 120);
        }
      }

      // 逐帧输出正文，带真实打字节奏
      const frames = buildTypingFrames(content);
      for (const frame of frames) {
        await delay(frame.delay);
        if (frame.text) {
          enqueue(formatSSEChunk(createStreamChunk(id, frame.text, null, MODEL)));
        }
      }

      enqueue(formatSSEChunk(createStreamChunk(id, null, 'stop', MODEL)));

      if (includeUsage) {
        const promptTokens = body.messages?.reduce((sum, m) => sum + (m.content?.length || 0), 0) || 10;
        enqueue(formatSSEChunk(createUsageChunk(id, promptTokens, content.length, MODEL)));
      }

      enqueue('data: [DONE]\n\n');
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

async function handleNonStreamingRequest(body) {
  const id = generateId();
  const content = await getRandomCopy();
  const budgetTokens = getBudgetTokens(body);

  const response = createNonStreamingResponse(id, content, MODEL);

  if (budgetTokens > 0) {
    const thinkingText = await getThinkingContent(budgetTokens);
    if (thinkingText) {
      response.choices[0].message.reasoning_content = thinkingText;
    }
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
