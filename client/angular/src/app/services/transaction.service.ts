import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface TransactionShippingAddressData {
    firstName: string;
    lastName: string;
    streetAddress: string;
    extendedAddress?: string | null;
    locality: string;
    region: string;
    postalCode: string;
    countryCodeAlpha2: string;
    phoneNumber?: string;
};
interface TransactionRequest {
    name: string;
    email: string;
    deviceData: string;
    paymentToken: { [key: string]: any };
    shippingAddress?: TransactionShippingAddressData;
}

interface TransactionResponse {
    result: { id: string; status: string; };
    error?: any;
}

@Injectable({
    providedIn: 'root',
})
export class TransactionService {

    constructor(private httpClient: HttpClient) { }

    public createTransaction(payload: TransactionRequest): Observable<TransactionResponse> {
        return this.httpClient.post<TransactionResponse>(`${environment.apiUrl}/transaction`, payload);
    }
}