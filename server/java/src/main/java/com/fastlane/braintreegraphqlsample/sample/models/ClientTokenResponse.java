package com.fastlane.braintreegraphqlsample.sample.models;

public class ClientTokenResponse {

    private String clientToken;

    public ClientTokenResponse(String clientToken) {
        this.clientToken = clientToken;
    }

    public String getClientToken() {
        return clientToken;
    }

    public void setClientToken(String clientToken) {
        this.clientToken = clientToken;
    }
}
