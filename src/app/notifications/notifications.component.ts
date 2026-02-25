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
import { RouterLink } from '@angular/router';
import { WebSocketService } from '../services/websocket.service';

/* ============================
   TYPES
============================ */

export type NotificationType =
  | 'booking'
  | 'trek'
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
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule, RouterLink],
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
    private webSocket: WebSocketService
  ) {}

  ngOnInit(): void {
    this.fetchNotifications();
    this.listenToSocket();
    this.destroyRef.onDestroy(() => this.webSocket.disconnect());
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

        const mapped: NotificationView[] = (response?.results || []).map((n: any) => {
          const date = new Date(n.date);
          const type = n.type as NotificationType;
          return {
            id: n.id,
            type,
            title: n.title,
            message: n.message,
            date,
            read: !!n.read,
            actionLabel: n.actionLabel,
            meta: n.meta,
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
    this.allNotifications.update(ns =>
      ns.map(n => ({ ...n, read: true }))
    );
  }

  markRead(id: string): void {
    this.allNotifications.update(ns =>
      ns.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  }

  dismiss(id: string): void {
    this.allNotifications.update(ns =>
      ns.filter(n => n.id !== id)
    );
  }

  /* ============================
     HELPERS
  ============================ */

  private getIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      booking: '🎫',
      trek: '🏔️',
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
      return this.buildNotification(id, 'booking', title, message, createdAt, false, 'View booking', data.trekName);
    }

    if (update.type === 'completed') {
      const title = 'Booking completed';
      const ref = data.bookingReference || data.bookingId || 'Unknown booking';
      const message = `Booking ${ref} is marked completed.`;
      return this.buildNotification(id, 'booking', title, message, createdAt, false, 'View booking', data.trekName);
    }

    if (update.type === 'batch-completed') {
      const title = 'Batch processed';
      const message = data.message || 'A booking batch finished processing.';
      return this.buildNotification(id, 'system', title, message, createdAt, false);
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
    meta?: string
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
      icon: this.getIcon(type),
      typeLabel: this.getTypeLabel(type),
      timeAgo: this.timeAgo(date),
      dateIso: date.toISOString(),
    };
  }

  trackById(_: number, n: Notification): string {
    return n.id;
  }
}
