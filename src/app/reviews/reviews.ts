import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EncryptionService } from '../services/encryption.service';
import { Observable } from 'rxjs';
import { Post } from '../blog/post-editor';

@Injectable({
  providedIn: 'root',
})
export class Reviews {

  private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient, private crypto: EncryptionService) { }

  getAllReviews(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.API}/reviews`);
  }

  updateReviewStatus(id: number, status: 'approved' | 'rejected'): Observable<any> {
    return this.http.patch(`${this.API}/reviews/${id}/status`, { status });
  }

}
