import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostEditor } from '../post-editor';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  category: string;
  category_name?: string;
  status: 'published' | 'draft' | 'scheduled';
  views: number;
  comments?: number;
  publishDate: string;
  image: string;
  featured_image?: string;
  tags?: string[];
}

@Component({
  selector: 'app-posts-list',
  templateUrl: './posts-list.component.html',
  styleUrls: ['./posts-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class PostsListComponent implements OnInit {
  searchQuery: string = '';
  selectedStatus: string = 'all';
  selectedCategory: string = 'all';
  isLoading: boolean = false;

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' }
  ];

  categoryOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All Categories' }
  ];

  posts: BlogPost[] = [];

  constructor(
    private router: Router,
    private postEditorService: PostEditor,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadPosts();
    this.loadCategories();
  }

  async loadPosts() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading posts...',
    });
    await loading.present();

    this.postEditorService.getAllPosts().subscribe({
      next: (posts) => {
        this.posts = posts.map(post => ({
          id: post.id!,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          author: post.author || 'Admin',
          category: post.category_name || post.category,
          category_name: post.category_name,
          status: post.status,
          views: post.views || 0,
          comments: 0,
          publishDate: this.formatDate(post.published_at || post.created_at),
          image: post.featured_image || post.featuredImage || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
          featured_image: post.featured_image,
          tags: post.tags || []
        }));
        loading.dismiss();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        loading.dismiss();
        this.isLoading = false;
        this.showToast('Failed to load posts', 'danger');
      }
    });
  }

  async loadCategories() {
    this.postEditorService.getCategories().subscribe({
      next: (categories) => {
        this.categoryOptions = [
          { value: 'all', label: 'All Categories' },
          ...categories.map(cat => ({
            value: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
            label: cat.name
          }))
        ];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  get filteredPosts(): BlogPost[] {
    let filtered = this.posts;

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === this.selectedStatus);
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const categorySlug = p.category.toLowerCase().replace(/\s+/g, '-');
        return categorySlug === this.selectedCategory || p.category_name?.toLowerCase() === this.selectedCategory;
      });
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Not published';

    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-GB', options);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'scheduled': return 'primary';
      default: return 'medium';
    }
  }

  createPost() {
    this.router.navigate(['/admin/blog/editor']);
  }

  editPost(id: number) {
    this.router.navigate(['/admin/blog/editor', id]);
  }

  async deletePost(id: number) {
    const alert = await this.alertController.create({
      header: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.confirmDelete(id);
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmDelete(id: number) {
    const loading = await this.loadingController.create({
      message: 'Deleting post...',
    });
    await loading.present();

    this.postEditorService.deletePost(id).subscribe({
      next: () => {
        loading.dismiss();
        this.showToast('Post deleted successfully', 'success');
        this.loadPosts();
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error deleting post:', error);
        this.showToast('Failed to delete post', 'danger');
      }
    });
  }

  async publishPost(post: BlogPost) {
    const loading = await this.loadingController.create({
      message: 'Publishing post...',
    });
    await loading.present();

    // Create FormData for the update
    const formData = new FormData();
    formData.append('title', post.title);
    formData.append('excerpt', post.excerpt);
    formData.append('content', post.content || '');
    formData.append('category', post.category);
    formData.append('status', 'published');
    formData.append('publishDate', new Date().toISOString());
    formData.append('author', post.author);
    formData.append('tags', JSON.stringify(post.tags || []));

    // Keep existing image
    if (post.featured_image) {
      formData.append('existingImageUrl', post.featured_image);
    }

    this.postEditorService.savePost(post.id, formData).subscribe({
      next: () => {
        loading.dismiss();
        this.showToast('Post published successfully', 'success');
        this.loadPosts(); // Reload to get updated data
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error publishing post:', error);
        this.showToast('Failed to publish post', 'danger');
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

  refreshPosts(event?: any) {
    this.loadPosts();
    if (event) {
      setTimeout(() => {
        event.target.complete();
      }, 1000);
    }
  }
}