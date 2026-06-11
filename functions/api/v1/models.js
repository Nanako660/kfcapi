export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    object: 'list',
    data: [
      { id: 'kfc-crazy-thursday', object: 'model', created: 1686935002, owned_by: 'kfc' },
      { id: 'kfc-original-recipe', object: 'model', created: 1686935002, owned_by: 'kfc' },
      { id: 'kfc-spicy-wings', object: 'model', created: 1686935002, owned_by: 'kfc' },
      { id: 'kfc-bucket-meal', object: 'model', created: 1686935002, owned_by: 'kfc' },
    ],
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
