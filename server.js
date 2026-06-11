import http from 'http';
import { getRandomCopy, getThinkingContent, initCopies } from './src/kfc-copy.js';
import {
  generateId,
  formatSSEChunk,
  buildTypingFrames,
  createStreamChunk,
  createStreamStart,
  createUsageChunk,
  createNonStreamingResponse,
} from './src/sse.js';

const MODELS = ['gpt-4o-mini', 'gpt-4o'];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getBudgetTokens(data) {
  const t = data.thinking;
  if (!t || t.type !== 'enabled') return 0;
  return typeof t.budget_tokens === 'number' ? t.budget_tokens : 0;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/v1/models') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      object: 'list',
      data: MODELS.map(id => ({ id, object: 'model', created: 1727136000, owned_by: 'openai' })),
    }));
    return;
  }

  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const model = data.model || MODELS[0];
        const id = generateId();
        const content = await getRandomCopy();
        const budgetTokens = getBudgetTokens(data);
        const includeUsage = data.stream_options?.include_usage === true;

        if (data.stream) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });

          res.write(formatSSEChunk(createStreamStart(id, model)));

          // 思考块
          if (budgetTokens > 0) {
            const thinkingText = await getThinkingContent(budgetTokens);
            if (thinkingText) {
              res.write(formatSSEChunk({
                id,
                object: 'chat.completion.chunk',
                model,
                choices: [{
                  index: 0,
                  delta: { reasoning_content: thinkingText },
                  finish_reason: null,
                }],
              }));
              await delay(budgetTokens > 1000 ? 600 + Math.random() * 400 : 80 + Math.random() * 120);
            }
          }

          // 逐帧输出，带真实打字节奏
          const frames = buildTypingFrames(content);
          for (const frame of frames) {
            await delay(frame.delay);
            if (frame.text) {
              res.write(formatSSEChunk(createStreamChunk(id, frame.text, null, model)));
            }
          }

          res.write(formatSSEChunk(createStreamChunk(id, null, 'stop', model)));

          if (includeUsage) {
            const promptTokens = data.messages?.reduce((sum, m) => sum + (m.content?.length || 0), 0) || 10;
            res.write(formatSSEChunk(createUsageChunk(id, promptTokens, content.length, model)));
          }

          res.write('data: [DONE]\n\n');
          res.end();
        } else {
          const response = createNonStreamingResponse(id, content, model);

          if (budgetTokens > 0) {
            const thinkingText = await getThinkingContent(budgetTokens);
            if (thinkingText) {
              response.choices[0].message.reasoning_content = thinkingText;
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Invalid request', type: 'invalid_request_error' } }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: { message: 'Not found', type: 'not_found' } }));
});

const PORT = 3000;

// 启动时预加载文案，加载完成后再监听端口
initCopies().then((copies) => {
  console.log(`[sanders] 文案库就绪，共 ${copies.length} 条`);
  server.listen(PORT, () => {
    console.log(`Sanders Intelligence Labs API running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log('  GET  /v1/models');
    console.log('  POST /v1/chat/completions');
  });
}).catch(() => {
  // fetch 失败也能启动，使用 fallback
  server.listen(PORT, () => {
    console.log(`Sanders Intelligence Labs API running on http://localhost:${PORT} (fallback mode)`);
  });
});
