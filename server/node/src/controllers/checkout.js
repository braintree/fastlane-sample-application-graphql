export async function renderCheckout(req, res) {
  const isFlexibleIntegration = req.query.flexible !== undefined;

  const locals = {
    title:
      'Fastlane - Braintree GraphQL Integration' +
      (isFlexibleIntegration ? ' (Flexible)' : ''),
    prerequisiteScripts: `
      <script
        src="https://js.braintreegateway.com/web/3.104.0/js/client.min.js"
        defer
      ></script>
      <script
        src="https://js.braintreegateway.com/web/3.104.0/js/data-collector.min.js"
        defer
      ></script>
      <script
        src="https://js.braintreegateway.com/web/3.104.0/js/fastlane.min.js"
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
