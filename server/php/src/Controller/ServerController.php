<?php

namespace App\Controller;

use Mustache_Engine;
use Error;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\ResponseInterface;

class ServerController extends AbstractController
{
    private $mustache;

    public function __construct()
    {
        $this->mustache = new Mustache_Engine(["entity_flags" => ENT_QUOTES]);
    }

    /* ######################################################################
     * Token generation helpers
     * ###################################################################### */

    public function getClientToken(): Response
    {
        $query = '
            mutation ($input: CreateClientTokenInput) {
                createClientToken(input: $input) {
                clientToken
                }
            }
        ';

        $variables = [
            "input" => [
                "clientToken" => [
                    "domains" => explode(",", Env::get("DOMAINS")),
                    "merchantAccountId" => Env::get("BRAINTREE_MERCHANT_ID"),
                ],
            ],
        ];

        $response = Graphql::fetch($query, $variables)->toArray();

        if (array_key_exists("errors", $response)) {
            return new JsonResponse(["error" => $response["errors"]], 500);
        }

        return new JsonResponse([
            "clientToken" =>
                $response["data"]["createClientToken"]["clientToken"] ?? null,
        ]);
    }

    /* ######################################################################
     * Serve checkout page
     * ###################################################################### */

    public function index(Request $request)
    {
        $isFlexibleIntegration = $request->query->get("flexible", false);

        $locals = [
            "title" =>
                "Fastlane - Braintree GraphQL Integration" .
                ($isFlexibleIntegration ? " (Flexible)" : ""),
            "prerequisiteScripts" => '
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
            "initScriptPath" => $isFlexibleIntegration
                ? "init-fastlane-flexible.js"
                : "init-fastlane.js",
            "stylesheetPath" => "styles.css",
        ];

        $htmlTemplate = file_get_contents(
            __DIR__ .
                "/../../../shared/views/" .
                ($isFlexibleIntegration
                    ? "checkout-flexible.html"
                    : "checkout.html")
        );

        $template = $this->mustache->render($htmlTemplate, $locals);

        return new Response($template);
    }

    /* ######################################################################
     * Process transactions
     * ###################################################################### */

    public function createTransaction(Request $request)
    {
        $data = $request->toArray();

        $query = '
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
        ';

        $variables = [
            "input" => [
                "paymentMethodId" => $data["paymentToken"]["id"] ?? null,
                "transaction" => [
                    "amount" => "1.00",
                    "riskData" => [
                        "deviceData" => $data["deviceData"],
                    ],
                    "shipping" => [
                        "shippingAddress" => $data["shippingAddress"] ?? null,
                        "shippingMethod" => "GROUND",
                    ],
                    "customerDetails" => [
                        "email" => $data["email"],
                    ],
                    "vaultPaymentMethodAfterTransacting" => [
                        "when" => "ON_SUCCESSFUL_TRANSACTION",
                    ],
                ],
                "options" => [
                    "billingAddress" =>
                        $data["paymentToken"]["paymentSource"]["card"][
                            "billingAddress"
                        ] ?? [],
                ],
            ],
        ];

        $response = Graphql::fetch($query, $variables)->toArray();

        if (array_key_exists("errors", $response)) {
            return new JsonResponse(["error" => $response["errors"]], 500);
        }

        return new JsonResponse([
            "result" =>
                $response["data"]["chargeCreditCard"]["transaction"] ?? null,
        ]);
    }
}

class Env
{
    static function get(string $key): string|null
    {
        return $_ENV[$key] ?? null;
    }
}

class Graphql
{
    public static function fetch(
        string $query,
        array $variables
    ): ResponseInterface {
        if (
            !Env::get("BRAINTREE_PRIVATE_KEY") ||
            !Env::get("BRAINTREE_PUBLIC_KEY")
        ) {
            throw new Error("Missing API credentials");
        }

        $apiKey = self::getAPIKey();

        $httpClient = HttpClient::create();

        $requestParams = [
            "body" => json_encode([
                "query" => $query,
                "variables" => $variables,
            ]),
            "headers" => [
                "Authorization" => "Basic " . $apiKey,
                "Braintree-Version" => "2024-08-01",
                "Content-Type" => "application/json",
            ],
        ];

        $response = $httpClient->request(
            "POST",
            (Env::get("BRAINTREE_API_BASE_URL") ??
                "https://payments.sandbox.braintree-api.com") .
                "/graphql",
            $requestParams
        );

        return $response;
    }

    private static function getAPIKey(): string
    {
        return base64_encode(
            Env::get("BRAINTREE_PUBLIC_KEY") .
                ":" .
                Env::get("BRAINTREE_PRIVATE_KEY")
        );
    }
}
