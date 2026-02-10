import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { EncryptionService } from 'src/app/services/encryption.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrekAdd {
  private API = `${environment.baseUrl}`;

  constructor(private http: HttpClient, private crypto: EncryptionService) { }

createTrek(trekData: any, files: any) {

  // 👇 ONLY JSON here
  const encryptedPayload = this.crypto.encrypt({
    name: trekData.name,
    location: trekData.location,
    category: trekData.category,
    difficulty: trekData.difficulty,
    fitnessLevel: trekData.fitnessLevel,
    description: trekData.description,
    highlights: trekData.highlights,
    thingsToCarry: trekData.thingsToCarry,
    importantNotes: trekData.importantNotes,
    batches: trekData.batches
  });

  // 👇 FormData ONLY for transport
  const formData = new FormData();
  formData.append('encryptedPayload', encryptedPayload);

  // Cover image
  if (files.coverImage) {
    formData.append('coverImage', files.coverImage);
  }

  // Gallery images
  if (files.gallery?.length) {
    files.gallery.forEach((img: File) => {
      formData.append('gallery', img);
    });
  }

  return this.http.post<any>(`${this.API}/createTrek`, formData).pipe(
    map(res => {
      const decrypted = this.crypto.decrypt(res.data);
      return {
        ...res,
        data: decrypted
      };
    })
  );
}


}
