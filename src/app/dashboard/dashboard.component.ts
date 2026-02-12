import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Dashboard } from './dashboard';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  icon: string;
  color: string;
  trend: 'up' | 'down';
  route: string;
  disabled: boolean;
  isCurrency: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class DashboardComponent implements OnInit {
  stats: StatCard[] = [];
  Total_users!: number;
  Total_active_users!: number;
  Total_trek!: number;
  Total_bookings: any;
  Total_Revenue: any;
  recentBooking: any[] = [];
  @Input() labels: string[] = []; // e.g., ['Jan', 'Feb', 'Mar']
  @Input() bookingsData: number[] = []; // e.g., [10, 20, 15]
  @Input() revenueData: number[] = []; // e.g., [5, 12, 18]

  chart: any;

  quickActions = [
    {
      label: 'Add New Trek',
      icon: 'plus',
      route: '/admin/treks/add',
      color: 'success',
    },
    {
      label: 'View Bookings',
      icon: 'calendar',
      route: '/bookings',
      color: 'primary',
    },
    {
      label: 'Write Blog Post',
      icon: 'file-post',
      route: '/admin/blog/posts',
      color: 'warning',
    },
    {
      label: 'Trek & Batch Management',
      icon: 'collection',
      route: '/batchManagement',
      color: 'secondary',
    },
  ];

  constructor(
    private router: Router,
    private dashboardService: Dashboard,
  ) { }

  ngOnInit() {
    this.dashboardService.getDashData().subscribe((res: any) => {
      this.Total_users = res.data.totalUsers;
      this.Total_active_users = res.data.totalactiveUsers;
      this.Total_trek = res.data.totaltrekCount;
      this.Total_bookings = res.data.totalbookingCount;
      this.Total_Revenue = res.data.totalRevenue || 0;
      this.recentBooking = res.data.recentBookings;
      this.labels = this.recentBooking.map((r: any) => r.month);
      this.bookingsData = this.recentBooking.map((r: any) => r.bookings);
      this.revenueData = this.recentBooking.map((r: any) => r.revenue);
      this.stats = [
        {
          title: 'Total Bookings',
          value: this.Total_bookings,
          change: '+12%',
          icon: 'calendar',
          color: 'primary',
          trend: 'up',
          route: '/bookings',
          disabled: true,
          isCurrency: false,
        },
        {
          title: 'Revenue',
          value: this.Total_Revenue,
          change: '+18%',
          icon: 'cash',
          color: 'success',
          trend: 'up',
          route: '/revenue',
          disabled: false,
          isCurrency: true,
        },
        {
          title: 'Active Treks',
          value: this.Total_active_users,
          change: '+5',
          icon: 'person-walking',
          color: 'warning',
          trend: 'up',
          route: '/treks',
          disabled: true,
          isCurrency: false,
        },
        {
          title: 'Total Users',
          value: this.Total_users,
          change: '+25',
          icon: 'people-fill',
          color: 'tertiary',
          trend: 'up',
          route: '/users',
          disabled: false,
          isCurrency: false,
        },
        {
          title: 'Pending Reviews',
          value: 18,
          change: '-3',
          icon: 'star',
          color: 'secondary',
          trend: 'down',
          route: '/reviews',
          disabled: false,
          isCurrency: false,
        },
        {
          title: 'Blog Posts',
          value: 42,
          change: '+8',
          icon: 'file-post',
          color: 'medium',
          trend: 'up',
          route: '/admin/blog/editor',
          disabled: false,
          isCurrency: false,
        },
        {
          title: 'View All Treks',
          value: this.Total_trek,
          change: '',
          icon: 'eyeglasses',
          color: 'medium',
          trend: 'up',
          route: '/admin/treks/list',
          disabled: false,
          isCurrency: false,
        },
      ];
    });
  }

  onCardClick(stat: any) {
    if (stat.disabled) {
      return;
    }
    this.router.navigate([stat.route]); // ✅ allowed
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  viewBooking(id: number) {
    this.router.navigate(['/admin/bookings', id]);
  }

  logout() {
    this.router.navigate(['']);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
  }

  selectedBookingIndex: number | null = null;

  toggleDetails(index: number) {
    // Open details if not already open, close if clicked again
    this.selectedBookingIndex = this.selectedBookingIndex === index ? null : index;
  }

  closeDetails() {
    this.selectedBookingIndex = null;
  }


}
