import os
import chevron


def braintree_graphql_render(args, templates_folder):
    is_flexible_integration = "flexible" in args

    locals = {
        "title": "Fastlane - Braintree GraphQL Integration"
        + (" (Flexible)" if is_flexible_integration else ""),
        "prerequisiteScripts": """
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
        """,
        "initScriptPath": (
            "init-fastlane-flexible.js"
            if is_flexible_integration
            else "init-fastlane.js"
        ),
        "stylesheetPath": "styles.css",
    }

    template_name = (
        "checkout-flexible.html" if is_flexible_integration else "checkout.html"
    )

    template_path = os.path.join(templates_folder, template_name)
    with open(template_path, "r") as f:
        template = f.read()

    html = chevron.render(template, locals)
    return html
