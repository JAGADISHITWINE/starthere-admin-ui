import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { catchError, forkJoin, of } from 'rxjs';
import { Analytics } from '../analytics/analytics';
import { Bookings } from '../bookings/bookings';
import { Dashboard } from '../dashboard/dashboard';
import { NotificationsService } from '../notifications/notifications.service';
import { Reviews } from '../reviews/reviews';
import { AdminShellComponent } from '../shared/admin-shell/admin-shell.component';
import { TrekBatchManagement } from '../trek-batch-management/trek-batch-management';
import { TrekList } from '../treks/trek-list/trek-list';
import { Users } from '../users/users';
import { AuthService } from '../core/services/auth.service';
import { RbacService, RbacTableRow, CreateAdminPayload } from '../core/services/rbac.service';

interface PermissionRow extends RbacTableRow {}

interface ExportReport {
  name: string;
  format: 'CSV' | 'XLSX' | 'PDF';
  lastGenerated: string;
}

interface ApiCheck {
  name: string;
  ok: boolean;
}

@Component({
  selector: 'app-operations-center',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AdminShellComponent],
  templateUrl: './operations-center.component.html',
  styleUrls: ['./operations-center.component.scss'],
})
export class OperationsCenterComponent implements OnInit {
  loading = false;
  errorMessage = '';
  lastSyncedAt = '';
  apiChecks: ApiCheck[] = [];

  totalRevenue = 0;
  totalBookings = 0;
  totalUsers = 0;
  openTicketCount = 0;

  canEditPermissions = false;
  isSavingPermissions = false;

  createAdminLoading = false;
  createAdminMessage = '';
  createAdminError = '';
  showCreateAdminPassword = false;
  newAdminForm: CreateAdminPayload = {
    name: '',
    email: '',
    password: '',
    roleKey: '',
  };

  permissions: PermissionRow[] = [];

  trekInventory: any[] = [];
  batchLifecycle: any[] = [];
  guideVendors: any[] = [];
  supportTickets: any[] = [];
  paymentOps: any[] = [];
  complianceDocs: any[] = [];
  logistics: any[] = [];
  reviewQueue: any[] = [];
  notificationTemplates: any[] = [];

  reports: ExportReport[] = [
    { name: 'Revenue by Trek', format: 'XLSX', lastGenerated: 'Pending live data' },
    { name: 'Occupancy by Batch', format: 'CSV', lastGenerated: 'Pending live data' },
    { name: 'Refund Register', format: 'PDF', lastGenerated: 'Pending live data' },
  ];

  auditLogs: any[] = [];

  constructor(
    private dashboardService: Dashboard,
    private bookingService: Bookings,
    private trekService: TrekList,
    private userService: Users,
    private reviewService: Reviews,
    private batchService: TrekBatchManagement,
    private notificationService: NotificationsService,
    private analyticsService: Analytics,
    private authService: AuthService,
    private rbacService: RbacService
  ) {}

  ngOnInit(): void {
    this.canEditPermissions = this.authService.hasPermission('rbac.manage');
    this.loadRbacTable();
    this.loadOperationsData();
  }

  loadRbacTable(): void {
    this.rbacService.getTable().subscribe({
      next: (res) => {
        this.permissions = Array.isArray(res?.data) ? res.data : [];
        if (!this.newAdminForm.roleKey && this.permissions.length > 0) {
          this.newAdminForm.roleKey = this.permissions[0].roleKey;
        }
      },
      error: () => {
        this.permissions = [];
      },
    });
  }

  savePermissions(): void {
    if (!this.canEditPermissions || this.isSavingPermissions) return;

    this.isSavingPermissions = true;
    this.rbacService.updateTable(this.permissions).subscribe({
      next: (res) => {
        this.permissions = Array.isArray(res?.data) ? res.data : this.permissions;
        this.isSavingPermissions = false;
      },
      error: () => {
        this.isSavingPermissions = false;
      },
    });
  }

