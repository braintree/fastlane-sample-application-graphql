<?php

use App\Controller\CheckoutController;
use App\Controller\ClientTokenController;
use App\Controller\TransactionController;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

return function (RoutingConfigurator $routes): void {
    $routes
        ->add("getCheckout", "/")
        ->controller([CheckoutController::class, "index"]);

    $routes
        ->add("getClientToken", "/client-token")
        ->controller([ClientTokenController::class, "getClientToken"]);

    $routes
        ->add("createTransaction", "/transaction")
        ->controller([TransactionController::class, "createTransaction"]);
};
