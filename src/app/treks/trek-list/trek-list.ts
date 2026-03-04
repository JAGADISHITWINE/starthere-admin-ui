import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { EncryptionService } from 'src/app/services/encryption.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrekList {
  private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient, private crypto: EncryptionService) {}

  getAllTreks(forceRefresh: boolean = false) {
    const url = forceRefresh
      ? `${this.API}/getAllTreks?_t=${Date.now()}`
      : `${this.API}/getAllTreks`;

    return this.http.get<{ payload: string }>(url).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted,
        };
      })
    );
  }
}
