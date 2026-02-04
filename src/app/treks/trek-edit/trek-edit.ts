import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrekEdit {
    private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient) { }

  editTrek(trekId: number) {
    return this.http.get(`${this.API}/getTrekByIdToUpdate/${trekId}`);
  }

updateTrek(trekId: number, formData: FormData) {
  return this.http.post(
    `${this.API}/treks/${trekId}`,
    formData
  );
}


}
