import { useScript } from '@unhead/vue';

export async function loadExternalScripts() {
  const client = useScript(
    'https://js.braintreegateway.com/web/3.106.0/js/client.min.js',
    {
      async: true,
    },
  );
  const dataCollector = useScript(
    'https://js.braintreegateway.com/web/3.106.0/js/data-collector.min.js',
    { async: true },
  );
  const fastlane = useScript(
    'https://js.braintreegateway.com/web/3.106.0/js/fastlane.min.js',
    {
      async: true,
    },
  );

  await Promise.all([client, dataCollector, fastlane]);
}

export default {
  async install(app) {
    app.config.globalProperties.$braintree = window.braintree;
    app.provide('braintree', app.config.globalProperties.$braintree);
  },
};
