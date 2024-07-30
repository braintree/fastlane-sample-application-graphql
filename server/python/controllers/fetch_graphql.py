import os
from flask import jsonify, make_response
import requests
from requests.auth import HTTPBasicAuth

DOMAINS = os.getenv("DOMAINS", "").split(",")
BRAINTREE_API_BASE_URL = os.getenv(
    "BRAINTREE_API_BASE_URL", "https://payments.sandbox.braintree-api.com"
)  # use https://payments.braintree-api.com for production environment
BRAINTREE_PRIVATE_KEY = os.getenv("BRAINTREE_PRIVATE_KEY")
BRAINTREE_PUBLIC_KEY = os.getenv("BRAINTREE_PUBLIC_KEY")


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
