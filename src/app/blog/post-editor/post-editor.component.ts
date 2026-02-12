import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostEditor } from '../post-editor';

@Component({
  selector: 'app-post-editor',
  templateUrl: './post-editor.component.html',
  styleUrls: ['./post-editor.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
})
export class PostEditorComponent implements OnInit {
  postId: number | null = null;
  isEditMode: boolean = false;
  postForm!: FormGroup;
  
  // Image handling
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  existingImageUrl: string | null = null;

  categories = [
    'Trek Guides',
    'Tips & Tricks',
    'Gear Reviews',
    'Travel Stories',
    'Safety',
    'Destinations'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private postEditorService: PostEditor,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.initForm();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.postId = +params['id'];
        this.isEditMode = true;
        this.loadPost(this.postId);
      }
    });
  }

  initForm() {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      excerpt: ['', Validators.required],
      content: ['', Validators.required],
      category: ['', Validators.required],
      tags: this.fb.array([this.createTagControl()]),
      status: ['draft'],
      publishDate: [new Date().toISOString(), Validators.required],
      author: ['Admin', Validators.required]
    });
  }

  get tags(): FormArray {
    return this.postForm.get('tags') as FormArray;
  }

  createTagControl(value: string = ''): FormControl {
    return this.fb.control(value);
  }

  addTag() {
    this.tags.push(this.createTagControl());
  }

  removeTag(index: number) {
    if (this.tags.length > 1) {
      this.tags.removeAt(index);
    }
  }

  loadPost(id: number) {
    this.postEditorService.getPost(id).subscribe({
      next: (post: any) => {
        // Clear existing tags
        while (this.tags.length) {
          this.tags.removeAt(0);
        }

        // Add tags from loaded post
        if (post.tags && post.tags.length > 0) {
          post.tags.forEach((tag: string) => {
            this.tags.push(this.createTagControl(tag));
          });
        } else {
          this.tags.push(this.createTagControl());
        }

        // Set existing image
        if (post.featured_image) {
          this.existingImageUrl = post.featured_image;
          this.imagePreview = post.featured_image;
        }

        // Patch form with post data
        this.postForm.patchValue({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          status: post.status,
          publishDate: post.published_at || new Date().toISOString(),
          author: post.author_id || 'Admin'
        });
      },
      error: (err) => {
        console.error('Error loading post:', err);
        this.showToast('Failed to load post', 'danger');
      }
    });
  }

  loadCategories() {
    this.postEditorService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats.map(c => c.name);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showToast('Please select an image file', 'warning');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.showToast('Image size should be less than 5MB', 'warning');
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      this.showToast('Image selected successfully', 'success');
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.existingImageUrl = null;
    
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.showToast('Image removed', 'success');
  }

  async publish() {
    if (this.postForm.invalid) {
      Object.keys(this.postForm.controls).forEach(key => {
        this.postForm.get(key)?.markAsTouched();
      });
      this.showToast('Please fill all required fields', 'warning');
      return;
    }

    this.postForm.patchValue({ status: 'published' });
    await this.savePost();
  }

  async savePost() {
    const loading = await this.loadingController.create({
      message: 'Saving post...',
    });
    await loading.present();

    const formValue = { ...this.postForm.value };
    
    // Filter out empty tags
    formValue.tags = formValue.tags.filter((tag: string) => tag && tag.trim() !== '');

    // Create FormData
    const formData = new FormData();
    
    // Append all form fields
    formData.append('title', formValue.title);
    formData.append('excerpt', formValue.excerpt);
    formData.append('content', formValue.content);
    formData.append('category', formValue.category);
    formData.append('status', formValue.status);
    formData.append('publishDate', formValue.publishDate);
    formData.append('author', formValue.author);
    formData.append('tags', JSON.stringify(formValue.tags));

    // Append image file if selected (new upload)
    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    } else if (this.existingImageUrl && this.imagePreview) {
      // Keep existing image URL if not changed
      formData.append('existingImageUrl', this.existingImageUrl);
    }

    // Save post
    this.postEditorService.savePost(this.postId, formData).subscribe({
      next: (res: any) => {
        loading.dismiss();
        console.log('Post saved:', res);
        this.showToast('Post saved successfully!', 'success');
        this.router.navigate(['/admin/blog/posts']);
      },
      error: (err: any) => {
        loading.dismiss();
        console.error('Error saving post:', err);
        this.showToast('Failed to save post', 'danger');
      }
    });
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      color: color
    });
    toast.present();
  }
}