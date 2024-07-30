package com.fastlane.braintreegraphqlsample.sample.models;

public class PaymentSource {

    private String brand;
    private String expiry;
    private String lastDigits;
    private String name;
    private Billing billingAddress;

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getExpiry() {
        return expiry;
    }

    public void setExpiry(String expiry) {
        this.expiry = expiry;
    }

    public String getLastDigits() {
        return lastDigits;
    }

    public void setLastDigits(String lastDigits) {
        this.lastDigits = lastDigits;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Billing getBillingAddress() {
        return billingAddress;
    }

    public void setBillingAddress(Billing billingAddress) {
        this.billingAddress = billingAddress;
    }
}
