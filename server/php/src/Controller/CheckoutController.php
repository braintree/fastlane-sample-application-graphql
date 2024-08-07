<?php

namespace App\Controller;

use Mustache_Engine;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class CheckoutController extends AbstractController
{
    private $mustache;

    public function __construct()
    {
        $this->mustache = new Mustache_Engine(["entity_flags" => ENT_QUOTES]);
    }

    public function index(Request $request)
    {
        $isFlexibleIntegration = $request->query->get("flexible", false);

        $locals = [
            "title" =>
                "Fastlane - Braintree SDK Integration" .
                ($isFlexibleIntegration ? " (Flexible)" : ""),
            "prerequisiteScripts" => '
                <script
                    src="https://js.braintreegateway.com/web/3.104.0/js/client.min.js"
                    defer
                ></script>
                <script
                    src="https://js.braintreegateway.com/web/3.104.0/js/data-collector.min.js"
                    defer
                ></script>
                <script
                    src="https://js.braintreegateway.com/web/3.104.0/js/fastlane.min.js"
                    defer
                ></script>
            ',
            "initScriptPath" => $isFlexibleIntegration
                ? "init-fastlane-flexible.js"
                : "init-fastlane.js",
            "stylesheetPath" => "styles.css",
        ];

        $htmlTemplate = file_get_contents(
            __DIR__ . "/../../../shared/views/checkout.html"
        );

        $template = $this->mustache->render($htmlTemplate, $locals);

        return new Response($template);
    }
}
