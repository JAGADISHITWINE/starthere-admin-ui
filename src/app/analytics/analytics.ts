import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Analytics {

    constructor(private http: HttpClient){}

    private API = environment.baseUrl;

    getRevenueData() {
      return this.http.get<any>(`${this.API}/revenue`);
    }

}
