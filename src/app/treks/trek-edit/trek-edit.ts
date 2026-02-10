import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { EncryptionService } from 'src/app/services/encryption.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrekEdit {
  private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient, private crypto: EncryptionService) { }

  editTrek(trekId: number) {
    return this.http.get<{ payload: string }>(`${this.API}/getTrekByIdToUpdate/${trekId}`).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      })
    )
  }

  updateTrek(trekId: number, payload: FormData) {

    const obj: any = {};
    payload.forEach((value, key) => {
      obj[key] = value;
    });

    const encryptedPayload = this.crypto.encrypt(obj);

    return this.http.post<any>(
      `${this.API}/treks/${trekId}`,
      { encryptedPayload }
    ).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      })
    );
  }

}

