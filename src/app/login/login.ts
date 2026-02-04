  import { HttpClient } from '@angular/common/http';
  import { Injectable } from '@angular/core';
  import { tap } from 'rxjs';
import { environment } from 'src/environments/environment';

  @Injectable({
    providedIn: 'root',
  })
  export class Login {
    constructor(private http: HttpClient) { }
    private API = environment.baseUrl;

    auth(data: any) {
      const payload = {
        email : data.email,
        password : data.password
      }
      return this.http.post<any>(`${this.API}/login`, payload)
        .pipe(tap(res => localStorage.setItem('token', res.token)));
    }

  }
