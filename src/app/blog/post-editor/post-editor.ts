import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PostEditor {

  constructor(private http: HttpClient){}

    private API = environment.baseUrl;

    savePost(data:any) {
      return this.http.post(`${this.API}/postEditor`, data);
    }

}
