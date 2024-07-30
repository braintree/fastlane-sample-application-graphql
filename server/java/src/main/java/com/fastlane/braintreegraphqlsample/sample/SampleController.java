package com.fastlane.braintreegraphqlsample.sample;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fastlane.braintreegraphqlsample.sample.models.ClientTokenResponse;
import com.fastlane.braintreegraphqlsample.sample.models.TransactionRequest;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

@RestController
public class SampleController {

    private final String title = "Fastlane - Braintree GraphQL Integration";
    private final String prerequisiteScripts =
        """
        <script src=\"https://js.braintreegateway.com/web/3.104.0/js/client.min.js\" defer></script>
        <script src=\"https://js.braintreegateway.com/web/3.104.0/js/data-collector.min.js\" defer ></script>
        <script src=\"https://js.braintreegateway.com/web/3.104.0/js/fastlane.min.js\" defer ></script>
        """;
    private final String initScriptPath = "init-fastlane%s.js";
    private final String stylesheetPath = "../../styles.css";

    private final Dotenv dotenv;
    private final ArrayList<String> DOMAINS;
    private final String MERCHANT_ID;

    private final GraphqlService graphqlService;

    public SampleController(GraphqlService graphqlService) {
        this.dotenv = Dotenv.load();
        this.DOMAINS = new ArrayList<>(Arrays.asList(dotenv.get("DOMAINS").split(",")));
        this.MERCHANT_ID = dotenv.get("BRAINTREE_MERCHANT_ID");

        this.graphqlService = graphqlService;
    }

    @GetMapping("/")
    public ModelAndView getCheckout(@RequestParam(name = "flexible", required = false) String isFlexible, Model model) {
        model.addAttribute("title", isFlexible != null ? title + " (Flexible)" : title);
        model.addAttribute("prerequisiteScripts", prerequisiteScripts);
        model.addAttribute(
            "initScriptPath",
            isFlexible != null ? String.format(initScriptPath, "-flexible") : String.format(initScriptPath, "")
        );
        model.addAttribute("stylesheetPath", stylesheetPath);

        String page = isFlexible != null ? "checkout-flexible" : "checkout";

        return new ModelAndView(page, model.asMap());
    }

    @GetMapping("/client-token")
    public ResponseEntity<?> getClientToken() {
        try {
            String query =
                """
                    mutation ($input: CreateClientTokenInput) {
                        createClientToken(input: $input) {
                          clientToken
                        }
                      }
                """;

            Map<String, Object> variables = new HashMap<>();
            Map<String, Object> input = new HashMap<>();
            Map<String, Object> clientToken = new HashMap<>();

            clientToken.put("domains", DOMAINS);
            clientToken.put("merchantAccountId", MERCHANT_ID);
            input.put("clientToken", clientToken);
            variables.put("input", input);

            Map<String, ?> response = graphqlService.fetch(query, variables);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.valueToTree(response);

            if (rootNode.has("errors")) {
                return new ResponseEntity<>(rootNode.path("errors"), HttpStatus.INTERNAL_SERVER_ERROR);
            }

            String clientTokenResponse = rootNode.at("/data/createClientToken/clientToken").textValue();

            return new ResponseEntity<>(new ClientTokenResponse(clientTokenResponse), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            System.err.println(e);
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/transaction")
    public ResponseEntity<?> createTransaction(@RequestBody TransactionRequest body) {
        try {
            String query =
                """
                    mutation ($input: ChargeCreditCardInput!) {
                        chargeCreditCard(input: $input) {
                            transaction {
                                id
                                status
                            }
                        }
                    }
                """;

            Map<String, Object> variables = new HashMap<>() {
                {
                    put(
                        "input",
                        new HashMap<>() {
                            {
                                put("paymentMethodId", body.getPaymentToken().getId());
                                put(
                                    "transaction",
                                    new HashMap<>() {
                                        {
                                            put("amount", "1.00");
                                            put(
                                                "riskData",
                                                new HashMap<>() {
                                                    {
                                                        put("deviceData", body.getDeviceData());
                                                    }
                                                }
                                            );
                                            put(
                                                "shipping",
                                                new HashMap<>() {
                                                    {
                                                        put("shippingMethod", "GROUND");
                                                        put("shippingAddress", body.getShippingAddress());
                                                    }
                                                }
                                            );
                                            put(
                                                "customerDetails",
                                                new HashMap<>() {
                                                    {
                                                        put("email", body.getEmail());
                                                    }
                                                }
                                            );
                                            put(
                                                "vaultPaymentMethodAfterTransacting",
                                                new HashMap<>() {
                                                    {
                                                        put("when", "ON_SUCCESSFUL_TRANSACTION");
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );
                                put(
                                    "options",
                                    new HashMap<>() {
                                        {
                                            put("billingAddress", body.getPaymentToken().getPaymentSource().getCard().getBillingAddress());
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            };

            Map<String, ?> transactionResponse = graphqlService.fetch(query, variables);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.valueToTree(transactionResponse);
            Map<String, Object> mapResponse = new HashMap<>();

            if (rootNode.has("errors")) {
                mapResponse.put("errors", rootNode.path("errors"));
                return new ResponseEntity<>(mapResponse, HttpStatus.INTERNAL_SERVER_ERROR);
            }

            mapResponse.put("result", rootNode.at("/data/chargeCreditCard/transaction"));

            return new ResponseEntity<>(mapResponse, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
