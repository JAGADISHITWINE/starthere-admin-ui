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

  constructor(private trekMgmtService: TrekBatchManagement, private wsService: WebSocketService) { }

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
        if (response.success == true) {
          this.treks = response.data;
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
        if (response.success == true) {
          this.batches = response.data;
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
        if (response.success == true) {
          this.bookings = response.data.map((booking: any) => ({
            ...booking,
            expanded: false // Initialize expanded state
          }));
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
   * Toggle booking row expansion to show/hide participant details
   */
  toggleBookingExpand(booking: any) {
    booking.expanded = !booking.expanded;
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
        if (response.success == true) {
          alert('Booking stopped successfully!');
          batch.status = 'inactive';
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
        if (response.success == true) {
          alert('Booking resumed successfully!');
          batch.status = 'active';
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
    this.trekMgmtService.downloadAllTrekBookings(trek.id).subscribe({
      next: (blob:any) => {
        const fileName = `${trek.name}_All_Bookings.xlsx`;
        this.trekMgmtService.triggerDownload(blob, fileName);
        alert('Download started!');
      },
      error: (error:any) => {
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
      case 'completed':
        return 'badge-info';
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
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    this.wsService.disconnect();
  }

  handleRealTimeUpdate(update: any) {
    if (update.type === 'completed') {
      this.showNotification(`Booking ${update.data.bookingReference} completed!`);

      if (this.showBookingsModal && this.selectedBatch) {
        this.viewBookings(this.selectedBatch);
      } else if (this.showBatchesModal && this.selectedTrek) {
        this.viewBatches(this.selectedTrek);
      } else {
        this.loadTreks();
      }

      this.loadCompletionStats();
    } else if (update.type === 'created') {
      this.showNotification(`New booking: ${update.data.bookingReference} by ${update.data.customerName}`);

      if (this.showBookingsModal && this.selectedBatch) {
        this.viewBookings(this.selectedBatch);
      } else if (this.showBatchesModal && this.selectedTrek) {
        this.viewBatches(this.selectedTrek);
      } else {
        this.loadTreks();
      }

      this.loadCompletionStats();
    }
  }

  showNotification(message: string) {
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
    this.trekMgmtService.getCompletionStats().subscribe((response: any) => {
      if (response.success) {
        this.completionStats = response.data;
      }
    });
  }

  /**
   * Check if batch has ended
   */
  isBatchEnded(batch: any): boolean {
    if (!batch || !batch.end_date) {
      return false;
    }
    
    const endDate = new Date(batch.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return endDate < today;
  }

  /**
   * Mark batch as completed
   */
  markBatchCompleted(batch: any) {
    if (!confirm(
      `Mark this batch as COMPLETED?\n\n` +
      `Trek: ${this.selectedTrek.name}\n` +
      `Date: ${new Date(batch.start_date).toLocaleDateString()} - ${new Date(batch.end_date).toLocaleDateString()}\n` +
      `Total Bookings: ${batch.total_bookings}\n\n` +
      `This will:\n` +
      `- Mark the batch as completed\n` +
      `- Update all confirmed bookings to completed status\n\n` +
      `Continue?`
    )) {
      return;
    }

    this.trekMgmtService.markBatchCompleted(batch.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert(
            `Batch marked as completed!\n\n` +
            `Updated bookings: ${response.updated_bookings || 0}`
          );

          batch.status = 'completed';
          this.viewBatches(this.selectedTrek);
          this.loadCompletionStats();
        }
      },
      error: (error) => {
        console.error('Mark completed error:', error);
        alert('Failed to mark batch as completed');
      }
    });
  }
}