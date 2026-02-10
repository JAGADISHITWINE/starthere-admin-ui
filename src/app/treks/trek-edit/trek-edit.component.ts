import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrekEdit } from './trek-edit';

@Component({
  standalone: true,
  selector: 'app-trek-edit',
  templateUrl: './trek-edit.component.html',
  styleUrls: ['./trek-edit.component.scss'],
  imports: [IonicModule, CommonModule, RouterLink, ReactiveFormsModule],
})
export class TrekEditComponent implements OnInit {
  @ViewChild('coverGalleryInput') coverGalleryInput!: any;
  @ViewChild('coverCameraInput') coverCameraInput!: any;
  @ViewChild('galleryGalleryInput') galleryGalleryInput!: any;
  @ViewChild('galleryCameraInput') galleryCameraInput!: any;

  editTrekForm!: FormGroup;
  trekId!: number;
  isLoading = true;

  // Dropdown options
  difficulties = ['Easy', 'Moderate', 'Difficult', 'Extreme'];
  categories = ['Hill Trek', 'Mountain Trek', 'Forest Trek', 'Desert Trek', 'Snow Trek', 'Peak Trek'];
  fitnessLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  batchStatuses = ['active', 'inactive', 'full', 'cancelled'];

  // Image previews
  coverPreview: string | null = null;
  galleryPreviews: string[] = [];

  // Image files
  coverImageFile: File | null = null;
  galleryImageFiles: File[] = [];

  // Existing images
  existingCoverFilename: string | null = null;
  existingGalleryFilenames: string[] = [];
  deletedGalleryFilenames: string[] = [];
  coverDeleted = false;

