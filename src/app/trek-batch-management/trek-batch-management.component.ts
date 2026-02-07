import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { TrekBatchManagement } from './trek-batch-management';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-trek-batch-management',
  templateUrl: './trek-batch-management.component.html',
  styleUrls: ['./trek-batch-management.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink]
})
export class TrekBatchManagementComponent implements OnInit, OnDestroy {

  private updateSubscription = new Subscription(); 
  
  treks: any[] = [];
  selectedTrek: any = null;
  batches: any[] = [];
  selectedBatch: any = null;
  bookings: any[] = [];

  isLoadingTreks = false;
  isLoadingBatches = false;
  isLoadingBookings = false;

  showBatchesModal = false;
  showBookingsModal = false;
  completionStats: any = null;

  constructor(private trekMgmtService: TrekBatchManagement, private wsService: WebSocketService) {}

  ngOnInit() {
    this.loadTreks();
    this.loadCompletionStats();
    
    // Connect to WebSocket
    this.wsService.connect();
    this.wsService.joinAdminRoom();
    
    // Listen for real-time updates
    this.updateSubscription = this.wsService.getBookingUpdates().subscribe({
      next: (update) => {
        this.handleRealTimeUpdate(update);
      }
    });
  }

  /**
   * Load all treks
   */
  loadTreks() {
    this.isLoadingTreks = true;

    this.trekMgmtService.getTreks().subscribe({
      next: (response) => {
        if (response.success) {
          this.treks = response.treks;
        }
        this.isLoadingTreks = false;
      },
      error: (error) => {
        this.isLoadingTreks = false;
        alert('Failed to load treks');
      }
    });
  }

  /**
   * View batches for a trek
   */
  viewBatches(trek: any) {
    this.selectedTrek = trek;
    this.isLoadingBatches = true;
    this.showBatchesModal = true;

    this.trekMgmtService.getBatches(trek.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.batches = response.batches;
        }
        this.isLoadingBatches = false;
      },
      error: (error) => {
        console.error('Load batches error:', error);
        this.isLoadingBatches = false;
        alert('Failed to load batches');
      }
    });
  }

  /**
   * View bookings for a batch
   */
  viewBookings(batch: any) {
    this.selectedBatch = batch;
    this.isLoadingBookings = true;
    this.showBookingsModal = true;

    this.trekMgmtService.getBatchBookings(batch.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.bookings = response.bookings;
        }
        this.isLoadingBookings = false;
      },
      error: (error) => {
        console.error('Load bookings error:', error);
        this.isLoadingBookings = false;
        alert('Failed to load bookings');
      }
    });
  }

  /**
   * Stop booking for a batch
   */
  stopBooking(batch: any) {
    if (!confirm(`Are you sure you want to stop bookings for this batch?\n\nTrek: ${this.selectedTrek.name}\nDate: ${new Date(batch.start_date).toLocaleDateString()}`)) {
      return;
    }

    this.trekMgmtService.stopBooking(batch.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Booking stopped successfully!');
          batch.status = 'inactive';

          // Reload batches
          this.viewBatches(this.selectedTrek);
        }
      },
      error: (error) => {
        console.error('Stop booking error:', error);
        alert('Failed to stop booking');
      }
    });
  }

  /**
   * Resume booking for a batch
   */
  resumeBooking(batch: any) {
    if (!confirm(`Resume bookings for this batch?\n\nTrek: ${this.selectedTrek.name}\nDate: ${new Date(batch.start_date).toLocaleDateString()}`)) {
      return;
    }

    this.trekMgmtService.resumeBooking(batch.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Booking resumed successfully!');
          batch.status = 'active';

          // Reload batches
          this.viewBatches(this.selectedTrek);
        }
      },
      error: (error) => {
        console.error('Resume booking error:', error);
        alert('Failed to resume booking');
      }
    });
  }

  /**
   * Download bookings for a batch
   */
  downloadBatchBookings(batch: any) {
    this.trekMgmtService.downloadBatchBookings(batch.id).subscribe({
      next: (blob) => {
        const fileName = `${this.selectedTrek.name}_${new Date(batch.start_date).toISOString().split('T')[0]}_Bookings.xlsx`;
        this.trekMgmtService.triggerDownload(blob, fileName);
        alert('Download started!');
      },
      error: (error) => {
        console.error('Download error:', error);
        alert('Failed to download bookings');
      }
    });
  }

  /**
   * Download all bookings for a trek
   */
  downloadAllTrekBookings(trek: any) {
    this.trekMgmtService.downloadBatchBookings(trek.id).subscribe({
      next: (blob) => {
        const fileName = `${trek.name}_All_Bookings.xlsx`;
        this.trekMgmtService.triggerDownload(blob, fileName);
        alert('Download started!');
      },
      error: (error) => {
        console.error('Download error:', error);
        alert('Failed to download all bookings');
      }
    });
  }

  /**
   * Close batches modal
   */
  closeBatchesModal() {
    this.showBatchesModal = false;
    this.selectedTrek = null;
    this.batches = [];
  }

  /**
   * Close bookings modal
   */
  closeBookingsModal() {
    this.showBookingsModal = false;
    this.selectedBatch = null;
    this.bookings = [];
  }

  /**
   * Get batch status badge class
   */
  getBatchStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-danger';
      case 'full':
        return 'badge-warning';
      case 'completed':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Get booking status badge class
   */
  getBookingStatusClass(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Get payment status badge class
   */
  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'partial':
        return 'badge-info';
      case 'refunded':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

   ngOnDestroy() {
    // Cleanup
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    this.wsService.disconnect();
  }

  handleRealTimeUpdate(update: any) {
    if (update.type === 'completed') {
      // Show toast notification
      this.showNotification(`Booking ${update.data.bookingReference} completed!`);

      // Refresh current view
      if (this.showBookingsModal && this.selectedBatch) {
        this.viewBookings(this.selectedBatch);
      } else if (this.showBatchesModal && this.selectedTrek) {
        this.viewBatches(this.selectedTrek);
      } else {
        this.loadTreks();
      }

      // Update stats
      this.loadCompletionStats();
    } else if (update.type === 'created') {
      // New booking created by a user
      this.showNotification(`New booking: ${update.data.bookingReference} by ${update.data.customerName}`);

      // Refresh current view to show new booking counts
      if (this.showBookingsModal && this.selectedBatch) {
        this.viewBookings(this.selectedBatch);
      } else if (this.showBatchesModal && this.selectedTrek) {
        this.viewBatches(this.selectedTrek);
      } else {
        this.loadTreks();
      }

      // Update stats
      this.loadCompletionStats();
    }
  }

  showNotification(message: string) {
    // Simple alert - replace with toast notification
    const toast = document.createElement('div');
    toast.className = 'real-time-toast';
    toast.innerHTML = `
      <i class="bi bi-check-circle-fill"></i>
      ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

    loadCompletionStats() {
    this.trekMgmtService.getCompletionStats().subscribe( (response: any) => {
        if (response.success) {
          this.completionStats = response.data;
          // Show notification if bookings need completion
          if (this.completionStats.needs_completion > 0) {
          }
        }
      },
   );
  }
}
