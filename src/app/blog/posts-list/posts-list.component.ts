import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  status: 'published' | 'draft' | 'scheduled';
  views: number;
  comments: number;
  publishDate: string;
  image: string;
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

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' }
  ];

  categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'trek-guides', label: 'Trek Guides' },
    { value: 'tips-tricks', label: 'Tips & Tricks' },
    { value: 'gear-reviews', label: 'Gear Reviews' },
    { value: 'travel-stories', label: 'Travel Stories' },
    { value: 'safety', label: 'Safety' }
  ];

  posts: BlogPost[] = [
    {
      id: 1,
      title: 'Complete Guide to Kumara Parvatha Trek',
      excerpt: 'Everything you need to know about trekking to Karnataka\'s second highest peak...',
      author: 'Admin',
      category: 'trek-guides',
      status: 'published',
      views: 2450,
      comments: 18,
      publishDate: '12 Jan 2026',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
    },
    {
      id: 2,
      title: '10 Essential Items Every Trekker Must Carry',
      excerpt: 'A comprehensive checklist of must-have items for your trek...',
      author: 'Admin',
      category: 'tips-tricks',
      status: 'published',
      views: 1890,
      comments: 12,
      publishDate: '10 Jan 2026',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400'
    },
    {
      id: 3,
      title: 'Best Trekking Boots Under ₹5000',
      excerpt: 'Honest reviews of top budget-friendly trekking boots...',
      author: 'Admin',
      category: 'gear-reviews',
      status: 'draft',
      views: 0,
      comments: 0,
      publishDate: '15 Jan 2026',
      image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400'
    },
    {
      id: 4,
      title: 'Monsoon Trekking Safety Tips',
      excerpt: 'Essential safety measures for trekking during rainy season...',
      author: 'Admin',
      category: 'safety',
      status: 'scheduled',
      views: 0,
      comments: 0,
      publishDate: '20 Jan 2026',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {}

  get filteredPosts(): BlogPost[] {
    let filtered = this.posts;

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === this.selectedStatus);
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
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
    console.log('Delete post:', id);
  }

  async publishPost(post: BlogPost) {
    post.status = 'published';
  }
}
