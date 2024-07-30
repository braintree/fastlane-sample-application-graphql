package com.fastlane.braintreegraphqlsample.sample.models;

public class TransactionRequest {

    private String email;
    private String deviceData;
    private Customer name;
    private PaymentToken paymentToken;
    private Shipping shippingAddress;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDeviceData() {
        return deviceData;
    }

    public void setDeviceData(String deviceData) {
        this.deviceData = deviceData;
    }

    public PaymentToken getPaymentToken() {
        return paymentToken;
    }

    public void setPaymentToken(PaymentToken paymentToken) {
        this.paymentToken = paymentToken;
    }

    public Shipping getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(Shipping shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public Customer getName() {
        return name;
    }

    public void setName(Customer name) {
        this.name = name;
    }
}
