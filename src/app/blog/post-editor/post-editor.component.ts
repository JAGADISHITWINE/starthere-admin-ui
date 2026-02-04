import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostEditor } from './post-editor';

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
  postForm: any

  post = {
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [''],
    featuredImage: null,
    status: 'draft',
    publishDate: new Date().toISOString(),
    author: 'Admin'
  };

  categories = [
    'Trek Guides',
    'Tips & Tricks',
    'Gear Reviews',
    'Travel Stories',
    'Safety',
    'Destinations'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postEditorService: PostEditor
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.postId = +params['id'];
        this.isEditMode = true;
        this.loadPost();
      }
    });

    this.postForm = new FormGroup({
      title: new FormControl('', [Validators.required]),
      excerpt: new FormControl('', [Validators.required]),
      content: new FormControl('', [Validators.required]),
      category: new FormControl('', [Validators.required]),
      tags: new FormControl('', [Validators.required]),
      featuredImage: new FormControl('', [Validators.required]),
      status: new FormControl('', [Validators.required]),
      publishDate: new FormControl('', [Validators.required]),
      author: new FormControl('', [Validators.required]),
    })
  }

  loadPost() {
    // Load post data for editing
    console.log('Loading post:', this.postId);
  }

  addTag() {
    this.post.tags.push('');
  }

  removeTag(index: number) {
    this.post.tags.splice(index, 1);
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('Image selected:', file);
    }
  }

  async saveDraft() {
    this.post.status = 'draft';
    await this.savePost();
  }

  async publish() {
    this.post.status = 'published';
    await this.savePost();
  }

  async schedule() {
    this.post.status = 'scheduled';
    await this.savePost();
  }

  async savePost() {
    this.postEditorService.savePost(this.postForm.value).subscribe((res: any) => {
      console.log(res)
    })
    // console.log('Saving post:', this.post);
    // this.router.navigate(['/admin/blog/posts']);
  }
}
