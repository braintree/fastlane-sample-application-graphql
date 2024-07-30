using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

[ApiController]
public class ClientTokenGraphQLController : Controller
{
    private readonly FetchGraphql _fetchGraphql;

    public ClientTokenGraphQLController()
    {
        _fetchGraphql = new FetchGraphql();
    }

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

            var jsonResponse = await _fetchGraphql.FetchGraphqlAsync(payload);

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
}
