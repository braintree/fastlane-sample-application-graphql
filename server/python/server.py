import os
import requests
import chevron

from flask import Flask, send_from_directory, request, jsonify, make_response
from dotenv import load_dotenv
from flask_cors import CORS
from requests.auth import HTTPBasicAuth

load_dotenv("../.env")

app = Flask(__name__)

app.config["TEMPLATES_FOLDER"] = os.path.abspath(
    os.path.join(app.root_path, "../shared/views")
)

CORS(app)

DOMAINS = os.getenv("DOMAINS", "")
BRAINTREE_API_BASE_URL = os.getenv(
    "BRAINTREE_API_BASE_URL", "https://payments.sandbox.braintree-api.com"
)  # use https://payments.braintree-api.com for production environment
BRAINTREE_PRIVATE_KEY = os.getenv("BRAINTREE_PRIVATE_KEY")
BRAINTREE_PUBLIC_KEY = os.getenv("BRAINTREE_PUBLIC_KEY")
BRAINTREE_MERCHANT_ID = os.getenv("BRAINTREE_MERCHANT_ID")


#######################################################################
## Token generation helpers
#######################################################################


def braintree_graphql_token():
    try:
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


def braintree_fetch_graphql(payload):
    try:
        if not BRAINTREE_PRIVATE_KEY or not BRAINTREE_PUBLIC_KEY:
            raise ValueError("Missing API credentials")

        url = f"{BRAINTREE_API_BASE_URL}/graphql"

        auth = HTTPBasicAuth(BRAINTREE_PUBLIC_KEY, BRAINTREE_PRIVATE_KEY)
        headers = {
            "Braintree-Version": "2024-08-01",
            "Content-Type": "application/json",
        }

        response = requests.post(url, headers=headers, auth=auth, json=payload)
        response.raise_for_status()

        return response.json()
    except Exception as error:
        print(error)
        return make_response(jsonify(error=str(error)), 500)


#######################################################################
## Serve checkout page
#######################################################################


def braintree_graphql_render(args, templates_folder):
    is_flexible_integration = "flexible" in args

    locals = {
        "title": "Fastlane - Braintree GraphQL Integration"
        + (" (Flexible)" if is_flexible_integration else ""),
        "prerequisiteScripts": """
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
        """,
        "initScriptPath": (
            "init-fastlane-flexible.js"
            if is_flexible_integration
            else "init-fastlane.js"
        ),
        "stylesheetPath": "styles.css",
    }

    template_name = (
        "checkout-flexible.html" if is_flexible_integration else "checkout.html"
    )

    template_path = os.path.join(templates_folder, template_name)
    with open(template_path, "r") as f:
        template = f.read()

    html = chevron.render(template, locals)
    return html


#######################################################################
## Process transactions
#######################################################################


def braintree_graphql_transaction(transactionData):
    try:
        payment_token = transactionData["paymentToken"]

        query = """
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


#######################################################################
## Run the server
#######################################################################


@app.route("/")
def bt_graphql_render():
    return braintree_graphql_render(request.args, app.config["TEMPLATES_FOLDER"])


@app.route("/client-token")
def bt_graphql_token():
    return braintree_graphql_token()


@app.route("/transaction", methods=["POST"])
def bt_graphql_transaction():
    return braintree_graphql_transaction(request.json)


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(
        os.path.join(app.root_path, "../../client/html/src"), filename
    )


# Run the server
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
