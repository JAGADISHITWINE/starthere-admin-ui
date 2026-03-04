import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RbacTableRow {
  roleId?: number;
  roleKey: string;
  role: string;
  dashboard: boolean;
  bookings: boolean;
  finance: boolean;
  content: boolean;
  settings: boolean;
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
  roleKey: string;
}

@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly API = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getTable(): Observable<{ success: boolean; data: RbacTableRow[] }> {
    return this.http.get<{ success: boolean; data: RbacTableRow[] }>(`${this.API}/rbac/table`);
  }

  updateTable(rows: RbacTableRow[]): Observable<{ success: boolean; data: RbacTableRow[] }> {
    return this.http.put<{ success: boolean; data: RbacTableRow[] }>(`${this.API}/rbac/table`, { rows });
  }

  createAdmin(payload: CreateAdminPayload): Observable<{ success: boolean; message: string; data?: any }> {
    return this.http.post<{ success: boolean; message: string; data?: any }>(`${this.API}/admins`, payload);
  }
}
