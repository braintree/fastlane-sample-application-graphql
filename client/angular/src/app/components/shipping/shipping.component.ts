import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

export interface ShippingAddressData {
    firstName: string;
    lastName: string;
    company?: string | null;
    streetAddress: string;
    extendedAddress?: string | null;
    locality: string;
    region: string;
    postalCode: string;
    countryCodeAlpha2: string;
    phoneCountryCode: string;
    phoneNumber: string;
};

@Component({
    selector: 'app-shipping',
    templateUrl: './shipping.component.html',
    styleUrls: ['../../app.component.css']
})
export class ShippingComponent {

    @Input()
    public isAuthenticated = false;

    @Input()
    public set shippingAddressData(shipping: ShippingAddressData | undefined) {
        this.updateShippingForm(shipping);
        this._shippingAddressData = shipping;
    };

    public get shippingAddressData(): ShippingAddressData | undefined {
        return this._shippingAddressData
    }

    @Input()
    public set isActive(active: boolean) {
        if (active) {
            this.visited = true;
        }

        this._isActive = active;
    }

    public get isActive(): boolean {
        return this._isActive;
    }

    @Output()
    public editClickEvent = new EventEmitter<void>();

    @Output()
    public shippingChangeEvent = new EventEmitter<ShippingAddressData>();

    public get getAddressSummary(): string {
        return this.formatAddressSummary(this.shippingAddressData);
    }

    public shippingForm = new FormGroup({
        firstName: new FormControl(""),
        lastName: new FormControl(""),
        company: new FormControl(""),
        streetAddress: new FormControl(""),
        extendedAddress: new FormControl(""),
        locality: new FormControl(""),
        region: new FormControl(""),
        postalCode: new FormControl(""),
        countryCodeAlpha2: new FormControl(""),
        phoneCountryCode: new FormControl(""),
        phoneNumber: new FormControl(""),
    });

    public visited = false;

    private _isActive = false;

    private _shippingAddressData: ShippingAddressData | undefined;

    public onContinueButtonClick(): void {
        const form = this.shippingForm.value;

        const shippingData: ShippingAddressData = {
            firstName: form.firstName || "",
            lastName: form.lastName || "",
            company: form.company,
            streetAddress: form.streetAddress || "",
            extendedAddress: form.extendedAddress,
            locality: form.locality || "",
            region: form.region || "",
            postalCode: form.postalCode || "",
            countryCodeAlpha2: form.countryCodeAlpha2 || "",
            phoneCountryCode: form.phoneCountryCode || "",
            phoneNumber: form.phoneNumber || ""
        };

        this.shippingAddressData = shippingData;

        this.shippingChangeEvent.emit(shippingData);
    }

    public updateShippingForm(shippingData: ShippingAddressData | undefined) {
        const params = {
            firstName: shippingData?.firstName || "",
            lastName: shippingData?.lastName || "",
            company: shippingData?.company || null,
            streetAddress: shippingData?.streetAddress || "",
            extendedAddress: shippingData?.extendedAddress || null,
            locality: shippingData?.locality || "",
            region: shippingData?.region || "",
            postalCode: shippingData?.postalCode || "",
            countryCodeAlpha2: shippingData?.countryCodeAlpha2 || "",
            phoneCountryCode: shippingData?.phoneCountryCode || "",
            phoneNumber: shippingData?.phoneNumber || ""
        };

        this.shippingForm.setValue(params);
    }

    public formatAddressSummary(shipping: ShippingAddressData | undefined): string {
        if (!shipping) return "";
        const isNotEmpty = (field: any) => Boolean(field);
        const summary = [
            [shipping.firstName, shipping.lastName].filter(isNotEmpty).join(' '),
            shipping.company,
            [shipping.streetAddress, shipping.extendedAddress].filter(isNotEmpty).join(', '),
            [
                shipping.locality,
                [shipping.region, shipping.postalCode].filter(isNotEmpty).join(' '),
                shipping.countryCodeAlpha2,
            ].filter(isNotEmpty).join(', '),
            shipping.phoneNumber,
        ];
        return summary.filter(isNotEmpty).join('<br>');
    };

    public onEditButtonClick() {
        this.editClickEvent.emit();
    }
}
