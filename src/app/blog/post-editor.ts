import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Post {
  id?: number;
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  category: string;
  category_id?: number;
  category_name?: string;
  author: string;
  author_id?: number;
  featuredImage?: string;
  featured_image?: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  views?: number;
  publishDate: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostEditor {
  private API = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // Get single post by ID
  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.API}/postEditor/${id}`);
  }

  // Get all posts
  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.API}/postEditor`);
  }

  // Create new post with FormData
  createPost(formData: FormData): Observable<any> {
  return this.http.post(`${this.API}/postEditor`, formData);
  }

  // Update existing post with FormData
  updatePost(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.API}/postEditor/${id}`, formData);
  }

  // Save post (create or update)
  savePost(id: number | null, formData: FormData): Observable<any> {
    if (id) {
      return this.updatePost(id, formData);
    } else {
      return this.createPost(formData);
    }
  }

  // Delete post
  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.API}/postEditor/${id}`);
  }

  // Get categories
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/categories`);
  }
}