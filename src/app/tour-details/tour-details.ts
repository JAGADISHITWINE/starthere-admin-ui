import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TourDetails {
  private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient) {}

  getTrekById(trekId: number) {
    return this.http.get(`${this.API}/getTrekById/${trekId}`);
  }

}
