import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EncryptionService } from '../services/encryption.service';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TourDetails {
  private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient, private crypto: EncryptionService) { }


  getTrekById(trekId: number) {
    return this.http.get<{ payload: string }>(`${this.API}/getTrekById/${trekId}`).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      })
    )
  }

}
