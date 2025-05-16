using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http.Headers;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Controllers
{
    public class ServerController(TemplatePathResolver _templatePathResolver) : Controller
    {
        private readonly string _apiBaseUrl = Environment.GetEnvironmentVariable("BRAINTREE_API_BASE_URL") ?? "https://payments.sandbox.braintree-api.com";
        private readonly string _privateKey = Environment.GetEnvironmentVariable("BRAINTREE_PRIVATE_KEY") ?? "";
        private readonly string _publicKey = Environment.GetEnvironmentVariable("BRAINTREE_PUBLIC_KEY") ?? "";
        private readonly HttpClient _httpClient = new();

        /* ######################################################################
         * Token generation helpers
         * ###################################################################### */

        [HttpGet("client-token")]
        public async Task<IActionResult> GetClientToken()
        {
            try
            {
                var domains = Environment.GetEnvironmentVariable("DOMAINS")?.Split(',');
                var merchantId = Environment.GetEnvironmentVariable("BRAINTREE_MERCHANT_ID");

                if (domains == null || string.IsNullOrEmpty(merchantId))
                {
                    throw new InvalidOperationException("Missing required environment variables.");
                }

                var query = @"
                    mutation ($input: CreateClientTokenInput) {
                        createClientToken(input: $input) {
                            clientToken
                        }
                    }
                ";

                var variables = new
                {
                    input = new
                    {
                        clientToken = new
                        {
                            domains,
                            merchantAccountId = merchantId
                        }
                    }
                };

                var payload = JsonSerializer.Serialize(new { query, variables });

                var jsonResponse = await FetchGraphqlAsync(payload);

                using var document = JsonDocument.Parse(jsonResponse);
                var clientToken = document.RootElement
                                        .GetProperty("data")
                                        .GetProperty("createClientToken")
                                        .GetProperty("clientToken")
                                        .GetString();

                return Ok(new { clientToken });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        public async Task<string> FetchGraphqlAsync(string payload)
        {
            if (string.IsNullOrEmpty(_privateKey) || string.IsNullOrEmpty(_publicKey))
            {
                throw new InvalidOperationException("Missing API credentials");
            }

            var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_publicKey}:{_privateKey}"));

            var request = new HttpRequestMessage(HttpMethod.Post, $"{_apiBaseUrl}/graphql");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", auth);
            request.Headers.Add("Braintree-Version", "2024-08-01");

            request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            response.EnsureSuccessStatusCode();
            return responseContent;
        }

        /* ######################################################################
         * Serve checkout page
         * ###################################################################### */

        [HttpGet("/")]
        public async Task<IActionResult> GraphQLRender()
        {
            var isFlexibleIntegration = false;
            var queryParams = HttpContext.Request.Query;

            foreach (var param in queryParams)
            {
                if (param.Key == "flexible")
                {
                    isFlexibleIntegration = true;
                }
            }

            var locals = new Dictionary<string, string>
        {
            { "title", "Fastlane - Braintree GraphQL Integration" + (isFlexibleIntegration ? " (Flexible)" : "") },
            { "prerequisiteScripts", @"
                <script
                    src=""https://js.braintreegateway.com/web/3.116.2/js/client.min.js""
                    defer
                ></script>
                <script
                    src=""https://js.braintreegateway.com/web/3.116.2/js/data-collector.min.js""
                    defer
                ></script>
                <script
                    src=""https://js.braintreegateway.com/web/3.116.2/js/fastlane.min.js""
                    defer
                ></script>
            " },
            { "initScriptPath", isFlexibleIntegration ? "init-fastlane-flexible.js" : "init-fastlane.js" },
            { "stylesheetPath", "styles.css" }
        };

            var renderedHtml = await _templatePathResolver.RenderTemplateAsync(isFlexibleIntegration, locals);

            return Content(renderedHtml, "text/html", Encoding.UTF8);
        }

       /* ######################################################################
        * Process transactions
        * ###################################################################### */

        [HttpPost("transaction")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateTransactionRequest request)
        {
            try
            {
                var query = @"
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
                ";

                var variables = new
                {
                    input = new
                    {
                        paymentMethodId = request.PaymentToken?.Id,
                        transaction = new
                        {
                            amount = "1.00",
                            riskData = new
                            {
                                deviceData = request?.DeviceData
                            },
                            shipping = new
                            {
                                shippingAddress = (request?.ShippingAddress) ?? null,
                                shippingMethod = "GROUND"
                            },
                            customerDetails = new
                            {
                                email = request?.Email,
                            },
                            vaultPaymentMethodAfterTransacting = new
                            {
                                when = "ON_SUCCESSFUL_TRANSACTION"
                            }
                        },
                        options = new
                        {
                            billingAddress = request?.PaymentToken?.PaymentSource?.Card?.BillingAddress
                        }
                    }
                };

                var payload = JsonSerializer.Serialize(new { query, variables });

                var jsonResponse = await FetchGraphqlAsync(payload);

                using var document = JsonDocument.Parse(jsonResponse);
                var transactionElement = document.RootElement
                                                  .GetProperty("data")
                                                  .GetProperty("chargeCreditCard")
                                                  .GetProperty("transaction");

                var result = new
                {
                    Id = transactionElement.GetProperty("id").GetString(),
                    Status = transactionElement.GetProperty("status").GetString()
                };

                return Ok(new { result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    /* ######################################################################
     * Models
     * ###################################################################### */

    public class CreateTransactionRequest
    {
        public PaymentToken? PaymentToken { get; set; }
        public required string DeviceData { get; set; }
        public required string Email { get; set; }
        public Address? ShippingAddress { get; set; }
    }

    public class Card
    {
        public Address? BillingAddress { get; set; }
    }

    public class PaymentSource
    {
        public Card? Card { get; set; }
    }

    public class PaymentToken
    {
        public string? Id { get; set; }
        public PaymentSource? PaymentSource { get; set; }
    }

    public class Address
    {
        [JsonPropertyName("streetAddress")]
        public string? StreetAddress { get; set; }

        [JsonPropertyName("addressLine1")]
        public string? AddressLine1 { get; set; }

        [JsonPropertyName("extendedAddress")]
        public string? ExtendedAddress { get; set; }

        [JsonPropertyName("addressLine2")]
        public string? AddressLine2 { get; set; }

        [JsonPropertyName("locality")]
        public string? Locality { get; set; }

        [JsonPropertyName("adminArea1")]
        public string? AdminArea1 { get; set; }

        [JsonPropertyName("adminArea2")]
        public string? AdminArea2 { get; set; }

        [JsonPropertyName("region")]
        public string? Region { get; set; }

        [JsonPropertyName("postalCode")]
        public string? PostalCode { get; set; }

        [JsonPropertyName("countryCode")]
        public string? CountryCode { get; set; }

        [JsonPropertyName("countryCodeAlpha2")]
        public string? CountryCodeAlpha2 { get; set; }

        [JsonPropertyName("firstName")]
        public string? FirstName { get; set; }

        [JsonPropertyName("lastName")]
        public string? LastName { get; set; }

        [JsonPropertyName("phoneNumber")]
        public string? PhoneNumber { get; set; }
    }
}