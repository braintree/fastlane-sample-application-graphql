# frozen_string_literal: true

require 'bundler/setup'
require 'dotenv/load'
require 'webrick'
require 'mustache'
require 'uri'
require 'net/http'
require 'openssl'
require 'base64'
require 'json'

Dotenv.load

views_root = File.expand_path '../shared/views'
client_root = File.expand_path '../../client/html/src'

#######################################################################
## Token generation helpers
#######################################################################

class ClientTokenServlet < WEBrick::HTTPServlet::AbstractServlet
  def do_GET(_request, response)
    query = '
        mutation ($input: CreateClientTokenInput) {
          createClientToken(input: $input) {
            clientToken
          }
        }
      '

    query_variables = {
      input: {
        clientToken: {
          domains: ENV['DOMAINS'].split(','),
          merchantAccountId: ENV['BRAINTREE_MERCHANT_ID']
        }
      }
    }

    graphql_response = fetch_graphql({ query: query, variables: query_variables })

    obj_response = JSON.parse(graphql_response.body)

    data = obj_response['data']
    errors = obj_response['errors']

    if errors
      response.status = 500
      response.content_type = 'application/json'
      response.body = { error: errors }.to_json
      response
    end

    response.status = 200
    response.content_type = 'application/json'
    response.header['Access-Control-Allow-Origin'] = '*'
    response.header['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.body = { clientToken: data['createClientToken']['clientToken'] }.to_json
    response
  end
end

def fetch_graphql(payload)
  raise 'Missing API credentials' if !ENV['BRAINTREE_PRIVATE_KEY'] || !ENV['BRAINTREE_PUBLIC_KEY']

  api_key = Base64.strict_encode64(
    format('%<public_key>s:%<private_key>s', public_key: ENV['BRAINTREE_PUBLIC_KEY'],
                                             private_key: ENV['BRAINTREE_PRIVATE_KEY'])
  )

  headers = {
    'Content-Type': 'application/json',
    'Braintree-Version': '2024-08-01',
    'Authorization': format('Basic %<api_key>s', api_key: api_key)
  }

  uri = URI("#{ENV['BRAINTREE_API_BASE_URL']}/graphql")

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_NONE

  request = Net::HTTP::Post.new(uri, headers)
  request.body = payload.to_json
  request.content_type = 'application/json'

  http.request(request)
end

#######################################################################
## Serve checkout page
#######################################################################

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

    response['Content-Type'] = 'text/html;charset=UTF-8'
    response.body = rendered_template
  end
end

#######################################################################
## Process transactions
#######################################################################

class TransactionServlet < WEBrick::HTTPServlet::AbstractServlet
  def do_POST(request, response)
    request_body = JSON.parse(request.body)

    email = request_body['email']
    name = request_body['name']
    shipping_address = request_body['shippingAddress']
    payment_token = request_body['paymentToken']
    device_data = request_body['deviceData']

    query = '
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
      '

    query_variables = {
      input: {
        paymentMethodId: payment_token['id'],
        transaction: {
          amount: '1.00',
          riskData: { deviceData: device_data },
          shipping: {
            shippingAddress: shipping_address,
            shippingMethod: 'GROUND'
          },
          customerDetails: { email: email },
          vaultPaymentMethodAfterTransacting: {
            when: 'ON_SUCCESSFUL_TRANSACTION'
          }
        },
        options: {
          billingAddress: payment_token['paymentSource']['card']['billingAddress']
        }
      }
    }

    graphql_response = fetch_graphql({ query: query, variables: query_variables })

    obj_response = JSON.parse(graphql_response.body)

    data = obj_response['data']
    errors = obj_response['errors']

    if errors
      response.status = 500
      response.content_type = 'application/json'
      response.body = { error: errors }.to_json
      response
    end

    response.status = 201
    response.content_type = 'application/json'
    response.header['Access-Control-Allow-Origin'] = '*'
    response.header['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.body = { result: data['chargeCreditCard']['transaction'] }.to_json
    response
  end

  def do_OPTIONS(request, response)
    response.header['Access-Control-Allow-Origin'] = '*'
    response.header['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.header['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  end
end

#######################################################################
## Run the server
#######################################################################

server = WEBrick::HTTPServer.new Port: 8080, DocumentRoot: views_root

trap 'INT' do server.shutdown end

server.mount '/public', WEBrick::HTTPServlet::FileHandler, client_root
server.mount '/', CheckoutServlet, views_root
server.mount '/client-token', ClientTokenServlet
server.mount '/transaction', TransactionServlet

server.start
