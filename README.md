# Fastlane Sample Application

This sample app demonstrates how to integrate with Fastlane using Braintree's GraphQL API.

## Before You Code

1. **Setup a Braintree Sandbox Account**

    To get started, you'll need a Braintree Sandbox Account.

    [Sign Up](https://www.braintreepayments.com/sandbox) or [Log In](https://sandbox.braintreegateway.com/login)

1. **Braintree Credentials**

    Once you've setup a Braintree Sandbox Account, you will need to take note of your Merchant ID, public key, and private key.

## How to Run Locally

1. Clone the repository by running the following command in your terminal:
    ```
    git clone https://github.com/braintree/fastlane-sample-application-graphql.git
    ```
2. Copy the `.env.example` file from the `server` folder and paste it into the folder for the server technology you want to use as `.env`. For example (substitute `node` for the technology of your choice):
    ```
    cd fastlane-sample-application-graphql/server
    cp .env.example node/.env
    cd node
    ```
    To run this application, you will need this folder and the `shared` folder. The other folders under `server` can be safely deleted or ignored.
3. Open the `.env` file in a text editor and replace the placeholders with the appropriate values.
4. Follow the instructions in your chosen folder's README.

## Client Integrations

### Quick Start Integration

#### Overview
Fastlane Quick Start Integration uses PayPal's pre-built UI for payment collection, thereby allowing you to integrate quickly and easily. The Fastlane Payment Component will automatically render the following:
1. Customer's selected card and "Change" link which allows users to choose a different saved card or use a new card (for Fastlane members)
2. Credit card and billing address fields (for Guest users or for Fastlane members who don't have an accepted card in their profile)

#### Key Features
- Quickest way to integrate Fastlane
- Pre-formatted display to show Fastlane members their selected payment method
- Payment form including billing address for Guest users
- Data Security: Quick Start Integration is PCI DSS compliant, ensuring that customer payment information is handled securely

### Flexible Integration

#### Overview
Fastlane Flexible Integration allows you to customize and style your payment page according to the look and feel of your website. The Fastlane Card Component renders input fields for Guest users to enter their credit card details, while the Card Selector provides an interface for Fastlane members to choose a different saved card or use a new card. You will be responsible for:
1. Showing the selected payment method, the Fastlane watermark, and a button to open the Card Selector (for Fastlane members)
2. Collecting billing address information and rendering the Fastlane Card Component (for Guest users and Fastlane members who don't have an accepted card in their profile)

#### Key Features
- Further customize the behavior and experience of your checkout
- Data Security: Flexible Integration is PCI DSS compliant, ensuring that customer payment information is handled securely
