import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class Login {
  constructor(private http: HttpClient, private authService: AuthService) { }
  private API = environment.baseUrl;

  auth(data: any) {
    const payload = {
      email: data.email,
      password: data.password
    }
    // Use withCredentials to allow HttpOnly cookie to be set by the server
    return this.http.post<any>(`${this.API}/login`, payload, { withCredentials: true })
      .pipe(tap(res => {
        this.authService.setUser(res.user);
        // Store token if present in response
        if (res.token) {
          sessionStorage.setItem('token', res.token);
        }
      }));
  }

}
