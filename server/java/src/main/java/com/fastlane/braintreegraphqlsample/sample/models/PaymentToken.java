package com.fastlane.braintreegraphqlsample.sample.models;

public class PaymentToken {

    private String id;
    private PaymentCard paymentSource;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public PaymentCard getPaymentSource() {
        return paymentSource;
    }

    public void setPaymentSource(PaymentCard paymentSource) {
        this.paymentSource = paymentSource;
    }
}
