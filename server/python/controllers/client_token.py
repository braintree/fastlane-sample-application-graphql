import os
from flask import jsonify, make_response
from .fetch_graphql import braintree_fetch_graphql

DOMAINS = os.getenv("DOMAINS", "").split(",")


def braintree_graphql_token():
    try:
        DOMAINS = os.getenv("DOMAINS")
        BRAINTREE_MERCHANT_ID = os.getenv("BRAINTREE_MERCHANT_ID")

        query = """
        mutation ($input: CreateClientTokenInput) {
            createClientToken(input: $input) {
                clientToken
            }
        }
        """
        variables = {
            "input": {
                "clientToken": {
                    "domains": DOMAINS.split(","),
                    "merchantAccountId": BRAINTREE_MERCHANT_ID,
                }
            }
        }

        payload = {"query": query, "variables": variables}
        response = braintree_fetch_graphql(payload)

        if "errors" in response:
            errors = response["errors"]
            print(errors)
            return jsonify({"error": errors}), 500

        client_token = response["data"]["createClientToken"]["clientToken"]
        return jsonify({"clientToken": client_token})

    except Exception as error:
        print(error)
        return make_response(jsonify(error=str(error)), 500)
