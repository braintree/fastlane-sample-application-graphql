import { fetchGraphql } from '../lib/fetch-graphql.js';

const { DOMAINS, BRAINTREE_MERCHANT_ID } = process.env;

export async function getClientToken(_req, res) {
  try {
    const query = `
      mutation ($input: CreateClientTokenInput) {
        createClientToken(input: $input) {
          clientToken
        }
      }
    `;
    const variables = {
      input: {
        clientToken: {
          domains: DOMAINS.split(','),
          merchantAccountId: BRAINTREE_MERCHANT_ID,
        },
      },
    };
    const response = await fetchGraphql({ query, variables });
    const { data, errors } = await response.json();

    if (errors) {
      console.error(errors);
      res.status(500).json({ error: errors });
      return;
    }
    res.json({ clientToken: data.createClientToken.clientToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
