import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EncryptionService } from '../services/encryption.service';

export type DropdownOptionStatus = 'active' | 'inactive';

export interface DropdownOption {
  id: string;
  label: string;
  value: string;
  status: DropdownOptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DropdownGroup {
  key: string;
  label: string;
  page: string;
  options: DropdownOption[];
}

@Injectable({
  providedIn: 'root'
})
export class DropdownManagerService {
  private readonly API = `${environment.baseUrl}/dropdowns`;
  private readonly storageKey = 'admin_dropdown_master_v1';

  constructor(private http: HttpClient, private crypto: EncryptionService) {}

  getGroups(): Observable<DropdownGroup[]> {
    return this.http.get<any>(this.API).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      }),
      map((res) => this.normalizeGroups(this.extractGroups(res.data))),
      catchError(() => of(this.getLocalGroups()))
    );
  }

  getGroupOptions(key: string, includeInactive = false): Observable<DropdownOption[]> {
    return this.getGroups().pipe(
      map((groups) => {
        const group = groups.find((g) => g.key === key);
        if (!group) return [];
        return includeInactive ? group.options : group.options.filter((o) => o.status === 'active');
      })
    );
  }

  createGroup(key: string, label: string, page: string): Observable<DropdownGroup[]> {
    const payload = { key: this.toValue(key), label, page };

    return this.http.post(this.API, this.withEncryptedPayload(payload)).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      }),
      map((res) => this.extractGroups(res.data)),
      map((groups) => this.normalizeGroups(groups)),
      catchError(() => {
        const groups = this.getLocalGroups();
        const exists = groups.some((group) => group.key === payload.key);
        if (!exists) {
          groups.push({
            key: payload.key,
            label,
            page,
            options: [],
          });
          this.saveLocalGroups(groups);
        }
        return of(groups);
      })
    );
  }

  addOption(groupKey: string, label: string): Observable<DropdownGroup[]> {
    const payload = { groupKey, label, value: this.toValue(label) };
    return this.http.post(this.API, this.withEncryptedPayload(payload)).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      }),
      map((res) => this.extractGroups(res.data)),
      map((groups) => this.normalizeGroups(groups)),
      catchError(() => {
        const groups = this.getLocalGroups();
        const group = groups.find((g) => g.key === groupKey);
        if (!group) return of(groups);

        const exists = group.options.some((opt) => opt.label.toLowerCase() === label.toLowerCase());
        if (!exists) {
          const now = new Date().toISOString();
          group.options.push({
            id: this.newId(),
            label,
            value: this.toValue(label),
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
          this.saveLocalGroups(groups);
        }

        return of(groups);
      })
    );
  }

  updateOption(groupKey: string, optionId: string, label: string): Observable<DropdownGroup[]> {
    const payload = { groupKey, optionId, label, value: this.toValue(label) };
    return this.http.put(this.API, this.withEncryptedPayload(payload)).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      }),
      map((res) => this.extractGroups(res.data)),
      map((groups) => this.normalizeGroups(groups)),
      catchError(() => {
        const groups = this.getLocalGroups();
        const group = groups.find((g) => g.key === groupKey);
        const option = group?.options.find((o) => o.id === optionId);

        if (option) {
          option.label = label;
          option.value = this.toValue(label);
          option.updatedAt = new Date().toISOString();
          this.saveLocalGroups(groups);
        }

        return of(groups);
      })
    );
  }

  setOptionStatus(groupKey: string, optionId: string, status: DropdownOptionStatus): Observable<DropdownGroup[]> {
    const payload = { groupKey, optionId, status };
    return this.http.patch(this.API, this.withEncryptedPayload(payload)).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      }),
      map((res) => this.extractGroups(res.data)),
      map((groups) => this.normalizeGroups(groups)),
      catchError(() => {
        const groups = this.getLocalGroups();
        const group = groups.find((g) => g.key === groupKey);
        const option = group?.options.find((o) => o.id === optionId);

        if (option) {
          option.status = status;
          option.updatedAt = new Date().toISOString();
          this.saveLocalGroups(groups);
        }

        return of(groups);
      })
    );
  }

  deleteOption(groupKey: string, optionId: string): Observable<DropdownGroup[]> {
    return this.http.delete(this.API, { body: this.withEncryptedPayload({ groupKey, optionId }) }).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      }),
      map((res) => this.extractGroups(res.data)),
      map((groups) => this.normalizeGroups(groups)),
      catchError(() => {
        const groups = this.getLocalGroups();
        const group = groups.find((g) => g.key === groupKey);

        if (group) {
          group.options = group.options.filter((o) => o.id !== optionId);
          this.saveLocalGroups(groups);
        }

        return of(groups);
      })
    );
  }

  private getLocalGroups(): DropdownGroup[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return this.normalizeGroups(parsed);
    } catch {
      return [];
    }
  }

  private saveLocalGroups(groups: DropdownGroup[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(groups));
  }

  private normalizeGroups(input: any[]): DropdownGroup[] {
    if (!Array.isArray(input) || input.length === 0) {
      return [];
    }

    const groups = input.map((group: any) => ({
      key: String(group.key || ''),
      label: String(group.label || group.key || ''),
      page: String(group.page || 'General'),
      options: Array.isArray(group.options)
        ? group.options.map((opt: any) => ({
            id: String(opt.id || this.newId()),
            label: String(opt.label || opt.value || ''),
            value: String(opt.value || this.toValue(opt.label || '')),
            status: opt.status === 'inactive' ? 'inactive' : 'active',
            createdAt: opt.createdAt || new Date().toISOString(),
            updatedAt: opt.updatedAt || new Date().toISOString(),
          }))
        : [],
    })).filter((group: DropdownGroup) => !!group.key);

    this.saveLocalGroups(groups);
    return groups;
  }

  private extractGroups(res: any): any[] {
    const plain = res?.data || res?.results || res || [];
    if (Array.isArray(plain)) return plain;
    if (plain && Array.isArray(plain.groups)) return plain.groups;
    return [];
  }

  private withEncryptedPayload(payload: any): any {
    return {
      ...payload,
      encryptedPayload: this.crypto.encrypt(payload),
    };
  }

  private toValue(text: string): string {
    return String(text || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private newId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
