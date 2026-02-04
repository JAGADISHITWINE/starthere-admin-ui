import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrekAdd {
  private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient) { }

  createTrek(payload: FormData) {
    return this.http.post(`${this.API}/createTrek`, payload);
  }
}
