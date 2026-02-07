// trek-add.component.ts - UPDATED with Multi-Batch Support

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TrekAdd } from './trek-add';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExcelUploadService } from 'src/app/services/excel-upload.service';

@Component({
  selector: 'app-trek-add',
  templateUrl: './trek-add.component.html',
  styleUrls: ['./trek-add.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class TrekAddComponent implements OnInit {
  addTrekForm!: FormGroup;

  // Images
  coverImage: File | null = null;
  coverPreview: string | null = null;
  galleryFiles: File[] = [];
  galleryPreviews: string[] = [];

  // Excel upload
  isUploadingExcel = false;
  excelFileName = '';
  uploadedBatchCount = 0;

  difficulties = ['Easy', 'Moderate', 'Difficult', 'Extreme', 'Challenging'];
  categories = ['Peak Trek', 'Hill Trek', 'Waterfall Trek','Mountain Trek', 'Forest Trek', 'Desert Trek', 'Snow Trek'];
  fitnessLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  batchStatuses = ['active', 'inactive', 'cancelled', 'completed'];
  constructor(
    private fb: FormBuilder,
    private trekService: TrekAdd,
    private router: Router,
    private excelService: ExcelUploadService
  ) { }

  ngOnInit() {
    this.addTrekForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      difficulty: ['', Validators.required],
      category: ['', Validators.required],
      fitnessLevel: [''],
      description: [''],
      highlights: this.fb.array([this.fb.control('')]),
      batches: this.fb.array([this.createBatch()]),
      thingsToCarry: this.fb.array([]),
      importantNotes: this.fb.array([])
    });
  }

  /* ----------------- EXCEL UPLOAD ----------------- */

  /**
   * Handle Excel file selection
   */
  async onExcelFileSelect(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    this.isUploadingExcel = true;
    this.excelFileName = file.name;

    try {
      // Read Excel file
      const result = await this.excelService.readExcelFile(file);

      if (result.success && result.data.length > 0) {

        // Parse trek data
        const parsedData = this.excelService.parseTrekData(result.data);

        // Convert to form data with multiple batches
        const formData = this.excelService.convertToFormData(parsedData);

        // Populate form
        this.populateFormFromExcel(formData);

        this.uploadedBatchCount = formData.batches.length;

      } else {
        alert('No data found in Excel file');
      }
    } catch (error) {
      console.error('Excel upload error:', error);
      alert('Failed to read Excel file. Please check the format and try again.');
    } finally {
      this.isUploadingExcel = false;
      // Reset file input
      event.target.value = '';
    }
  }

  /**
   * Populate form with Excel data (supports multiple batches)
   */
  populateFormFromExcel(data: any) {
    // Clear existing arrays
    this.clearFormArrays();

    // Set basic trek info
    this.addTrekForm.patchValue({
      name: data.trekInfo.name,
      location: data.trekInfo.location,
      difficulty: data.trekInfo.difficulty,
      category: data.trekInfo.category,
      fitnessLevel: data.trekInfo.fitnessLevel,
      description: data.trekInfo.description
    });

    // Populate highlights
    if (data.trekInfo.highlights && data.trekInfo.highlights.length > 0) {
      data.trekInfo.highlights.forEach((highlight: string) => {
        if (highlight) {
          this.highlights.push(this.fb.control(highlight));
        }
      });
    } else {
      this.highlights.push(this.fb.control(''));
    }

    // Populate things to carry
    if (data.trekInfo.thingsToCarry && data.trekInfo.thingsToCarry.length > 0) {
      data.trekInfo.thingsToCarry.forEach((item: string) => {
        if (item) {
          this.thingsToCarry.push(this.fb.control(item));
        }
      });
    }

    // Populate important notes
    if (data.trekInfo.importantNotes && data.trekInfo.importantNotes.length > 0) {
      data.trekInfo.importantNotes.forEach((note: string) => {
        if (note) {
          this.importantNotes.push(this.fb.control(note));
        }
      });
    }

    // Populate ALL batches
    if (data.batches && data.batches.length > 0) {
      // Remove default empty batch
      while (this.batches.length > 0) {
        this.batches.removeAt(0);
      }

      // Add each batch from Excel
      data.batches.forEach((batch: any, index: number) => {
        const batchGroup = this.createBatch();

        // Set batch data
        batchGroup.patchValue({
          startDate: batch.startDate,
          endDate: batch.endDate,
          availableSlots: batch.availableSlots,
          price: batch.price,
          minAge: batch.minAge,
          maxAge: batch.maxAge,
          duration: batch.duration,
          minParticipants: batch.minParticipants,
          maxParticipants: batch.maxParticipants,
          batchStatus: batch.batchStatus
        });

        // Populate inclusions
        const inclusionsArray = batchGroup.get('inclusions') as FormArray;
        inclusionsArray.clear();
        if (batch.inclusions && batch.inclusions.length > 0) {
          batch.inclusions.forEach((inc: string) => {
            if (inc) inclusionsArray.push(this.fb.control(inc));
          });
        } else {
          inclusionsArray.push(this.fb.control(''));
        }

        // Populate exclusions
        const exclusionsArray = batchGroup.get('exclusions') as FormArray;
        exclusionsArray.clear();
        if (batch.exclusions && batch.exclusions.length > 0) {
          batch.exclusions.forEach((exc: string) => {
            if (exc) exclusionsArray.push(this.fb.control(exc));
          });
        } else {
          exclusionsArray.push(this.fb.control(''));
        }

        // Populate itinerary
        const itineraryArray = batchGroup.get('itineraryDays') as FormArray;
        itineraryArray.clear();
        if (batch.itineraryDays && batch.itineraryDays.length > 0) {
          batch.itineraryDays.forEach((day: any) => {
            const dayGroup = this.createDay(day.dayNumber);
            dayGroup.patchValue({
              dayNumber: day.dayNumber,
              title: day.title
            });

            // Populate activities
            const activitiesArray = dayGroup.get('activities') as FormArray;
            if (day.activities && day.activities.length > 0) {
              day.activities.forEach((activity: any) => {
                activitiesArray.push(this.fb.group({
                  activityTime: [activity.activityTime, Validators.required],
                  activityText: [activity.activityText, Validators.required]
                }));
              });
            }

            itineraryArray.push(dayGroup);
          });
        } else {
          itineraryArray.push(this.createDay(1));
        }
        this.batches.push(batchGroup);
      });
    }
  }

  /**
   * Clear all form arrays
   */
  clearFormArrays() {
    while (this.highlights.length > 0) {
      this.highlights.removeAt(0);
    }
    while (this.thingsToCarry.length > 0) {
      this.thingsToCarry.removeAt(0);
    }
    while (this.importantNotes.length > 0) {
      this.importantNotes.removeAt(0);
    }
    while (this.batches.length > 0) {
      this.batches.removeAt(0);
    }
  }

  /**
   * Download multi-batch template
   */
  downloadTemplate() {
    this.excelService.downloadTemplate();
  }

  /**
   * Download single batch template
   */
  downloadSingleBatchTemplate() {
    this.excelService.downloadSingleBatchTemplate();
  }

  /* ----------------- BATCHES ----------------- */

  get batches(): FormArray {
    return this.addTrekForm.get('batches') as FormArray;
  }

  createBatch(): FormGroup {
    return this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      availableSlots: ['', Validators.required],
      minAge: [''],
      maxAge: [''],
      minParticipants: [''],
      maxParticipants: [''],
      duration: [''],
      batchStatus: ['active', Validators.required],
      price: ['', Validators.required],
      inclusions: this.fb.array([this.fb.control('')]),
      exclusions: this.fb.array([this.fb.control('')]),
      itineraryDays: this.fb.array([this.createDay(1)]),
    });
  }

  addBatch() {
    this.batches.push(this.createBatch());
  }

  removeBatch(index: number) {
    if (this.batches.length > 1) {
      this.batches.removeAt(index);
    } else {
      alert('At least one batch is required');
    }
  }

  /* ----------------- ARRAYS ----------------- */

  get highlights(): FormArray {
    return this.addTrekForm.get('highlights') as FormArray;
  }

  addHighlight() {
    this.highlights.push(this.fb.control(''));
  }

  removeHighlight(index: number) {
    if (this.highlights.length > 1) {
      this.highlights.removeAt(index);
    }
  }

  getInclusions(i: number): FormArray {
    return this.batches.at(i).get('inclusions') as FormArray;
  }

  addInclusion(i: number) {
    this.getInclusions(i).push(this.fb.control(''));
  }

  removeInclusion(i: number, ii: number) {
    const inclusions = this.getInclusions(i);
    if (inclusions.length > 1) {
      inclusions.removeAt(ii);
    }
  }

  getExclusions(i: number): FormArray {
    return this.batches.at(i).get('exclusions') as FormArray;
  }

  addExclusion(i: number) {
    this.getExclusions(i).push(this.fb.control(''));
  }

  removeExclusion(i: number, ei: number) {
    const exclusions = this.getExclusions(i);
    if (exclusions.length > 1) {
      exclusions.removeAt(ei);
    }
  }

  /* ---------- ITINERARY ---------- */

  getItineraryDays(batchIndex: number): FormArray {
    return this.batches.at(batchIndex).get('itineraryDays') as FormArray;
  }

  createDay(dayNumber: number): FormGroup {
    return this.fb.group({
      dayNumber: [dayNumber, Validators.required],
      title: ['', Validators.required],
      activities: this.fb.array([])
    });
  }

  addItineraryDay(batchIndex: number) {
    const itineraryDays = this.getItineraryDays(batchIndex);
    const dayNumber = itineraryDays.length + 1;
    itineraryDays.push(this.createDay(dayNumber));
  }

  removeItineraryDay(batchIndex: number, dayIndex: number) {
    const itineraryDays = this.getItineraryDays(batchIndex);
    if (itineraryDays.length > 1) {
      itineraryDays.removeAt(dayIndex);
      this.recalculateDayNumbers(batchIndex);
    }
  }

  recalculateDayNumbers(batchIndex: number) {
    const itineraryDays = this.getItineraryDays(batchIndex);
    for (let i = 0; i < itineraryDays.length; i++) {
      itineraryDays.at(i).patchValue({ dayNumber: i + 1 });
    }
  }

  createActivity() {
    return this.fb.group({
      activityTime: ['', Validators.required],
      activityText: ['', Validators.required],
    });
  }

  getActivities(batchIndex: number, dayIndex: number) {
    return this.getItineraryDays(batchIndex).at(dayIndex).get('activities') as FormArray;
  }

  addActivity(batchIndex: number, dayIndex: number) {
    this.getActivities(batchIndex, dayIndex).push(this.createActivity());
  }

  removeActivity(batchIndex: number, dayIndex: number, activityIndex: number) {
    this.getActivities(batchIndex, dayIndex).removeAt(activityIndex);
  }

  /* ---------- THINGS TO CARRY & NOTES ---------- */

  get thingsToCarry(): FormArray {
    return this.addTrekForm.get('thingsToCarry') as FormArray;
  }

  get importantNotes(): FormArray {
    return this.addTrekForm.get('importantNotes') as FormArray;
  }

  addCarryItem() {
    this.thingsToCarry.push(this.fb.control(''));
  }

  removeCarryItem(index: number) {
    if (this.thingsToCarry.length > 1) {
      this.thingsToCarry.removeAt(index);
    }
  }

  addNote() {
    this.importantNotes.push(this.fb.control(''));
  }

  removeNote(index: number) {
    if (this.importantNotes.length > 1) {
      this.importantNotes.removeAt(index);
    }
  }

  /* ---------- IMAGES ---------- */

  onCoverImageSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.coverImage = file;
    const reader = new FileReader();
    reader.onload = () => (this.coverPreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  removeCoverImage() {
    this.coverImage = null;
    this.coverPreview = null;
  }

  onGallerySelect(event: any) {
    const files: FileList = event.target.files;
    Array.from(files).forEach((file) => {
      this.galleryFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.galleryPreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeGalleryImage(index: number) {
    this.galleryFiles.splice(index, 1);
    this.galleryPreviews.splice(index, 1);
  }

  /* ---------- SAVE ---------- */

  saveTrek() {
    if (this.addTrekForm.invalid) {
      this.addTrekForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();

    Object.keys(this.addTrekForm.value).forEach(key => {
      const value = this.addTrekForm.value[key];
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    if (this.coverImage) {
      formData.append('coverImage', this.coverImage);
    }

    this.galleryFiles.forEach(file => {
      formData.append('gallery', file);
    });

    this.trekService.createTrek(formData).subscribe((response: any) => {
      if (response && response.success == true) {
        this.addTrekForm.reset();
        this.coverImage = null;
        this.coverPreview = null;
        this.galleryFiles = [];
        this.galleryPreviews = [];
        this.router.navigate(['/admin/treks/list']);
      } else {
        alert('Failed to create trek. Please try again.');
      }
    });
  }
}
