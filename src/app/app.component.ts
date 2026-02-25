import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { WebSocketService } from './services/websocket.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private updateSubscription?: Subscription;

  constructor(
    private wsService: WebSocketService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.wsService.connect();

    this.updateSubscription = this.wsService.getBookingUpdates().subscribe({
      next: (update) => {
        if (update?.type === 'created') {
          const ref = update?.data?.bookingReference || 'New booking';
          const name = update?.data?.customerName ? ` by ${update.data.customerName}` : '';
          this.notificationService.show(`New booking: ${ref}${name}`);
        }

        if (update?.type === 'completed') {
          const ref = update?.data?.bookingReference || 'Booking';
          this.notificationService.show(`Booking completed: ${ref}`);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    this.wsService.disconnect();
  }
}
