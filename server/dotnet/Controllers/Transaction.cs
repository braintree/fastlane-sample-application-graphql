using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
public class ClientTransactionGraphQLController : Controller
{
    private readonly FetchGraphql _fetchGraphql;

    public ClientTransactionGraphQLController()
    {
        _fetchGraphql = new FetchGraphql();
    }

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

            var jsonResponse = await _fetchGraphql.FetchGraphqlAsync(payload);

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