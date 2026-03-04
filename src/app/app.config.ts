import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from "@angular/common/http";
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { RateLimitInterceptor } from './core/interceptors/rate-limit.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideHttpClient(withInterceptorsFromDi()),
    // Register the AuthInterceptor to attach credentials and the ErrorInterceptor to
    // handle session expiration and global 401 responses.
    { provide: HTTP_INTERCEPTORS, useClass: RateLimitInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
};
