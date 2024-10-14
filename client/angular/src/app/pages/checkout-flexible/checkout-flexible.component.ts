import { Component, ElementRef, Inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { lastValueFrom } from 'rxjs/internal/lastValueFrom';
import { BillingAddressData } from 'src/app/components/billing/billing.component';
import { CustomerResponse } from 'src/app/components/customer/customer.component';
import { ShippingAddressData } from 'src/app/components/shipping/shipping.component';
import { CustomWindow } from 'src/app/interfaces/window.interface';
import { TokenService } from 'src/app/services/token.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { WINDOW } from 'src/app/services/window.service';

enum Section {
    Customer = 'customer',
    Shipping = 'shipping',
    Billing = 'billing',
    Payment = 'payment'
}

@Component({
    selector: 'app-checkout-flexible',
    templateUrl: './checkout-flexible.component.html',
    styleUrls: ['../../app.component.css']
})
export class CheckoutFlexibleComponent implements OnInit {

    public currentSection = Section.Customer;

    public checkoutButtonEnabled = true;

    public fastlaneProfile: any;
    public fastlaneIdentity: any;
    public fastlaneDeviceData: any;
    public fastlaneCardComponent: any;
    public fastlaneWatermarkComponent: any;

    public currentCustomer: CustomerResponse = {
        authenticated: false,
        name: "",
        email: "",
        paymentToken: null
    };

    public constructor(
        @Inject(WINDOW)
        private window: CustomWindow,
        private _el: ElementRef,
        private tokenService: TokenService,
        private transactionService: TransactionService
    ) { }

    public get section(): typeof Section {
        return Section;
    }

    public async ngOnInit(): Promise<void> {
        const { clientToken } = await lastValueFrom(this.tokenService.getClientToken()) as { clientToken: string };

        const braintree = this.window.braintree;

        if (
            !braintree ||
            !braintree.client ||
            !braintree.dataCollector ||
            !braintree.fastlane
        ) {
            throw new Error('Failed to load all necessary Braintree scripts');
        }

        const clientInstance = await braintree.client.create({
            authorization: clientToken,
        });

        const dataCollectorInstance = await braintree.dataCollector.create({
            client: clientInstance,
        });

        const deviceData = dataCollectorInstance.deviceData;

        const {
            identity,
            profile,
            FastlaneCardComponent,
            FastlaneWatermarkComponent,
        } = await braintree.fastlane.create({
            authorization: clientToken,
            client: clientInstance,
            styles: { root: { backgroundColor: '#faf8f5' } }
        });

        this.fastlaneIdentity = identity;
        this.fastlaneProfile = profile;
        this.fastlaneDeviceData = deviceData;
        this.fastlaneCardComponent = await FastlaneCardComponent();
        this.fastlaneWatermarkComponent = await FastlaneWatermarkComponent();
    }

    public async onCheckoutButtonClick(): Promise<void> {

        this.checkoutButtonEnabled = false;

        const { name, email, shippingAddress, paymentToken: customerPaymentToken, billingAddress } = this.currentCustomer;

        const paymentToken = customerPaymentToken ?? await this.fastlaneCardComponent.getPaymentToken({ billingAddress });

        const shipping = this.getTransactionShippingAddressData(shippingAddress);

        this.transactionService
            .createTransaction({
                paymentToken,
                name,
                email,
                shippingAddress: shipping,
                deviceData: this.fastlaneDeviceData
            })
            .pipe(finalize(() => {
                this.checkoutButtonEnabled = true;
            }))
            .subscribe((response) => {
                const { result, error } = response;

                if (error) {
                    console.error(error);
                    return;
                }

                if (!result.id) {
                    console.error(result);
                    return;
                }
                
                const message = `Transaction ${result.id}: ${result.status}`;
                console.log(message);
                alert(message);
            });
    }

    public onEmailChange(nextCustomer: CustomerResponse): void {
        this.currentCustomer = nextCustomer;

        this.resetPaymentSection();

        if (this.currentCustomer.paymentToken) {
            this.fastlaneWatermarkComponent.render('#payment-watermark');
        } else {
            this.fastlaneCardComponent.render('#card-component');
        }

        if (this.currentCustomer.authenticated && this.currentCustomer.paymentToken) {
            this.setActiveSection(Section.Payment);
            return;
        }

        if (this.currentCustomer.authenticated) {
            this.setActiveSection(Section.Billing);
            return;
        }

        this.setActiveSection(Section.Shipping);
    }

    public async onShippingEditButtonClick() {
        if (!this.currentCustomer.authenticated) {
            this.setActiveSection(Section.Shipping);
            return;
        }

        const { selectionChanged, selectedAddress } = await this.fastlaneProfile.showShippingAddressSelector();

        if (selectionChanged) {
            this.currentCustomer.shippingAddress = selectedAddress;
        }
    }

    public onShippingChange(nextShipping: ShippingAddressData): void {
        this.currentCustomer.shippingAddress = nextShipping;
        this.setActiveSection(this.currentCustomer.paymentToken ? Section.Payment : Section.Billing);
    }
    
    public onBillingChange(nextBilling: BillingAddressData): void {
        this.currentCustomer.billingAddress = nextBilling;
        this.setActiveSection(Section.Payment);
    }

    public setActiveSection(nextSection: Section): void {
        this.currentSection = nextSection;
    }

    public async onPaymentEdit() {
        if (!this.currentCustomer.paymentToken) {
            this.setActiveSection(this.section.Payment);
            return;
        }

        const { selectionChanged, selectedCard } = await this.fastlaneProfile.showCardSelector();

        if (selectionChanged) {
            this.currentCustomer.paymentToken = selectedCard;
        }
    }

    private getTransactionShippingAddressData(shippingAddress: ShippingAddressData | undefined) {
        return shippingAddress && {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            company: shippingAddress.company,
            streetAddress: shippingAddress.streetAddress,
            extendedAddress: shippingAddress.extendedAddress,
            locality: shippingAddress.locality,
            region: shippingAddress.region,
            postalCode: shippingAddress.postalCode,
            countryCodeAlpha2: shippingAddress.countryCodeAlpha2,
            phoneNumber: shippingAddress.phoneCountryCode && shippingAddress.phoneNumber ?
                shippingAddress.phoneCountryCode +  shippingAddress.phoneNumber : undefined,
        };
    }

    private resetPaymentSection() {
        const paymentWatermark = this._el.nativeElement.querySelector("#payment-watermark");
        const cardComponent = this._el.nativeElement.querySelector("#card-component");

        paymentWatermark?.replaceChildren();
        cardComponent?.replaceChildren();
    }
}
