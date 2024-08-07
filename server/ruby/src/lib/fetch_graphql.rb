# frozen_string_literal: true

require 'uri'
require 'net/http'
require 'openssl'
require 'base64'

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
