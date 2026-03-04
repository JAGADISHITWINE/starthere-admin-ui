import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Reviews } from './reviews';
import { AdminShellComponent } from '../shared/admin-shell/admin-shell.component';
import { DropdownManagerService } from '../dropdown-manager/dropdown-manager.service';
import { take } from 'rxjs';

interface Review {
  id: number;
  customerName: string;
  trekName: string;
  likes: number;
  comment: string;
  date: string;
  avatar: string;
  status: 'pending' | 'approved' | 'rejected';
}

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AdminShellComponent],
})
export class ReviewsComponent implements OnInit {

  searchQuery: string = '';
  selectedStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  reviewStatusOptions: string[] = [];
  reviews: Review[] = [];
  loading: boolean = false;

  constructor(
    private reviewService: Reviews,
    private dropdownService: DropdownManagerService
  ) {}

  ngOnInit() {
    this.loadDropdownOptions();
    this.loadReviews();
  }

  private loadDropdownOptions() {
    this.dropdownService.getGroupOptions('reviewStatus').pipe(take(1)).subscribe((opts) => {
      if (opts.length > 0) {
        this.reviewStatusOptions = opts.map((opt) => opt.value) as Array<'pending' | 'approved' | 'rejected'>;
      }
    });
  }

  loadReviews() {
    this.loading = true;

    this.reviewService.getAllReviews().subscribe({
      next: (res: any) => {
        if (res && res.success == true) {
          this.reviews = this.mapReviewData(res.data);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
        this.loading = false;
      }
    });
  }

  // 🔥 Proper mapping function
  mapReviewData(data: any[]): Review[] {
    return data.map((item: any) => ({
      id: item.id,
      customerName: item.author_name,
      trekName: item.trek_name,
      likes: item.likes,
      comment: item.comment,
      date: item.comment_date,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author_name)}&size=100`,
      status: (item.status || item.review_status || 'pending') as 'pending' | 'approved' | 'rejected'
    }));
  }

  get filteredReviews(): Review[] {
    let filtered = this.reviews;

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.customerName.toLowerCase().includes(query) ||
        r.trekName.toLowerCase().includes(query) ||
        r.comment.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  updateReviewStatus(review: Review, status: 'approved' | 'rejected') {
    this.reviewService.updateReviewStatus(review.id, status).subscribe({
      next: () => {
        this.reviews = this.reviews.map((item) =>
          item.id === review.id ? { ...item, status } : item
        );
      },
      error: (err) => {
        console.error(`Failed to ${status} review:`, err);
      }
    });
  }
}
