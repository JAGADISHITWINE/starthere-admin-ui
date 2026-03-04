import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';

interface CacheEntry {
  at: number;
  response: HttpResponse<any>;
}

@Injectable()
export class RateLimitInterceptor implements HttpInterceptor {
  private inFlight = new Map<string, Observable<HttpEvent<any>>>();
  private cache = new Map<string, CacheEntry>();
  private cooldownUntil = new Map<string, number>();

  private readonly cacheTtlMs = 8000;
  private readonly defaultCooldownMs = 4000;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    const key = req.urlWithParams;
    const now = Date.now();
    const cached = this.cache.get(key);
    const cooldown = this.cooldownUntil.get(key) || 0;

    if (cached && now - cached.at < this.cacheTtlMs) {
      return of(cached.response.clone());
    }

    if (now < cooldown && cached) {
      return of(cached.response.clone());
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }

    const request$ = next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.cache.set(key, { at: Date.now(), response: event.clone() });
        }
      }),
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 429) {
          const retryAfter = Number(err.headers?.get('Retry-After'));
          const cooldownMs = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : this.defaultCooldownMs;

          this.cooldownUntil.set(key, Date.now() + cooldownMs);
          if (cached) {
            return of(cached.response.clone());
          }
        }
        return throwError(() => err);
      }),
      finalize(() => {
        this.inFlight.delete(key);
      }),
      shareReplay(1)
    );

    this.inFlight.set(key, request$);
    return request$;
  }
}
