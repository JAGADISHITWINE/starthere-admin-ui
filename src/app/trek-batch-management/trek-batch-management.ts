import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EncryptionService } from '../services/encryption.service';

@Injectable({
  providedIn: 'root',
})
export class TrekBatchManagement {
  private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient, private crypto: EncryptionService) { }

  /**
   * Get auth headers
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTreks() {
    return this.http.get<{ payload: string }>(`${this.API}/treks`).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      })
    )
  }

  getBatches(trekId: number) {
    return this.http.get<{ payload: string }>(`${this.API}/treks/${trekId}/batches`).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      })
    )
  }


   getBatchBookings(batchId: number) {
    return this.http.get<{ payload: string }>(`${this.API}/batches/${batchId}/bookings`).pipe(
      map((res: any) => {
        const decrypted = this.crypto.decrypt(res.data);
        return {
          ...res,
          data: decrypted
        };
      })
    )
  }



  stopBooking(batchId: number): Observable<any> {
    return this.http.patch(`${this.API}/batches/${batchId}/stop-booking`, {});
  }


  resumeBooking(batchId: number): Observable<any> {
    return this.http.patch(`${this.API}/batches/${batchId}/resume-booking`, {});
  }


  exportBatchBookings(batchId: number): void {
    const token = localStorage.getItem('authToken');
    const url = `${this.API}/batches/${batchId}/export-bookings`;

    const link = document.createElement('a');
    link.href = `${url}?token=${token}`;
    link.download = 'bookings.xlsx';
    link.click();
  }

  exportAllTrekBookings(trekId: number): void {
    const token = localStorage.getItem('authToken');
    const url = `${this.API}/treks/${trekId}/export-all-bookings`;

    const link = document.createElement('a');
    link.href = `${url}?token=${token}`;
    link.download = 'all_bookings.xlsx';
    link.click();
  }

  downloadBatchBookings(batchId: number): Observable<Blob> {
    return this.http.get(`${this.API}/batches/${batchId}/export-bookings`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  downloadAllTrekBookings(trekId:any){
    return this.http.get(`${this.API}/treks/${trekId}/export-all-bookings`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  triggerDownload(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getCompletionStats() {
    return this.http.get(`${this.API}/bookings/completion-stats`);
  }

  markBatchCompleted(batchId: number): Observable<any> {
    return this.http.put(`${this.API}/batches/${batchId}/complete`, {});
  }
}
