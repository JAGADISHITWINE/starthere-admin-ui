import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { AlertController } from '@ionic/angular';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  // guard to prevent multiple session-expired modals from stacking
  private static sessionExpiredModalShown = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private notify: NotificationService,
    private injector: Injector // lazy-get AlertController to avoid DI cycles
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            // Session expired or unauthorized
            try {
              this.auth.clearUser();
            } catch {}

            // Clear common storage keys to avoid stale data
            try { sessionStorage.removeItem('token'); } catch {}
            try { localStorage.removeItem('token'); } catch {}
            try { localStorage.removeItem('authToken'); } catch {}
            try { sessionStorage.removeItem('currentUser'); } catch {}

            // Notify user via existing notification (toast) as a non-blocking hint
            try { this.notify.show('Your session has expired.'); } catch {}

            // Present a blocking modal/alert asking user to login again.
            if (!ErrorInterceptor.sessionExpiredModalShown) {
              ErrorInterceptor.sessionExpiredModalShown = true;
              const alertCtrl = this.injector.get(AlertController);
              // show alert and after dismiss, navigate to login
              alertCtrl
                .create({
                  header: 'Session expired',
                  message: 'Your session expired — please login again.',
                  buttons: [
                    {
                      text: 'Login',
                      handler: () => {
                        try { this.router.navigate(['/login']); } catch { try { this.router.navigate(['']); } catch {} }
                      }
                    }
                  ],
                  backdropDismiss: false
                })
                .then(alert => alert.present())
                .finally(() => {
                  // allow future alerts after a short delay to avoid immediate duplicates
                  setTimeout(() => { ErrorInterceptor.sessionExpiredModalShown = false; }, 1000);
                });
            }
          }
        }
        return throwError(() => err);
      })
    );
  }
}
