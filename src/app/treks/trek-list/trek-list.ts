import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrekList {
    private API = `${environment.baseUrl}`;

    constructor(private http: HttpClient) {}

    getAllTreks() {
      return this.http.get(`${this.API}/getAllTreks`);
    }
}
