import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EncryptionService } from '../services/encryption.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient, private crypto: EncryptionService) {}

  getNotifications(): Observable<any> {
    return this.http.get<{ payload: string }>(`${this.API}/notifications`).pipe(
      map((res: any) => {
        if (res?.data && typeof res.data === 'string') {
          const decrypted = this.crypto.decrypt(res.data);
          return {
            ...res,
            data: decrypted
          };
        }
        return res;
      })
    );
  }

  markAllRead(): Observable<any> {
    return this.http.post(`${this.API}/notifications/read-all`, {});
  }

  markRead(id: string): Observable<any> {
    return this.http.post(`${this.API}/notifications/read`, { id });
  }
}
