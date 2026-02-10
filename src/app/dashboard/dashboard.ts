import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EncryptionService } from '../services/encryption.service';

@Injectable({
  providedIn: 'root',
})
export class Dashboard {

  constructor(private http: HttpClient, private crypto: EncryptionService){}

    private API = environment.baseUrl;

    getDashData() {
    return this.http.get<{ payload: string }>(`${this.API}/dashData`).pipe(
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
