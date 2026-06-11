export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    object: 'list',
    data: [
      {
        id: 'sanders-1-flash',
        object: 'model',
        created: 1686935002,
        owned_by: 'sanders',
        type: 'chat',
        max_input_tokens: 131072,
        max_output_tokens: 16384,
        supports_reasoning: false,
        capabilities: ['chat', 'function_calling'],
      },
      {
        id: 'sanders-1-pro',
        object: 'model',
        created: 1686935002,
        owned_by: 'sanders',
        type: 'chat',
        max_input_tokens: 1048576,
        max_output_tokens: 16384,
        supports_reasoning: true,
        reasoning_budget_max: 4000,
        capabilities: ['chat', 'reasoning', 'function_calling'],
      },
    ],
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
