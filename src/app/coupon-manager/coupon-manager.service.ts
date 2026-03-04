import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Coupon {
  id: number;
  trekId: number;
  trekName: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minBookingAmount: number;
  maxDiscountAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponPayload {
  trekId: number;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CouponManagerService {
  private readonly API = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getCoupons(trekId?: number | null): Observable<{ success: boolean; data: Coupon[] }> {
    const query = trekId ? `?trekId=${trekId}` : '';
    return this.http.get<{ success: boolean; data: Coupon[] }>(`${this.API}/coupons${query}`);
  }

  createCoupon(payload: CouponPayload): Observable<{ success: boolean; message: string; data?: any }> {
    return this.http.post<{ success: boolean; message: string; data?: any }>(`${this.API}/coupons`, payload);
  }

  updateCoupon(id: number, payload: Partial<CouponPayload>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.API}/coupons/${id}`, payload);
  }

  deleteCoupon(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API}/coupons/${id}`);
  }
}
