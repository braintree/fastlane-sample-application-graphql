import { fetchGraphql } from '../lib/fetch-graphql.js';

export async function createTransaction(req, res) {
  try {
    const { email, deviceData, paymentToken, shippingAddress } = req.body;

    const query = `
      mutation ($input: ChargeCreditCardInput!) {
        chargeCreditCard(input: $input) {
          transaction {
            id
            legacyId
            createdAt
            amount {
              value
              currencyCode
            }
            status
          }
        }
      }
    `;
    const variables = {
      input: {
        paymentMethodId: paymentToken.id,
        transaction: {
          amount: '1.00',
          riskData: { deviceData },
          shipping: {
            shippingAddress,
            shippingMethod: 'GROUND',
          },
          customerDetails: { email },
          vaultPaymentMethodAfterTransacting: {
            when: 'ON_SUCCESSFUL_TRANSACTION',
          },
        },
        options: {
          billingAddress: paymentToken.paymentSource.card.billingAddress,
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
    res.json({ result: data.chargeCreditCard.transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
