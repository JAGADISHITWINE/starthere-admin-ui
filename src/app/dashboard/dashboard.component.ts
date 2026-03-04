import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Dashboard } from './dashboard';
import { Chart, registerables } from 'chart.js';
import { AdminShellComponent } from '../shared/admin-shell/admin-shell.component';
import { DropdownManagerService } from '../dropdown-manager/dropdown-manager.service';
import { take } from 'rxjs';

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
    AdminShellComponent,
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
      icon: 'plus-circle',
      route: '/admin/treks/add',
      color: 'success',
    },
    {
      label: 'View Bookings',
      icon: 'calendar-event',
      route: '/admin/bookings',
      color: 'primary',
    },
    {
      label: 'Write Blog Post',
      icon: 'file-text',
      route: '/admin/blog/editor',
      color: 'warning',
    },
    {
      label: 'Trek & Batch Management',
      icon: 'layers',
      route: '/admin/batch-management',
      color: 'secondary',
    },
    {
      label: 'Operations Center',
      icon: 'clipboard-data',
      route: '/admin/operations',
      color: 'primary',
    },
  ];
  Total_Blog: any;
  Total_comments: any;
  showAllBookings = false;
  searchQuery = '';
  statusFilter = 'all';
  rowOptions: number[] = [];
  bookingStatusOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All' },
  ];
  pageSize = 0;
  currentPage = 1;

  constructor(
    private router: Router,
    private dashboardService: Dashboard,
    private dropdownService: DropdownManagerService,
  ) { }

  ngOnInit() {
    this.loadDropdownOptions();
    this.dashboardService.getDashData().subscribe({
      next: (res: any) => {
      const data = res?.data || {};
      this.Total_users = data.totalUsers || 0;
      this.Total_active_users = data.totalactiveUsers || 0;
      this.Total_trek = data.totaltrekCount || 0;
      this.Total_bookings = data.totalbookingCount || 0;
      this.Total_Revenue = data.totalRevenue || 0;
      this.recentBooking = Array.isArray(data.recentBookings) ? data.recentBookings : [];
      this.currentPage = 1;
      this.Total_Blog = data.totalBlog || 0;
      this.Total_comments = data.totalComments || 0;
      this.labels = this.recentBooking.map((r: any) => r.month);
      this.bookingsData = this.recentBooking.map((r: any) => r.bookings);
      this.revenueData = this.recentBooking.map((r: any) => r.revenue);
      this.stats = [
        {
          title: 'Total Bookings',
          value: this.Total_bookings,
          change: '+12%',
          icon: 'calendar-event',
          color: 'primary',
          trend: 'up',
          route: '/admin/bookings',
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
          route: '/admin/revenue',
          disabled: false,
          isCurrency: true,
        },
        {
          title: 'Active Treks',
          value: this.Total_active_users,
          change: '+5',
          icon: 'person',
          color: 'warning',
          trend: 'up',
          route: '/admin/treks/list',
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
          route: '/admin/users',
          disabled: false,
          isCurrency: false,
        },
        {
          title: 'Pending Reviews',
          value: this.Total_comments,
          change: '-3',
          icon: 'star',
          color: 'secondary',
          trend: 'down',
          route: '/admin/reviews',
          disabled: false,
          isCurrency: false,
        },
        {
          title: 'Blog Posts',
          value: this.Total_Blog,
          change: '+8',
          icon: 'file-text',
          color: 'medium',
          trend: 'up',
          route: '/admin/blog/posts',
          disabled: false,
          isCurrency: false,
        },
        {
          title: 'View All Treks',
          value: this.Total_trek,
          change: '',
          icon: 'eye',
          color: 'medium',
          trend: 'up',
          route: '/admin/treks/list',
          disabled: false,
          isCurrency: false,
        },
      ];
      },
      error: () => {
        this.Total_users = 0;
        this.Total_active_users = 0;
        this.Total_trek = 0;
        this.Total_bookings = 0;
        this.Total_Revenue = 0;
        this.recentBooking = [];
      }
    });
  }

  private loadDropdownOptions() {
    this.dropdownService.getGroupOptions('bookingStatus').pipe(take(1)).subscribe((opts) => {
      if (opts.length === 0) return;
      this.bookingStatusOptions = [
        { value: 'all', label: 'All' },
        ...opts.map((opt) => ({ value: opt.value, label: opt.label })),
      ];
    });

    this.dropdownService.getGroupOptions('dashboardRows').pipe(take(1)).subscribe((opts) => {
      const mapped = opts
        .map((opt) => Number(opt.value || opt.label))
        .filter((num) => Number.isFinite(num) && num > 0);

      this.rowOptions = mapped;
      this.pageSize = mapped[0] || 0;
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

  toggleViewAll() {
    this.showAllBookings = !this.showAllBookings;
    this.currentPage = 1;
  }

  get filteredBookings() {
    const q = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;
    return this.recentBooking.filter((b: any) => {
      const matchesStatus = status === 'all' ? true : (b.status || '').toLowerCase() === status;
      if (!q) return matchesStatus;
      const haystack = [
        b.id,
        b.customerName,
        b.trekName,
        b.email,
        b.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesStatus && haystack.includes(q);
    });
  }

  get totalPages() {
    const size = this.effectivePageSize;
    return Math.max(1, Math.ceil(this.filteredBookings.length / size));
  }

  get pagedBookings() {
    const size = this.effectivePageSize;
    const start = (this.currentPage - 1) * size;
    return this.filteredBookings.slice(start, start + size);
  }

  get pageNumbers() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPage(page: number) {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  prevPage() {
    this.setPage(this.currentPage - 1);
  }

  nextPage() {
    this.setPage(this.currentPage + 1);
  }

  private get effectivePageSize() {
    return this.pageSize > 0 ? this.pageSize : Math.max(1, this.filteredBookings.length);
  }


}
