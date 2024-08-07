<?php

namespace App\Controller;

use Env;
use Graphql;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ClientTokenController extends AbstractController
{
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
}
