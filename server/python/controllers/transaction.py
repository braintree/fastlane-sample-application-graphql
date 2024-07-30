from flask import jsonify, make_response
from .fetch_graphql import braintree_fetch_graphql


def braintree_graphql_transaction(transactionData):
    try:
        payment_token = transactionData["paymentToken"]

        query = """
        mutation ($input: ChargeCreditCardInput!) {
            chargeCreditCard(input: $input) {
                transaction {
                    id
                    status
                }
            }
        }
        """

        variables = {
            "input": {
                "paymentMethodId": payment_token["id"],
                "transaction": {
                    "amount": "1.00",
                    "riskData": {"deviceData": transactionData["deviceData"]},
                    "shipping": {
                        "shippingAddress": transactionData["shippingAddress"],
                        "shippingMethod": "GROUND",
                    },
                    "customerDetails": {
                        "email": transactionData["email"],
                    },
                    "vaultPaymentMethodAfterTransacting": {
                        "when": "ON_SUCCESSFUL_TRANSACTION"
                    },
                },
                "options": {
                    "billingAddress": payment_token["paymentSource"]["card"][
                        "billingAddress"
                    ]
                },
            }
        }

        payload = {"query": query, "variables": variables}
        response = braintree_fetch_graphql(payload)

        if "errors" in response:
            errors = response["errors"]
            print(errors)
            return jsonify({"error": errors}), 500

        result = response["data"]["chargeCreditCard"]["transaction"]
        return jsonify({"result": result})

    except Exception as error:
        print(error)
        return make_response(jsonify(error=str(error)), 500)
