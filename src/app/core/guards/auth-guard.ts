import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.parseUrl('/');
    }

    const requiredPermission = next.data?.['permission'] as string | undefined;
    if (requiredPermission && !this.authService.hasPermission(requiredPermission)) {
      return this.authService.getDefaultAuthorizedUrlTree(this.router);
    }

    return true;
  }

  forceLogout(): void {
    this.authService.clearSession();
    this.router.navigate(['']);
  }
}
