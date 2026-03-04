import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EncryptionService } from '../services/encryption.service';

@Injectable({
  providedIn: 'root',
})
export class Dashboard {

  constructor(private http: HttpClient, private crypto: EncryptionService){}

  private API = environment.baseUrl;
  private cache: any = null;
  private cacheAt = 0;
  private readonly cacheTtlMs = 20000;
  private inFlight$?: Observable<any>;

  getDashData(force = false) {
    const now = Date.now();
    if (!force && this.cache && (now - this.cacheAt) < this.cacheTtlMs) {
      return of(this.cache);
    }

    if (!force && this.inFlight$) {
      return this.inFlight$;
    }

    this.inFlight$ = this.http.get<{ payload: string }>(`${this.API}/dashData`).pipe(
      map((res: any) => {
        const encrypted = typeof res?.data === 'string'
          ? res.data
          : (typeof res?.payload === 'string' ? res.payload : null);

        if (encrypted) {
          const decrypted = this.crypto.decrypt(encrypted);
          return {
            ...res,
            data: decrypted ?? {},
          };
        }
        return res;
      }),
      map((res: any) => ({
        ...res,
        data: res?.data?.data || res?.data || {},
      })),
      map((res: any) => ({
        ...res,
        success: res?.success ?? true,
      })),
      map((res: any) => {
        this.cache = res;
        this.cacheAt = Date.now();
        return res;
      }),
      catchError((err) => {
        if (err?.status === 429 && this.cache) {
          return of(this.cache);
        }
        return throwError(() => err);
      }),
      finalize(() => {
        this.inFlight$ = undefined;
      }),
      shareReplay(1)
    );

    return this.inFlight$;
  }
}
