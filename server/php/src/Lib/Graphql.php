<?php

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\ResponseInterface;

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