  constructor(
    private fb: FormBuilder,
    private trekService: TrekEdit,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) return;
      this.trekId = id;
      this.fetchTrek();
    });
  }

  initForm() {
    this.editTrekForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      category: ['', Validators.required],
      difficulty: ['', Validators.required],
      fitnessLevel: [''],
      description: [''],
      highlights: this.fb.array([]),
      batches: this.fb.array([]),
      thingsToCarry: this.fb.array([]),
      importantNotes: this.fb.array([])
    });
  }

  // ===== GETTERS =====
  get highlights(): FormArray {
    return this.editTrekForm.get('highlights') as FormArray;
  }

  get batches(): FormArray {
    return this.editTrekForm.get('batches') as FormArray;
  }

  get thingsToCarry(): FormArray {
    return this.editTrekForm.get('thingsToCarry') as FormArray;
  }

  get importantNotes(): FormArray {
    return this.editTrekForm.get('importantNotes') as FormArray;
  }

  getInclusions(batchIndex: number): FormArray {
    return this.batches.at(batchIndex).get('inclusions') as FormArray;
  }

  getExclusions(batchIndex: number): FormArray {
    return this.batches.at(batchIndex).get('exclusions') as FormArray;
  }

  getItineraryDays(batchIndex: number): FormArray {
    return this.batches.at(batchIndex).get('itineraryDays') as FormArray;
  }

  getActivities(batchIndex: number, dayIndex: number): FormArray {
    return this.getItineraryDays(batchIndex).at(dayIndex).get('activities') as FormArray;
  }

  // ===== FETCH TREK DATA =====
  fetchTrek() {
    this.isLoading = true;

    this.trekService.editTrek(this.trekId).subscribe((res: any) => {
      if (!res?.success) return;

      const trek = res.data;
      console.log(trek)

      // Patch basic fields
      this.editTrekForm.patchValue({
        name: trek.name,
        location: trek.location,
        category: trek.category,
        difficulty: trek.difficulty,
        fitnessLevel: trek.fitnessLevel,
        description: trek.description
      });

      // Set highlights
      this.setFormArray(this.highlights, trek.highlights || []);

      // Set things to carry
      this.setFormArray(this.thingsToCarry, trek.thingsToCarry || []);

      // Set important notes
      this.setFormArray(this.importantNotes, trek.importantNotes || []);

      // Set batches
      this.setBatches(trek.batches || []);

      // Set cover image
      if (trek.coverImage) {
        this.existingCoverFilename = trek.coverImage;
        this.coverPreview = this.getImageUrl(trek.coverImage);
      }

      // Set gallery images
      if (trek.galleryImages && Array.isArray(trek.galleryImages)) {
        this.existingGalleryFilenames = trek.galleryImages;
      }

      this.isLoading = false;
    });
  }

  // ===== BATCH METHODS =====
  createBatch(data?: any): FormGroup {
    return this.fb.group({
      startDate: [data?.startDate || '', Validators.required],
      endDate: [data?.endDate || '', Validators.required],
      availableSlots: [data?.availableSlots || ''],
      price: [data?.price || ''],
      minAge: [data?.minAge || ''],
      maxAge: [data?.maxAge || ''],
      minParticipants: [data?.minParticipants || ''],
      maxParticipants: [data?.maxParticipants || ''],
      duration: [data?.duration || ''],
      batchStatus: [data?.batchStatus || 'active'],
      inclusions: this.fb.array(data?.inclusions?.map((inc: string) => this.fb.control(inc)) || []),
      exclusions: this.fb.array(data?.exclusions?.map((exc: string) => this.fb.control(exc)) || []),
      itineraryDays: this.fb.array(data?.itineraryDays?.map((day: any) => this.createDay(day)) || [])
    });
  }

  createDay(data?: any): FormGroup {
    return this.fb.group({
      dayNumber: [data?.dayNumber || ''],
      title: [data?.title || ''],
      activities: this.fb.array(data?.activities?.map((act: any) => this.createActivity(act)) || [])
    });
  }

  createActivity(data?: any): FormGroup {
    return this.fb.group({
      activityTime: [data?.activityTime || ''],
      activityText: [data?.activityText || '']
    });
  }

  setBatches(batches: any[]) {
    this.batches.clear();
    if (batches && batches.length > 0) {
      batches.forEach(batch => this.batches.push(this.createBatch(batch)));
    } else {
      this.batches.push(this.createBatch());
    }
  }

  addBatch() {
    this.batches.push(this.createBatch());
  }

  removeBatch(index: number) {
    if (this.batches.length > 1) {
      this.batches.removeAt(index);
    }
  }

  // ===== INCLUSION/EXCLUSION METHODS =====
  addInclusion(batchIndex: number) {
    this.getInclusions(batchIndex).push(this.fb.control(''));
  }

  removeInclusion(batchIndex: number, inclusionIndex: number) {
    this.getInclusions(batchIndex).removeAt(inclusionIndex);
  }

  addExclusion(batchIndex: number) {
    this.getExclusions(batchIndex).push(this.fb.control(''));
  }

  removeExclusion(batchIndex: number, exclusionIndex: number) {
    this.getExclusions(batchIndex).removeAt(exclusionIndex);
  }

  // ===== ITINERARY METHODS =====
  addItineraryDay(batchIndex: number) {
    const itineraryDays = this.getItineraryDays(batchIndex);
    const dayNumber = itineraryDays.length + 1;
    itineraryDays.push(this.createDay({ dayNumber }));
  }

  removeItineraryDay(batchIndex: number, dayIndex: number) {
    this.getItineraryDays(batchIndex).removeAt(dayIndex);
  }

  addActivity(batchIndex: number, dayIndex: number) {
    this.getActivities(batchIndex, dayIndex).push(this.createActivity());
  }

  removeActivity(batchIndex: number, dayIndex: number, activityIndex: number) {
    this.getActivities(batchIndex, dayIndex).removeAt(activityIndex);
  }

  // ===== HIGHLIGHTS/CARRY/NOTES METHODS =====
  addHighlight() {
    this.highlights.push(this.fb.control(''));
  }

  removeHighlight(index: number) {
    this.highlights.removeAt(index);
  }

  addCarryItem() {
    this.thingsToCarry.push(this.fb.control(''));
  }

  removeCarryItem(index: number) {
    this.thingsToCarry.removeAt(index);
  }

  addNote() {
    this.importantNotes.push(this.fb.control(''));
  }

  removeNote(index: number) {
    this.importantNotes.removeAt(index);
  }

  // ===== UTILITY METHODS =====
  setFormArray(arr: FormArray, values: string[]) {
    arr.clear();
    if (values && values.length > 0) {
      values.forEach(v => arr.push(this.fb.control(v)));
    } else {
      arr.push(this.fb.control(''));
    }
  }

  // ===== IMAGE HANDLING =====
  onCoverImageSelect(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.coverImageFile = file;
    this.coverDeleted = false;

    const reader = new FileReader();
    reader.onload = () => {
      this.coverPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeCoverImage() {
    this.coverImageFile = null;
    this.coverPreview = null;
    this.coverDeleted = true;
    this.existingCoverFilename = null;
  }

  onGallerySelect(event: any) {
    Array.from(event.target.files).forEach((file: any) => {
      this.galleryImageFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => this.galleryPreviews.push(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeGalleryImage(index: number, isExisting: boolean) {
    if (isExisting) {
      const filename = this.existingGalleryFilenames[index];
      this.deletedGalleryFilenames.push(filename);
      this.existingGalleryFilenames.splice(index, 1);
    } else {
      this.galleryImageFiles.splice(index, 1);
      this.galleryPreviews.splice(index, 1);
    }
  }

  getImageUrl(filename: string): string {
    return `http://localhost:4001/${filename}`;
  }

  getGalleryPreviewUrl(filename: string): string {
    return `http://localhost:4001/${filename}`;
  }

  // ===== UPDATE TREK =====
  updateTrek() {
    if (this.editTrekForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    const formData = new FormData();

    // Add form data
    Object.keys(this.editTrekForm.value).forEach(key => {
      const value = this.editTrekForm.value[key];
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    // Add cover image
    if (this.coverImageFile) {
      formData.append('coverImage', this.coverImageFile);
    }

    // Add gallery images
    this.galleryImageFiles.forEach(file => {
      formData.append('gallery', file);
    });

    // Add metadata
    formData.append('coverDeleted', String(this.coverDeleted));
    formData.append('deletedGallery', JSON.stringify(this.deletedGalleryFilenames));

    this.trekService.updateTrek(this.trekId, formData).subscribe((res: any) => {
      if (res?.success) {
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
