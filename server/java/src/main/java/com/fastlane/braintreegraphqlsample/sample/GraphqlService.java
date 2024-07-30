package com.fastlane.braintreegraphqlsample.sample;

import io.github.cdimascio.dotenv.Dotenv;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GraphqlService {

    private final String BRAINTREE_API_BASE_URL;
    private final String BRAINTREE_PRIVATE_KEY;
    private final String BRAINTREE_PUBLIC_KEY;

    private final Dotenv dotenv;

    public GraphqlService() {
        this.dotenv = Dotenv.load();
        this.BRAINTREE_API_BASE_URL = this.dotenv.get("BRAINTREE_API_BASE_URL", "https://payments.sandbox.braintree-api.com");
        this.BRAINTREE_PRIVATE_KEY = this.dotenv.get("BRAINTREE_PRIVATE_KEY");
        this.BRAINTREE_PUBLIC_KEY = this.dotenv.get("BRAINTREE_PUBLIC_KEY");
    }

    public Map<String, ?> fetch(String query, Map<String, Object> variables) {
        String auth = BRAINTREE_PUBLIC_KEY + ":" + BRAINTREE_PRIVATE_KEY;
        String apiKey = new String(Base64.getEncoder().encode(auth.getBytes()));

        RestClient client = RestClient.builder()
            .baseUrl(BRAINTREE_API_BASE_URL)
            .defaultHeaders(httpHeaders -> {
                httpHeaders.add("Authorization", "Basic " + apiKey);
                httpHeaders.add("Braintree-Version", "2024-08-01");
            })
            .build();

        Map<String, Object> payload = new HashMap<>();
        payload.put("query", query);
        payload.put("variables", variables);

        ResponseEntity<Map> result = client
            .post()
            .uri("/graphql")
            .contentType(MediaType.APPLICATION_JSON)
            .body(payload)
            .retrieve()
            .toEntity(Map.class);

        return result.getBody();
    }
}
