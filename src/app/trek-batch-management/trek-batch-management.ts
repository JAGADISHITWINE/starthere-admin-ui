import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrekBatchManagement {
    private apiUrl = `${environment.baseUrl}`;

  constructor(private http: HttpClient) {}

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

  /**
   * Get all treks with batch summaries
   */
  getTreks(): Observable<any> {
    return this.http.get(`${this.apiUrl}/treks`);
  }

  /**
   * Get all batches for a trek
   */
  getBatches(trekId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/treks/${trekId}/batches`)
  }

  /**
   * Get all bookings for a specific batch
   */
  getBatchBookings(batchId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/batches/${batchId}/bookings`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Stop accepting bookings for a batch
   */
  stopBooking(batchId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/batches/${batchId}/stop-booking`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Resume accepting bookings for a batch
   */
  resumeBooking(batchId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/batches/${batchId}/resume-booking`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Export bookings for a specific batch
   */
  exportBatchBookings(batchId: number): void {
    const token = localStorage.getItem('authToken');
    const url = `${this.apiUrl}/batches/${batchId}/export-bookings`;

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = `${url}?token=${token}`;
    link.download = 'bookings.xlsx';
    link.click();
  }

  /**
   * Export all bookings for all batches of a trek
   */
  exportAllTrekBookings(trekId: number): void {
    const token = localStorage.getItem('authToken');
    const url = `${this.apiUrl}/treks/${trekId}/export-all-bookings`;

    const link = document.createElement('a');
    link.href = `${url}?token=${token}`;
    link.download = 'all_bookings.xlsx';
    link.click();
  }

  /**
   * Download batch bookings as Excel (alternative method using blob)
   */
  downloadBatchBookings(batchId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/batches/${batchId}/export-bookings`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * Trigger download from blob
   */
  triggerDownload(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
