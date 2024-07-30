package com.fastlane.braintreegraphqlsample.sample.models;

public class PaymentCard {

    private PaymentSource card;

    public PaymentSource getCard() {
        return card;
    }

    public void setCard(PaymentSource card) {
        this.card = card;
    }
}
