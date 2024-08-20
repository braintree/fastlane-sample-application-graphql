# frozen_string_literal: true

require 'mustache'
require 'webrick'

class CheckoutServlet < WEBrick::HTTPServlet::AbstractServlet
  def initialize(server, document_root)
    super(server)
    @document_root = document_root
  end

  def do_GET(request, response)
    is_flexible_integration = request.query.key?('flexible')

    data = {
      title: "Fastlane - Braintree GraphQL Integration#{is_flexible_integration ? ' (Flexible)' : ''}",
      prerequisiteScripts: '
        <script
          src="https://js.braintreegateway.com/web/3.106.0/js/client.min.js"
          defer
        ></script>
        <script
          src="https://js.braintreegateway.com/web/3.106.0/js/data-collector.min.js"
          defer
        ></script>
        <script
          src="https://js.braintreegateway.com/web/3.106.0/js/fastlane.min.js"
          defer
        ></script>
      ',
      initScriptPath: is_flexible_integration ? '/public/init-fastlane-flexible.js' : '/public/init-fastlane.js',
      stylesheetPath: '/public/styles.css'
    }

    template_path = File.join(@document_root, is_flexible_integration ? 'checkout-flexible.html' : 'checkout.html')
    template = File.read(template_path)
    rendered_template = Mustache.render(template, data)

    response['Content-Type'] = 'text/html'
    response.body = rendered_template
  end
end
