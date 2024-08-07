<?php

namespace App\Controller;

use Graphql;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class TransactionController extends AbstractController
{
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
                        "shippingAddress" => $data["shippingAddress"],
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
