using Microsoft.Extensions.FileProviders;
using DotNetEnv;
using Braintree;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

Env.Load();

// Add services to the container.
builder.Services.Configure<TemplateSettings>(
    builder.Configuration.GetSection("TemplateSettings"));
builder.Services.AddSingleton<TemplatePathResolver>();
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddSingleton(sp =>
        new BraintreeGateway
        {
            Environment = Braintree.Environment.SANDBOX, // or Braintree.Environment.PRODUCTION for production
            MerchantId = System.Environment.GetEnvironmentVariable("BRAINTREE_MERCHANT_ID"),
            PublicKey = System.Environment.GetEnvironmentVariable("BRAINTREE_PUBLIC_KEY"),
            PrivateKey = System.Environment.GetEnvironmentVariable("BRAINTREE_PRIVATE_KEY"),
        });

var app = builder.Build();


app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(app.Environment.ContentRootPath, "../../client")),
    RequestPath = ""
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(app.Environment.ContentRootPath, "../../client")),
    RequestPath = "",
});

app.UseRouting();

app.MapControllers();

// Get port from environment variables or use default and run the server
var port = System.Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://localhost:{port}");
