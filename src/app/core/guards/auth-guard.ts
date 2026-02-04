import { Login } from './../../login/login';
import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: Login, private router: Router) { }

  canActivate(
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): boolean | UrlTree {
    const authAny = this.auth as any;
    if (authAny && typeof authAny.isLoggedIn === 'function') {
      try {
        if (authAny.isLoggedIn()) {
          return true;
        }
      } catch (e) {
        // fall through to localStorage check
      }
    }

    // Fallback: check for a token or user in localStorage (common patterns)
    const hasToken = !!(
      sessionStorage.getItem('token') || sessionStorage.getItem('currentUser')
    );

    if (hasToken) {
      return true;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['']);
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);

      if (decoded.exp * 1000 < Date.now()) {
        this.forceLogout();
        return false;
      }

      return true;
    } catch {
      this.forceLogout();
      return false;
    }
  }

  forceLogout() {
    sessionStorage.clear();
    this.router.navigate(['']);
  }
}

