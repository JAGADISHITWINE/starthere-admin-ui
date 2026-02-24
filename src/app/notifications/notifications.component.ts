import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationsService } from './notifications.service';

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

/* ============================
   COMPONENT
============================ */

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule],
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
  panelOpen = signal<boolean>(true);

  private allNotifications = signal<Notification[]>([]);

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

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    this.fetchNotifications();
  }

  /* ============================
     API
  ============================ */

  fetchNotifications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.notificationsService.getNotifications().subscribe({
      next: (response: any) => {

        const mapped: Notification[] = (response?.results || []).map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          date: new Date(n.date),
          read: !!n.read,
          actionLabel: n.actionLabel,
          meta: n.meta,
        }));

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

  getIcon(type: NotificationType): string {
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

  getTypeLabel(type: NotificationType): string {
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

  timeAgo(date: Date): string {
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

  trackById(_: number, n: Notification): string {
    return n.id;
  }
}