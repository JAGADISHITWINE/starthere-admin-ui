import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Bookings {

    constructor(private http: HttpClient){}

    private API = environment.baseUrl;

    getBookingData() {
      return this.http.get<any>(`${this.API}/bookingData`);
    }

}
