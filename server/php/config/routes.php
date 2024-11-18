<?php

use App\Controller\ServerController;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

return function (RoutingConfigurator $routes): void {
    $routes
        ->add("getCheckout", "/")
        ->controller([ServerController::class, "index"]);

    $routes
        ->add("getClientToken", "/client-token")
        ->controller([ServerController::class, "getClientToken"]);

    $routes
        ->add("createTransaction", "/transaction")
        ->controller([ServerController::class, "createTransaction"]);
};
