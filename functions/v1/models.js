export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    object: 'list',
    data: [
      { id: 'sanders-1-flash', object: 'model', created: 1686935002, owned_by: 'sanders' },
      { id: 'sanders-1-pro', object: 'model', created: 1686935002, owned_by: 'sanders' },
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
