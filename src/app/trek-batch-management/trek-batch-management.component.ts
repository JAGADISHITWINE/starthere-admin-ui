import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { TrekBatchManagement } from './trek-batch-management';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { AdminShellComponent } from '../shared/admin-shell/admin-shell.component';

@Component({
  selector: 'app-trek-batch-management',
  templateUrl: './trek-batch-management.component.html',
  styleUrls: ['./trek-batch-management.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, AdminShellComponent]
})
export class TrekBatchManagementComponent implements OnInit, OnDestroy {

  private autoCompleting = false;

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
  batchActionLoadingId: number | null = null;

  constructor(private trekMgmtService: TrekBatchManagement) { }

  ngOnInit() {
    this.loadTreks();
    this.loadCompletionStats();
  }

  /**
   * Load all treks
   */
  loadTreks() {
    this.isLoadingTreks = true;

    this.trekMgmtService.getTreks().subscribe({
      next: (response) => {
        if (response.success == true) {
          const rows = Array.isArray(response.data) ? response.data : [];
          this.treks = rows.filter((trek: any) => this.shouldShowTrek(trek));
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
          const rows = Array.isArray(response.data) ? response.data : [];
          this.batches = rows.filter((batch: any) => {
            const status = String(batch?.status || '').toLowerCase();
            return status === 'active' || status === 'inactive';
          });
          this.autoCompleteEndedBatches();
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
        console.log('Raw bookings response:', response);
        const rows = this.extractBookingRows(response);
        this.bookings = rows.map((booking: any) => this.normalizeBookingRow(booking));
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
    if (this.batchActionLoadingId === Number(batch?.id)) return;

    if (!confirm('Are you sure you want to stop bookings for this batch?\n\nTrek: ' + this.selectedTrek.name + '\nDate: ' + new Date(batch.start_date).toLocaleDateString())) {
      return;
    }

    this.batchActionLoadingId = Number(batch.id);

    this.trekMgmtService.stopBooking(batch.id).pipe(
      finalize(() => {
        this.batchActionLoadingId = null;
      })
    ).subscribe({
      next: (response) => {
        if (response?.success === true) {
          alert('Booking stopped successfully!');
          const nextStatus = String(response?.batch?.status || 'inactive').toLowerCase();
          batch.status = nextStatus;
          this.batches = [...this.batches];
          this.loadTreks();
          return;
        }
        alert(response?.message || 'Failed to stop booking');
      },
      error: (error) => {
        console.error('Stop booking error:', error);
        alert(error?.error?.message || 'Failed to stop booking');
      }
    });
  }

  /**
   * Resume booking for a batch
   */
  resumeBooking(batch: any) {
    if (this.batchActionLoadingId === Number(batch?.id)) return;

    if (!confirm('Resume bookings for this batch?\n\nTrek: ' + this.selectedTrek.name + '\nDate: ' + new Date(batch.start_date).toLocaleDateString())) {
      return;
    }

    this.batchActionLoadingId = Number(batch.id);

    this.trekMgmtService.resumeBooking(batch.id).pipe(
      finalize(() => {
        this.batchActionLoadingId = null;
      })
    ).subscribe({
      next: (response) => {
        if (response?.success === true) {
          alert('Booking resumed successfully!');
          const nextStatus = String(response?.batch?.status || 'active').toLowerCase();
          batch.status = nextStatus;
          this.batches = [...this.batches];
          this.loadTreks();
          return;
        }
        alert(response?.message || 'Failed to resume booking');
      },
      error: (error) => {
        console.error('Resume booking error:', error);
        alert(error?.error?.message || 'Failed to resume booking');
      }
    });
  }

  isBatchActionLoading(batch: any): boolean {
    return this.batchActionLoadingId === Number(batch?.id);
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

  private autoCompleteEndedBatches(): void {
    if (this.autoCompleting || !Array.isArray(this.batches) || this.batches.length === 0) {
      return;
    }

    const endedBatches = this.batches.filter(
      (batch) => this.isBatchEnded(batch) && this.isAutoCompletableStatus(batch.status)
    );

    if (endedBatches.length === 0) {
      return;
    }

    this.autoCompleting = true;
    const requests = endedBatches.map((batch) =>
      this.trekMgmtService.markBatchCompleted(batch.id).pipe(catchError(() => of(null)))
    );

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        let hasChanges = false;
        responses.forEach((res, idx) => {
          if (res?.success) {
            endedBatches[idx].status = 'completed';
            hasChanges = true;
          }
        });
        if (hasChanges) {
          this.loadCompletionStats();
        }
      },
      complete: () => {
        this.autoCompleting = false;
      }
    });
  }

  private isAutoCompletableStatus(status: string): boolean {
    const current = String(status || '').toLowerCase();
    return current === 'active' || current === 'inactive' || current === 'full';
  }

  private shouldShowTrek(trek: any): boolean {
    const totalBatches = Number(trek?.total_batches || 0);
    return totalBatches > 0;
  }

  private extractBookingRows(response: any): any[] {
    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.bookings)) return data.bookings;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.bookings)) return response.bookings;
    return [];
  }

  private normalizeBookingRow(booking: any): any {
    const totalParticipants = Number(
      booking?.total_participants ??
      booking?.participants_count ??
      booking?.participants ??
      0
    );
    const participants = this.normalizeParticipants(booking);

    return {
      ...booking,
      booking_id: booking?.booking_id || booking?.booking_reference || booking?.bookingReference || `BK-${booking?.id ?? '-'}`,
      name: booking?.name || booking?.customer_name || booking?.customerName || '-',
      email: booking?.email || booking?.customer_email || booking?.customerEmail || '-',
      phone: booking?.phone || booking?.customer_phone || booking?.customerPhone || '-',
      total_participants: totalParticipants,
      total_amount: Number(booking?.total_amount ?? booking?.amount ?? booking?.subtotal ?? 0),
      payment_status: booking?.payment_status || booking?.paymentStatus || 'pending',
      participants,
      expanded: false,
    };
  }

  private normalizeParticipants(booking: any): any[] {
    const sources = [
      booking?.participants,
      booking?.participant_details,
      booking?.participant_data,
      booking?.participants_data,
      booking?.booking_participants,
      booking?.participants_json,
      booking?.participant_list,
    ];

    const parsedRows: any[] = [];
    sources.forEach((source) => {
      const rows = this.parseParticipantsSource(source);
      rows.forEach((row) => {
        parsedRows.push({
          name: row?.name || row?.full_name || row?.participant_name || '-',
          age: row?.age ?? '-',
          gender: row?.gender || '-',
          phone: row?.phone || row?.phone_number || '-',
          idType: row?.id_type || row?.idType || '-',
          idNumber: row?.id_number || row?.idNumber || '-',
          medicalInfo: row?.medical_info || row?.medicalInfo || '-',
          isPrimary: !!(row?.is_primary_contact ?? row?.isPrimary),
        });
      });
    });

    if (parsedRows.length > 0) {
      return parsedRows;
    }

    // Fallback to primary contact details when participant rows are missing.
    const fallbackName = booking?.name || booking?.customer_name || booking?.customerName;
    if (fallbackName) {
      return [{
        name: fallbackName,
        age: booking?.age ?? '-',
        gender: booking?.gender || '-',
        phone: booking?.phone || booking?.customer_phone || booking?.customerPhone || '-',
        idType: booking?.id_type || '-',
        idNumber: booking?.id_number || '-',
        medicalInfo: booking?.medical_info || '-',
        isPrimary: true,
      }];
    }

    return [];
  }

  private parseParticipantsSource(source: any): any[] {
    if (Array.isArray(source)) {
      return source;
    }
    if (typeof source === 'string') {
      try {
        const parsed = JSON.parse(source);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}
