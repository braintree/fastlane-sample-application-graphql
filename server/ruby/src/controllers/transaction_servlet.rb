# frozen_string_literal: true

require 'webrick'
require 'json'
require_relative '../lib/fetch_graphql'

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
      response.header['Access-Control-Allow-Origin'] = '*'
      response.header['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
      response.body = { error: errors }.to_json
      response
    end

    response.status = 201
    response.content_type = 'application/json'
    response.body = { result: data['chargeCreditCard']['transaction'] }.to_json
    response
  end
end
