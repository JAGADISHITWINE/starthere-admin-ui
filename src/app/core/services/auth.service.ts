import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'currentUser';

  setUser(user: any | null) {
    if (user) {
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  getUser(): any | null {
    const raw = sessionStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  clearUser() {
    sessionStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getUser();
  }
}
