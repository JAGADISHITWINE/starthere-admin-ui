import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationsService } from 'src/app/notifications/notifications.service';
import { WebSocketService } from 'src/app/services/websocket.service';
import { AuthService } from 'src/app/core/services/auth.service';

interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
  permission: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss'],
})
export class AdminShellComponent implements OnInit, OnDestroy {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() sectionLabel = 'Admin';

  isMobileMenuOpen = false;
  unreadNotifications = 0;
  private wsSubscription?: Subscription;

  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'grid-1x2', route: '/admin/dashboard', permission: 'dashboard.view' },
    { label: 'Bookings', icon: 'calendar-event', route: '/admin/bookings', permission: 'bookings.view' },
    { label: 'Treks', icon: 'map', route: '/admin/treks/list', permission: 'treks.view' },
    { label: 'Coupons', icon: 'ticket-perforated', route: '/admin/coupons', permission: 'treks.manage' },
    { label: 'Users', icon: 'people', route: '/admin/users', permission: 'users.view' },
    { label: 'Reviews', icon: 'chat-square-quote', route: '/admin/reviews', permission: 'reviews.view' },
    { label: 'Operations', icon: 'clipboard-data', route: '/admin/operations', permission: 'operations.view' },
    { label: 'Blog', icon: 'file-earmark-richtext', route: '/admin/blog/posts', permission: 'blog.view' },
    { label: 'Dropdowns', icon: 'list-ul', route: '/admin/dropdowns', permission: 'dropdowns.manage' },
  ];

  constructor(
    private router: Router,
    private notificationsService: NotificationsService,
    private wsService: WebSocketService,
    private authService: AuthService
  ) {}

  get visibleNavItems(): AdminNavItem[] {
    return this.navItems.filter((item) => this.authService.hasPermission(item.permission));
  }

  ngOnInit(): void {
    this.loadNotificationCount();
    this.wsService.connect();
    this.wsSubscription = this.wsService.getBookingUpdates().subscribe((update) => {
      if (update?.type) {
        this.unreadNotifications += 1;
      }
    });
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(`${route}/`);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout(): void {
    this.authService.clearSession();
    this.router.navigate(['']);
  }

  openNotifications(): void {
    this.router.navigate(['/admin/notifications']);
  }

  private loadNotificationCount(): void {
    this.notificationsService.getNotifications().subscribe({
      next: (res: any) => {
        const rows = this.extractNotificationRows(res);
        this.unreadNotifications = rows.filter((n: any) => !this.isRead(n?.read)).length;
      },
      error: () => {
        this.unreadNotifications = 0;
      }
    });
  }

  private extractNotificationRows(response: any): any[] {
    if (Array.isArray(response?.data?.notifications)) return response.data.notifications;
    if (Array.isArray(response?.notifications)) return response.notifications;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    if (Array.isArray(response)) return response;
    return [];
  }

  private isRead(value: any): boolean {
    if (value === true || value === 1) return true;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'yes';
    }
    return false;
  }
}
