import 'dotenv/config';
import engines from 'consolidate';
import express from 'express';
import cors from 'cors';

const {
  BRAINTREE_API_BASE_URL = 'https://payments.sandbox.braintree-api.com', // use https://payments.braintree-api.com for production environment
  BRAINTREE_PRIVATE_KEY,
  BRAINTREE_PUBLIC_KEY,
  BRAINTREE_MERCHANT_ID,
  DOMAINS,
} = process.env;

/* ######################################################################
 * Token generation helpers
 * ###################################################################### */

async function getClientToken(_req, res) {
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

function fetchGraphql(payload) {
  if (!BRAINTREE_PRIVATE_KEY || !BRAINTREE_PUBLIC_KEY) {
    throw new Error('Missing API credentials');
  }

  const url = `${BRAINTREE_API_BASE_URL}/graphql`;

  const headers = new Headers();
  const apiKey = Buffer.from(
    `${BRAINTREE_PUBLIC_KEY}:${BRAINTREE_PRIVATE_KEY}`,
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

/* ######################################################################
 * Serve checkout page
 * ###################################################################### */

async function renderCheckout(req, res) {
  const isFlexibleIntegration = req.query.flexible !== undefined;

  const locals = {
    title:
      'Fastlane - Braintree GraphQL Integration' +
      (isFlexibleIntegration ? ' (Flexible)' : ''),
    prerequisiteScripts: `
      <script
        src="https://js.braintreegateway.com/web/3.116.2/js/client.min.js"
        defer
      ></script>
      <script
        src="https://js.braintreegateway.com/web/3.116.2/js/data-collector.min.js"
        defer
      ></script>
      <script
        src="https://js.braintreegateway.com/web/3.116.2/js/fastlane.min.js"
        defer
      ></script>
    `,
    initScriptPath: isFlexibleIntegration
      ? 'init-fastlane-flexible.js'
      : 'init-fastlane.js',
    stylesheetPath: 'styles.css',
  };

  res.render(isFlexibleIntegration ? 'checkout-flexible' : 'checkout', locals);
}

/* ######################################################################
 * Process transactions
 * ###################################################################### */

async function createTransaction(req, res) {
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

/* ######################################################################
 * Run the server
 * ###################################################################### */

function configureServer(app) {
  app.engine('html', engines.mustache);
  app.set('view engine', 'html');
  app.set('views', '../shared/views');

  app.enable('strict routing');

  app.use(cors());
  app.use(express.json());

  app.get('/', renderCheckout);
  app.get('/client-token', getClientToken);
  app.post('/transaction', createTransaction);

  app.use(express.static('../../client/html/src'));
}

const app = express();

configureServer(app);

const port = process.env.PORT ?? 8080;

app.listen(port, () => {
  console.log(`Fastlane Sample Application - Server listening at port ${port}`);
});
