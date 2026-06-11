export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    object: 'list',
    data: [
      { id: 'kfc-crazy-thursday', object: 'model', created: 1686935002, owned_by: 'kfc' },
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
