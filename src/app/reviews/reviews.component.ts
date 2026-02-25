import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Reviews } from './reviews';
import { RouterLink } from '@angular/router';

interface Review {
  id: number;
  customerName: string;
  trekName: string;
  likes: number;
  comment: string;
  date: string;
  avatar: string;
}

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],
})
export class ReviewsComponent implements OnInit {

  searchQuery: string = '';
  reviews: Review[] = [];
  loading: boolean = false;

  constructor(private reviewService: Reviews) {}

  ngOnInit() {
    this.loadReviews();
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
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author_name)}&size=100`
    }));
  }

  get filteredReviews(): Review[] {
    let filtered = this.reviews;

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
}
