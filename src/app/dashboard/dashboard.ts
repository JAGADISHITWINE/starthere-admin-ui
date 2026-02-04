import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Dashboard {

  constructor(private http: HttpClient){}

    private API = environment.baseUrl;

    getDashData() {
      return this.http.get<any>(`${this.API}/dashData`);
    }

}
