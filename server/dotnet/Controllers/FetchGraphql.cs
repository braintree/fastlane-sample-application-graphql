using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

public class FetchGraphql
{
    private readonly string _apiBaseUrl;
    private readonly string _privateKey;
    private readonly string _publicKey;
    private readonly HttpClient _httpClient;

    public FetchGraphql()
    {
        _apiBaseUrl = Environment.GetEnvironmentVariable("BRAINTREE_API_BASE_URL") ?? "https://payments.sandbox.braintree-api.com";
        _privateKey = Environment.GetEnvironmentVariable("BRAINTREE_PRIVATE_KEY") ?? "";
        _publicKey = Environment.GetEnvironmentVariable("BRAINTREE_PUBLIC_KEY") ?? "";
        _httpClient = new HttpClient();
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
}
