# frozen_string_literal: true

require 'webrick'
require 'json'
require_relative '../lib/fetch_graphql'

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
