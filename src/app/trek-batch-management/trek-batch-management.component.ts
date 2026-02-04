import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { TrekBatchManagement } from './trek-batch-management';

@Component({
  selector: 'app-trek-batch-management',
  templateUrl: './trek-batch-management.component.html',
  styleUrls: ['./trek-batch-management.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink]
})
export class TrekBatchManagementComponent implements OnInit {
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

  constructor(private trekMgmtService: TrekBatchManagement) {}

  ngOnInit() {
    this.loadTreks();
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
        console.error('Load treks error:', error);
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
}
