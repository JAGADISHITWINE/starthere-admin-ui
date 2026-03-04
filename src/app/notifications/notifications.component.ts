import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationsService } from './notifications.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { WebSocketService } from '../services/websocket.service';
import { AdminShellComponent } from '../shared/admin-shell/admin-shell.component';

/* ============================
   TYPES
============================ */

export type NotificationType =
  | 'booking'
  | 'trek'
  | 'blog'
  | 'comment'
  | 'weather'
  | 'guide'
  | 'offer'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  actionLabel?: string;
  meta?: string;
  route?: string;
}

type FilterTab = 'all' | 'unread' | NotificationType;

interface NotificationView extends Notification {
  icon: string;
  typeLabel: string;
  timeAgo: string;
  dateIso: string;
}

/* ============================
   COMPONENT
============================ */

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule, AdminShellComponent],
  providers: [NotificationsService],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {

  /* ============================
     STATE (Signals)
  ============================ */

  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  activeTab = signal<FilterTab>('all');

  private allNotifications = signal<NotificationView[]>([]);

  /* ============================
     TABS
  ============================ */

  readonly tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',     label: 'All' },
    { key: 'unread',  label: 'Unread' },
    { key: 'booking', label: 'Bookings' },
    { key: 'blog',    label: 'Blogs' },
    { key: 'comment', label: 'Comments' },
    { key: 'trek',    label: 'Treks' },
    { key: 'weather', label: 'Weather' },
    { key: 'offer',   label: 'Offers' },
  ];

  /* ============================
     COMPUTED
  ============================ */

  notifications = computed(() => {
    const tab = this.activeTab();
    const all = this.allNotifications();

    if (tab === 'all') return all;
    if (tab === 'unread') return all.filter(n => !n.read);
    return all.filter(n => n.type === tab);
  });

  unreadCount = computed(() =>
    this.allNotifications().filter(n => !n.read).length
  );

  /* ============================
     CONSTRUCTOR
  ============================ */

  private destroyRef = inject(DestroyRef);

  constructor(
    private notificationsService: NotificationsService,
    private webSocket: WebSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchNotifications();
    this.listenToSocket();
  }

  /* ============================
     API
  ============================ */

  fetchNotifications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.notificationsService.getNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response: any) => {
        const rows = this.extractNotificationRows(response.data.notifications || response);
        const mapped: NotificationView[] = rows.map((n: any) => {
          const date = new Date(n.date || n.createdAt || n.created_at || Date.now());
          const type = this.mapType(n.type);
          const route = this.resolveRoute(n, type);
          return {
            id: String(n.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            type,
            title: n.title || 'Notification',
            message: n.message || '',
            date,
            read: this.isRead(n.read),
            actionLabel: n.actionLabel || (route ? 'Open' : undefined),
            meta: n.meta || n.reference || n.trekName || n.postTitle,
            route,
            icon: this.getIcon(type),
            typeLabel: this.getTypeLabel(type),
            timeAgo: this.timeAgo(date),
            dateIso: date.toISOString(),
          };
        });

        this.allNotifications.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load notifications.');
        this.loading.set(false);
      }
    });
  }

  /* ============================
     ACTIONS
  ============================ */

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  markAllRead(): void {
    const hadUnread = this.unreadCount() > 0;
    this.allNotifications.update(ns => ns.map(n => ({ ...n, read: true })));

    if (!hadUnread) return;

    this.notificationsService.markAllRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.fetchNotifications();
        }
      });
  }

  markRead(id: string): void {
    let changed = false;
    this.allNotifications.update(ns =>
      ns.map(n => {
        if (n.id === id && !n.read) {
          changed = true;
          return { ...n, read: true };
        }
        return n;
      })
    );

    if (!changed) return;

    this.notificationsService.markRead(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.fetchNotifications();
        }
      });
  }

  dismiss(id: string): void {
    this.allNotifications.update(ns =>
      ns.filter(n => n.id !== id)
    );
  }

  openNotification(notification: NotificationView): void {
    this.markRead(notification.id);
    if (notification.route) {
      this.router.navigateByUrl(notification.route);
    }
  }

  onActionClick(event: Event, notification: NotificationView): void {
    event.stopPropagation();
    this.openNotification(notification);
  }

  /* ============================
     HELPERS
  ============================ */

  private getIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      booking: '🎫',
      trek: '🏔️',
      blog: '📝',
      comment: '💬',
      weather: '⛈️',
      guide: '🧭',
      offer: '🏷️',
      system: '⚙️',
    };
    return icons[type];
  }

  private getTypeLabel(type: NotificationType): string {
    const labels: Record<NotificationType, string> = {
      booking: 'Booking',
      trek: 'Trek',
      blog: 'Blog',
      comment: 'Comment',
      weather: 'Weather',
      guide: 'Guide',
      offer: 'Offer',
      system: 'System',
    };
    return labels[type];
  }

  private timeAgo(date: Date): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }

  private listenToSocket(): void {
    this.webSocket.connect();
    this.webSocket.getBookingUpdates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update) => {
        const next = this.mapSocketUpdate(update);
        if (!next) return;
        this.allNotifications.update(ns => [next, ...ns]);
      });
  }

  private mapSocketUpdate(update: any): NotificationView | null {
    if (!update?.type) return null;

    const data = update?.data || {};
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (update.type === 'created') {
      const title = 'New booking created';
      const ref = data.bookingReference || data.bookingId || 'Unknown booking';
      const customer = data.customerName || 'Customer';
      const trek = data.trekName ? ` for ${data.trekName}` : '';
      const message = `${customer} placed ${ref}${trek}.`;
      return this.buildNotification(
        id,
        'booking',
        title,
        message,
        createdAt,
        false,
        'View booking',
        data.trekName,
        '/admin/bookings'
      );
    }

    if (update.type === 'completed') {
      const title = 'Booking completed';
      const ref = data.bookingReference || data.bookingId || 'Unknown booking';
      const message = `Booking ${ref} is marked completed.`;
      return this.buildNotification(
        id,
        'booking',
        title,
        message,
        createdAt,
        false,
        'View booking',
        data.trekName,
        '/admin/bookings'
      );
    }

    if (update.type === 'batch-completed') {
      const title = 'Batch processed';
      const message = data.message || 'A booking batch finished processing.';
      return this.buildNotification(id, 'system', title, message, createdAt, false);
    }

    if (update.type === 'blog-created' || update.type === 'post-created' || update.type === 'blog-submitted') {
      const postId = data.postId || data.id;
      const postTitle = data.title || data.postTitle || 'New blog post';
      const title = 'New blog submitted';
      const message = `${data.authorName || 'A user'} submitted "${postTitle}" for approval.`;
      const route = postId ? `/admin/blog/editor/${postId}` : '/admin/blog/posts';
      return this.buildNotification(id, 'blog', title, message, createdAt, false, 'Review post', postTitle, route);
    }

    if (update.type === 'comment-created' || update.type === 'review-created' || update.type === 'comment-submitted') {
      const title = 'New comment submitted';
      const message = `${data.authorName || 'A user'} posted a new comment pending approval.`;
      return this.buildNotification(id, 'comment', title, message, createdAt, false, 'Review comment', data.trekName, '/admin/reviews');
    }

    return null;
  }

  private buildNotification(
    id: string,
    type: NotificationType,
    title: string,
    message: string,
    date: Date,
    read: boolean,
    actionLabel?: string,
    meta?: string,
    route?: string
  ): NotificationView {
    return {
      id,
      type,
      title,
      message,
      date,
      read,
      actionLabel,
      meta,
      route,
      icon: this.getIcon(type),
      typeLabel: this.getTypeLabel(type),
      timeAgo: this.timeAgo(date),
      dateIso: date.toISOString(),
    };
  }

  private mapType(type: string): NotificationType {
    switch ((type || '').toLowerCase()) {
      case 'booking':
      case 'trek':
      case 'weather':
      case 'guide':
      case 'offer':
      case 'system':
      case 'blog':
      case 'comment':
        return type.toLowerCase() as NotificationType;
      case 'review':
        return 'comment';
      case 'post':
      case 'content':
        return 'blog';
      default:
        return 'system';
    }
  }

  private resolveRoute(notification: any, type: NotificationType): string | undefined {
    const explicitRoute =
      notification?.route ||
      notification?.path ||
      notification?.url ||
      notification?.actionUrl ||
      notification?.targetUrl;

    if (explicitRoute) {
      return explicitRoute;
    }

    const entityId = notification?.postId || notification?.blogId || notification?.entityId || notification?.idRef;
    if (type === 'blog') {
      return entityId ? `/admin/blog/editor/${entityId}` : '/admin/blog/posts';
    }
    if (type === 'comment') {
      return '/admin/reviews';
    }
    if (type === 'booking') {
      return '/admin/bookings';
    }

    return undefined;
  }

  trackById(_: number, n: Notification): string {
    return n.id;
  }

  private extractNotificationRows(response: any): any[] {
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
