import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

interface Review {
  id: number;
  customerName: string;
  trekName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  avatar: string;
}

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ReviewsComponent implements OnInit {
  searchQuery: string = '';
  selectedStatus: string = 'pending';

  statusOptions = [
    { value: 'all', label: 'All Reviews' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  reviews: Review[] = [
    {
      id: 1,
      customerName: 'Rahul Sharma',
      trekName: 'Kumara Parvatha Trek',
      rating: 5,
      comment: 'Amazing trek! The guides were very experienced and helpful. The views from the summit were absolutely breathtaking.',
      date: '10 Jan 2026',
      status: 'pending',
      avatar: 'https://ui-avatars.com/api/?name=Rahul+Sharma&size=100'
    },
    {
      id: 2,
      customerName: 'Priya Menon',
      trekName: 'Skandagiri Night Trek',
      rating: 4,
      comment: 'Great experience! Would definitely recommend. The night trek was thrilling and sunrise was beautiful.',
      date: '08 Jan 2026',
      status: 'approved',
      avatar: 'https://ui-avatars.com/api/?name=Priya+Menon&size=100'
    },
    {
      id: 3,
      customerName: 'Arjun Reddy',
      trekName: 'Kudremukh Trek',
      rating: 5,
      comment: 'Best trek I\'ve done so far! Well organized, safety was top priority, and the food was surprisingly good!',
      date: '05 Jan 2026',
      status: 'approved',
      avatar: 'https://ui-avatars.com/api/?name=Arjun+Reddy&size=100'
    },
    {
      id: 4,
      customerName: 'Meera Singh',
      trekName: 'Tadiandamol Trek',
      rating: 2,
      comment: 'Not satisfied with the service. Guide was late and some facilities were missing.',
      date: '03 Jan 2026',
      status: 'pending',
      avatar: 'https://ui-avatars.com/api/?name=Meera+Singh&size=100'
    }
  ];

  constructor() {}

  ngOnInit() {}

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

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'medium';
    }
  }

  getStars(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  async approveReview(review: Review) {
    review.status = 'approved';
  }

  async rejectReview(review: Review) {
    review.status = 'rejected';
  }

  async deleteReview(id: number) {
    console.log('Delete review:', id);
  }
}
