import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostEditor } from '../post-editor';
import { DropdownManagerService } from 'src/app/dropdown-manager/dropdown-manager.service';
import { take } from 'rxjs';
import { AdminShellComponent } from 'src/app/shared/admin-shell/admin-shell.component';
import { environment } from 'src/environments/environment';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  category: string;
  category_name?: string;
  status: 'published' | 'draft' | 'scheduled' | 'pending' | 'rejected';
  views: number;
  comments?: number;
  publishDate: string;
  image: string;
  featured_image?: string;
  tags?: string[];
  authorType?: "admin" | "user";
}

@Component({
  selector: 'app-posts-list',
  templateUrl: './posts-list.component.html',
  styleUrls: ['./posts-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AdminShellComponent],
})
export class PostsListComponent implements OnInit {
  private readonly imageBaseUrl = (environment.mediaBaseUrl || '').replace(/\/?$/, '/');
  searchQuery: string = '';
  selectedStatus: string = 'all';
  selectedCategory: string = 'all';
  isLoading: boolean = false;

  statusOptions = [
    { value: 'all', label: 'All Status' },
  ];

  categoryOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All Categories' }
  ];

  posts: BlogPost[] = [];

  constructor(
    private router: Router,
    private postEditorService: PostEditor,
    private dropdownService: DropdownManagerService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadDropdownOptions();
    this.loadPosts();
    this.loadCategories();
  }

  private loadDropdownOptions() {
    this.dropdownService.getGroupOptions('blogStatus').pipe(take(1)).subscribe((opts) => {
      if (opts.length === 0) return;
      this.statusOptions = [
        { value: 'all', label: 'All Status' },
        ...opts.map((opt) => ({ value: opt.value, label: opt.label }))
      ];
    });
  }

  async loadPosts() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading posts...',
    });
    await loading.present();

    this.postEditorService.getAllPosts().subscribe({
      next: (res: any) => {
        this.posts = res.map((post: any) => ({
          id: post.id!,
          title: post.title || 'Untitled',
          excerpt: post.excerpt || '',
          content: post.content,
          author: post.author_name || 'Admin',
          category: post.category_name || post.category || 'General',
          category_name: post.category_name,
          status: (post.status as any) || 'draft',
          views: post.views || 0,
          comments: 0,
          publishDate: this.formatDate(post.published_at || post.created_at),
          image: post.featured_image
            ? `${this.imageBaseUrl}${String(post.featured_image).replace(/^\/+/, '')}`
            : '',

          featured_image: post.featured_image
            ? `${this.imageBaseUrl}${String(post.featured_image).replace(/^\/+/, '')}`
            : '',


          tags: post.tags || [],
          authorType: String(post.author_type || "admin").toLowerCase() === "user" ? "user" : "admin"
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

  canApprovePost(post: BlogPost): boolean {
    return post.authorType === "user" && (post.status === "pending" || post.status === "rejected");
  }

  canPublishPost(post: BlogPost): boolean {
    if (post.status === "published") return false;
    if (post.authorType === "user") return post.status === "pending" || post.status === "rejected";
    return post.status === "draft" || post.status === "scheduled";
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'scheduled': return 'primary';
      case 'rejected': return 'danger';
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

  async approvePost(post: BlogPost) {
    const loading = await this.loadingController.create({
      message: 'Approving post...',
    });
    await loading.present();

    this.updatePostStatus(post, 'published').subscribe({
      next: () => {
        loading.dismiss();
        this.showToast('Post approved and published', 'success');
        this.loadPosts();
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error approving post:', error);
        this.showToast('Failed to approve post', 'danger');
      }
    });
  }

  async rejectPost(post: BlogPost) {
    const loading = await this.loadingController.create({
      message: 'Rejecting post...',
    });
    await loading.present();

    this.updatePostStatus(post, 'rejected').subscribe({
      next: () => {
        loading.dismiss();
        this.showToast('Post rejected', 'warning');
        this.loadPosts();
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error rejecting post:', error);
        this.showToast('Failed to reject post', 'danger');
      }
    });
  }

  private updatePostStatus(post: BlogPost, status: BlogPost['status']) {
    const formData = new FormData();
    formData.append('title', post.title);
    formData.append('excerpt', post.excerpt);
    formData.append('content', post.content || '');
    formData.append('category', post.category);
    formData.append('status', status);
    formData.append('publishDate', new Date().toISOString());
    formData.append('author', post.author);
    formData.append('tags', JSON.stringify(post.tags || []));

    if (post.featured_image) {
      formData.append('existingImageUrl', post.featured_image);
    }

    return this.postEditorService.savePost(post.id, formData);
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
}
