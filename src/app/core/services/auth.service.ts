import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

export interface AdminUser {
  id: number;
  name?: string;
  email: string;
  role?: string;
  roleName?: string;
  permissions?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'currentUser';
  private readonly TOKEN_KEY = 'token';

  private readonly defaultRouteOrder: Array<{ permission: string; route: string }> = [
    { permission: 'dashboard.view', route: '/admin/dashboard' },
    { permission: 'bookings.view', route: '/admin/bookings' },
    { permission: 'treks.view', route: '/admin/treks/list' },
    { permission: 'users.view', route: '/admin/users' },
    { permission: 'reviews.view', route: '/admin/reviews' },
    { permission: 'blog.view', route: '/admin/blog/posts' },
    { permission: 'finance.view', route: '/admin/revenue' },
    { permission: 'operations.view', route: '/admin/operations' },
    { permission: 'notifications.view', route: '/admin/notifications' },
  ];

  setUser(user: AdminUser | null): void {
    if (!user) return;
    const normalized: AdminUser = {
      ...user,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    };
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(normalized));
  }

  getUser(): AdminUser | null {
    const raw = sessionStorage.getItem(this.USER_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        permissions: Array.isArray(parsed?.permissions) ? parsed.permissions : [],
      } as AdminUser;
    } catch {
      return null;
    }
  }

  clearUser(): void {
    sessionStorage.removeItem(this.USER_KEY);
  }

  clearSession(): void {
    this.clearUser();
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getUser();
  }

  hasPermission(permission: string | undefined | null): boolean {
    if (!permission) return true;
    const permissions = this.getUser()?.permissions || [];
    if (permissions.includes(permission)) return true;
    const role = this.getUser()?.role || '';
    return String(role).toLowerCase() === 'super_admin';
  }

  getDefaultAuthorizedRoute(): string {
    for (const candidate of this.defaultRouteOrder) {
      if (this.hasPermission(candidate.permission)) {
        return candidate.route;
      }
    }
    return '/admin/dashboard';
  }

  getDefaultAuthorizedUrlTree(router: Router): UrlTree {
    return router.parseUrl(this.getDefaultAuthorizedRoute());
  }
}
