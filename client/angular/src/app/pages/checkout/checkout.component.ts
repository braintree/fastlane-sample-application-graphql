import { Component, Inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { lastValueFrom } from 'rxjs/internal/lastValueFrom';
import { CustomerResponse } from 'src/app/components/customer/customer.component';
import { ShippingAddressFormData } from 'src/app/components/shipping/shipping.component';
import { CustomWindow } from 'src/app/interfaces/window.interface';
import { TokenService } from 'src/app/services/token.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { WINDOW } from 'src/app/services/window.service';

enum Section {
    Customer = 'customer',
    Shipping = 'shipping',
    Payment = 'payment'
}

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.component.html',
    styleUrls: ['../../app.component.css']
})
export class CheckoutComponent implements OnInit {

    public currentSection = Section.Customer;

    public checkoutButtonEnabled = true;

    public fastlaneProfile: any;
    public fastlaneIdentity: any;
    public fastlaneDeviceData: any;
    public fastlanePaymentComponent: any;
    public fastlaneWatermarkComponent: any;

    public currentCustomer: CustomerResponse = {
        authenticated: false,
        name: "",
        email: "",
        paymentToken: {}
    };

    public constructor(
        @Inject(WINDOW)
        private window: CustomWindow,
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
            FastlanePaymentComponent,
            FastlaneWatermarkComponent,
        } = await braintree.fastlane.create({
            authorization: clientToken,
            client: clientInstance,
            styles: { root: { backgroundColor: '#faf8f5' } }
        });

        this.fastlaneIdentity = identity;
        this.fastlaneProfile = profile;
        this.fastlaneDeviceData = deviceData;
        this.fastlanePaymentComponent = await FastlanePaymentComponent();
        this.fastlaneWatermarkComponent = await FastlaneWatermarkComponent({
            includeAdditionalInfo: true
        });
    }

    public async onCheckoutButtonClick(): Promise<void> {
        const paymentToken = await this.fastlanePaymentComponent.getPaymentToken();

        this.checkoutButtonEnabled = false;

        const { name, email, shippingAddress } = this.currentCustomer;

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

        if (this.currentCustomer.authenticated) {
            this.setActiveSection(Section.Payment);
        } else {
            this.setActiveSection(Section.Shipping);
        }
    }

    public async onShippingEditButtonClick() {
        if (!this.currentCustomer.authenticated) {
            this.setActiveSection(Section.Shipping);
            return;
        }

        const { selectionChanged, selectedAddress } = await this.fastlaneProfile.showShippingAddressSelector();

        if (selectionChanged) {
            this.currentCustomer.shippingAddress = selectedAddress;
            this.fastlanePaymentComponent.setShippingAddress(this.currentCustomer.shippingAddress);
        }
    }

    public onShippingChange(nextShipping: ShippingAddressFormData): void {
        this.currentCustomer.shippingAddress = nextShipping;

        if (!nextShipping) {
            this.setActiveSection(Section.Payment);
            return;
        }

        const shipping = this.getTransactionShippingAddressData(this.currentCustomer.shippingAddress);
        this.fastlanePaymentComponent.setShippingAddress(shipping);
        this.setActiveSection(Section.Payment);
    }

    public setActiveSection(nextSection: Section): void {
        this.currentSection = nextSection;
    }

    private getTransactionShippingAddressData(shippingAddress: ShippingAddressFormData | undefined) {
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
}
