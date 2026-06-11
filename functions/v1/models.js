export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    object: 'list',
    data: [
      { id: 'gpt-4o-mini', object: 'model', created: 1727136000, owned_by: 'openai' },
      { id: 'gpt-4o', object: 'model', created: 1727136000, owned_by: 'openai' },
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