  createAdminUser(): void {
    if (!this.canEditPermissions || this.createAdminLoading) return;

    const payload: CreateAdminPayload = {
      name: String(this.newAdminForm.name || '').trim(),
      email: String(this.newAdminForm.email || '').trim(),
      password: String(this.newAdminForm.password || ''),
      roleKey: String(this.newAdminForm.roleKey || '').trim(),
    };

    if (!payload.name || !payload.email || !payload.password || !payload.roleKey) {
      this.createAdminError = 'All fields are required.';
      this.createAdminMessage = '';
      return;
    }

    this.createAdminLoading = true;
    this.createAdminError = '';
    this.createAdminMessage = '';

    this.rbacService.createAdmin(payload).subscribe({
      next: (res) => {
        this.createAdminLoading = false;
        this.createAdminMessage = res?.message || 'Admin created successfully.';
        this.newAdminForm = {
          name: '',
          email: '',
          password: '',
          roleKey: this.newAdminForm.roleKey,
        };
      },
      error: (err) => {
        this.createAdminLoading = false;
        this.createAdminError = err?.error?.message || 'Failed to create admin.';
      },
    });
  }

  loadOperationsData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      dash: this.dashboardService.getDashData().pipe(catchError(() => of(null))),
      bookings: this.bookingService.getBookingData().pipe(catchError(() => of(null))),
      treks: this.trekService.getAllTreks().pipe(catchError(() => of(null))),
      users: this.userService.getAllUsers().pipe(catchError(() => of(null))),
      reviews: this.reviewService.getAllReviews().pipe(catchError(() => of(null))),
      batchTreks: this.batchService.getTreks().pipe(catchError(() => of(null))),
      completion: this.batchService.getCompletionStats().pipe(catchError(() => of(null))),
      notifications: this.notificationService.getNotifications().pipe(catchError(() => of(null))),
      analytics: this.analyticsService.getRevenueData().pipe(catchError(() => of(null))),
    }).subscribe(({ dash, bookings, treks, users, reviews, batchTreks, completion, notifications, analytics }) => {
      this.apiChecks = [
        { name: 'Dashboard', ok: !!dash },
        { name: 'Bookings', ok: !!bookings },
        { name: 'Treks', ok: !!treks },
        { name: 'Users', ok: !!users },
        { name: 'Reviews', ok: !!reviews },
        { name: 'Batch Ops', ok: !!batchTreks },
        { name: 'Notifications', ok: !!notifications },
        { name: 'Analytics', ok: !!analytics },
      ];

      const anyConnected = this.apiChecks.some((c) => c.ok);
      if (!anyConnected) {
        this.errorMessage = 'Backend is unreachable from this app environment. Check API server and CORS/network settings.';
      }

      const dashData = dash?.data || {};
      const bookingRows = Array.isArray(bookings?.data) ? bookings.data : [];
      const trekRows = Array.isArray(treks?.data?.result)
        ? treks.data.result
        : Array.isArray(treks?.data)
          ? treks.data
          : [];
      const userRows = Array.isArray(users?.data) ? users.data : [];
      const reviewRows = Array.isArray(reviews) ? reviews : [];
      const batchRows = Array.isArray(batchTreks?.data) ? batchTreks.data : [];
      const completionAny: any = completion;
      const completionData = completionAny?.data || completionAny || {};
      const notificationRows = Array.isArray(notifications?.results)
        ? notifications.results
        : Array.isArray(notifications?.data)
          ? notifications.data
          : [];
      const analyticsData = analytics?.data || {};

      this.totalBookings = Number(dashData.totalbookingCount || bookingRows.length || 0);
      this.totalRevenue = Number(dashData.totalRevenue || analyticsData.totalRevenue || 0);
      this.totalUsers = Number(dashData.totalUsers || userRows.length || 0);

      this.trekInventory = trekRows.slice(0, 6).map((t: any) => ({
        trek: t.name || t.trek_name || 'Trek',
        seats: t.availableSeats ?? t.seats_available ?? t.total_seats ?? 0,
        waitlist: t.waitlistCount ?? 0,
        basePrice: t.price ?? (t.batches?.[0]?.price || 0),
        seasonMultiplier: 1,
        status: t.status || 'Unknown',
      }));

      this.batchLifecycle = batchRows.slice(0, 6).map((b: any) => ({
        code: b.name || b.code || `TRK-${b.id ?? '-'}`,
        phase: b.status || 'Unknown',
        cutoff: b.cutoffDate || b.start_date || '-',
        action: 'Manage in Batch Module',
      }));

      this.paymentOps = bookingRows.slice(0, 6).map((b: any) => ({
        bookingId: b.bookingReference || `BK-${b.id}`,
        amount: Number(b.amount || 0),
        mode: b.paymentMode || 'N/A',
        status: b.paymentStatus || 'pending',
        reconcile: b.paymentStatus === 'paid' ? 'Matched' : 'Review',
      }));

      this.supportTickets = bookingRows
        .filter((b: any) => (b.status || '').toLowerCase() === 'pending' || (b.paymentStatus || '').toLowerCase() === 'pending')
        .slice(0, 6)
        .map((b: any) => ({
          customer: b.customerName || 'Customer',
          issue: 'Pending booking/payment follow-up',
          priority: 'Medium',
          status: 'Open',
        }));

      this.openTicketCount = this.supportTickets.length;

      this.complianceDocs = bookingRows.slice(0, 6).map((b: any) => ({
        bookingId: b.bookingReference || `BK-${b.id}`,
        waiver: !!b.waiverSigned,
        idProof: !!b.idProofUploaded,
        medical: !!b.medicalDeclaration,
      }));

      this.reviewQueue = reviewRows.slice(0, 6).map((r: any) => ({
        author: r.author_name || r.customerName || 'Guest',
        trek: r.trek_name || r.trekName || 'Trek',
        sentiment: Number(r.likes || 0) >= 3 ? 'Positive' : 'Mixed',
        state: 'Pending',
      }));

      this.notificationTemplates = notificationRows.slice(0, 6).map((n: any) => ({
        channel: n.type || 'system',
        template: n.title || 'Notification',
        deliveryRate: n.read ? 'Delivered' : 'Pending',
      }));

      this.auditLogs = [
        { when: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'system', action: 'Operations Center sync completed' },
        { when: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'analytics', action: `Revenue loaded: ₹${this.totalRevenue}` },
      ];

      this.guideVendors = [
        {
          name: 'Backend-ready placeholder',
          type: 'Guide/Vendor endpoint pending',
          assignment: 'Connect dedicated endpoint when available',
          score: 0,
          payoutDue: 0,
        },
      ];

      this.logistics = [
        {
          route: 'Backend-ready placeholder',
          pickupPoints: 0,
          vehicle: 'Connect transport endpoint',
          manifest: 'Pending integration',
        },
      ];

      if (completionData) {
        this.auditLogs.push({
          when: new Date().toISOString().slice(0, 16).replace('T', ' '),
          actor: 'batch-ops',
          action: `Completion stats synced (${JSON.stringify(completionData).slice(0, 48)}...)`,
        });
      }

      this.lastSyncedAt = new Date().toLocaleString();
      this.loading = false;
    });
  }

  get complianceCompletion(): number {
    const total = this.complianceDocs.length * 3;
    if (!total) {
      return 0;
    }
    const done = this.complianceDocs.reduce((acc, row) => {
      return acc + Number(row.waiver) + Number(row.idProof) + Number(row.medical);
    }, 0);
    return Math.round((done / total) * 100);
  }

  get failedPayments(): number {
    return this.paymentOps.filter((row) => String(row.status).toLowerCase() === 'failed').length;
  }

  exportReport(report: ExportReport): void {
    console.log(`Exporting ${report.name} as ${report.format}`);
  }
}
