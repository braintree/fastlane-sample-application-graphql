const {
  BRAINTREE_API_BASE_URL = 'https://payments.sandbox.braintree-api.com', // use https://payments.braintree-api.com for production environment
  BRAINTREE_PRIVATE_KEY,
  BRAINTREE_PUBLIC_KEY,
} = process.env;

export function fetchGraphql(payload) {
  if (!BRAINTREE_PRIVATE_KEY || !BRAINTREE_PUBLIC_KEY) {
    throw new Error('Missing API credentials');
  }

  const url = `${BRAINTREE_API_BASE_URL}/graphql`;

  const headers = new Headers();
  const apiKey = Buffer.from(
    `${BRAINTREE_PUBLIC_KEY}:${BRAINTREE_PRIVATE_KEY}`
  ).toString('base64');
  headers.append('Authorization', `Basic ${apiKey}`);
  headers.append('Braintree-Version', '2024-08-01');
  headers.append('Content-Type', 'application/json');

  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}
