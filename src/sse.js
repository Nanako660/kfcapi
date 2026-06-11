function generateId() {
  return 'kfc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatSSEChunk(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * 将内容按目标 tps（40~100）切分为帧。
 *
 * 核心设计：
 *  - Node.js setTimeout 最小精度约 15ms，固定 TICK=15ms
 *  - 每帧发字符数 = tps × TICK/1000（可能为小数，用"令牌桶"积累）
 *  - tps 每隔 8~16 字平滑漂移 ±30，在 40~100 范围内震荡
 *  - 偶发卡顿（2%每帧）：插入一个 60~150ms 空帧
 *  → tps=40: 每帧 0.6 字（积累 2 帧后发 1 字）
 *  → tps=70: 每帧 1.05 字（约每帧 1 字）
 *  → tps=100: 每帧 1.5 字（积累 2 帧后发 3 字）
 *
 * 返回: Array<{ text: string, delay: number }>
 */
function buildTypingFrames(content) {
  const MIN_TPS = 40;
  const MAX_TPS = 100;
  const TICK = 15; // ms，贴近 setTimeout 真实最小粒度

  const frames = [];
  let tps = MIN_TPS + Math.random() * (MAX_TPS - MIN_TPS);
  let driftAt = 8 + Math.floor(Math.random() * 8);
  let charsSinceDrift = 0;
  let tokenBucket = 0; // 积累的"应发字符"令牌（小数）
  let i = 0;

  while (i < content.length) {
    // tps 漂移
    charsSinceDrift++;
    if (charsSinceDrift >= driftAt) {
      charsSinceDrift = 0;
      driftAt = 8 + Math.floor(Math.random() * 8);
      tps = Math.min(MAX_TPS, Math.max(MIN_TPS, tps + (Math.random() - 0.5) * 60));
    }

    // 本帧应发字符令牌数
    tokenBucket += tps * TICK / 1000;
    const toSend = Math.floor(tokenBucket);
    tokenBucket -= toSend;

    if (toSend === 0) {
      // 令牌不足，等一帧但不发字符
      frames.push({ text: '', delay: TICK });
      continue;
    }

    // 采集 toSend 个字符
    let batch = '';
    for (let k = 0; k < toSend && i < content.length; k++) {
      batch += content[i++];
    }

    frames.push({ text: batch, delay: TICK });

    // 偶发卡顿（2%）
    if (Math.random() < 0.02) {
      frames.push({ text: '', delay: 60 + Math.random() * 90 });
    }
  }

  return frames;
}

function createStreamChunk(id, content, finishReason = null, model = 'kfc-crazy-thursday') {
  return {
    id,
    object: 'chat.completion.chunk',
    model,
    choices: [{
      index: 0,
      delta: content !== null ? { content } : {},
      finish_reason: finishReason,
    }],
  };
}

function createStreamStart(id, model = 'kfc-crazy-thursday') {
  return {
    id,
    object: 'chat.completion.chunk',
    model,
    choices: [{
      index: 0,
      delta: { role: 'assistant' },
      finish_reason: null,
    }],
  };
}

function createUsageChunk(id, promptTokens, completionTokens, model = 'kfc-crazy-thursday') {
  return {
    id,
    object: 'chat.completion.chunk',
    model,
    choices: [],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

function createNonStreamingResponse(id, content, model = 'kfc-crazy-thursday') {
  return {
    id,
    object: 'chat.completion',
    model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: 10,
      completion_tokens: content.length,
      total_tokens: 10 + content.length,
    },
  };
}

export {
  generateId,
  formatSSEChunk,
  buildTypingFrames,
  createStreamChunk,
  createStreamStart,
  createUsageChunk,
  createNonStreamingResponse,
};
