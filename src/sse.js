function generateId() {
  return 'kfc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatSSEChunk(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function createStreamChunk(id, content, finishReason = null) {
  return {
    id,
    object: 'chat.completion.chunk',
    model: 'kfc-crazy-thursday',
    choices: [{
      index: 0,
      delta: content !== null ? { content } : {},
      finish_reason: finishReason,
    }],
  };
}

function createStreamStart(id) {
  return {
    id,
    object: 'chat.completion.chunk',
    model: 'kfc-crazy-thursday',
    choices: [{
      index: 0,
      delta: { role: 'assistant' },
      finish_reason: null,
    }],
  };
}

function createUsageChunk(id, promptTokens, completionTokens) {
  return {
    id,
    object: 'chat.completion.chunk',
    model: 'kfc-crazy-thursday',
    choices: [],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

function createNonStreamingResponse(id, content) {
  return {
    id,
    object: 'chat.completion',
    model: 'kfc-crazy-thursday',
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
  createStreamChunk,
  createStreamStart,
  createUsageChunk,
  createNonStreamingResponse,
};
