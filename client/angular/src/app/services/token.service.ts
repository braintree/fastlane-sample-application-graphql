import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class TokenService {

    constructor(private httpClient: HttpClient) { }

    public getClientToken(): Observable<Object> {
        return this.httpClient.get(`${environment.apiUrl}/client-token`);
    }
}