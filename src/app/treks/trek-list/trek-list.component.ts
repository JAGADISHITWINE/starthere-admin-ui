import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrekList } from './trek-list';
import { AdminShellComponent } from 'src/app/shared/admin-shell/admin-shell.component';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-trek-list',
  templateUrl: './trek-list.component.html',
  styleUrls: ['./trek-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AdminShellComponent],
})
export class TrekListComponent implements OnInit {
  readonly mediaBaseUrl = (environment.mediaBaseUrl || '').replace(/\/?$/, '/');
  searchQuery: string = '';
  treks: any[] = [];
  activeCount = 0;

  constructor(private router: Router, private trekService: TrekList) { }

  ngOnInit() {
    this.loadTreks(true);
  }

  get filteredTreks(): any[] {
    if (!this.searchQuery.trim()) return this.treks;
    const query = this.searchQuery.toLowerCase();

    return this.treks.filter((t) => {
      const haystack = [
        t?.name,
        t?.location,
        t?.category,
        t?.collection,
        t?.difficulty,
        t?.fitness_level,
      ]
        .filter(Boolean)
        .map((value: any) => String(value).toLowerCase())
        .join(' ');

      return haystack.includes(query);
    });
  }


  get visibleTreks(): any[] {
    return this.filteredTreks.filter((trek) => this.getVisibleBatches(trek).length > 0);
  }

  getTotalRevenue(trek: any): number {
    return (trek.activeBookings || 0) * trek.price;
  }

  get totalActiveBookings(): number {
    return this.treks?.reduce((sum, t) => sum + (t.activeBookings || 0), 0);
  }

  loadTreks(forceRefresh: boolean = false) {
    this.trekService.getAllTreks(forceRefresh).subscribe((res: any) => {
      this.treks = res.data.result || [];
      this.activeCount = res.data.activeTrekCount;
    });
  }

  getVisibleBatches(trek: any): any[] {
    const rows = Array.isArray(trek?.batches) ? trek.batches : [];
    if (rows.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rows.filter((batch: any) => {
      const status = String(batch?.status || batch?.batchStatus || '').toLowerCase();
      if (status !== 'active' && status !== 'inactive') return false;

      const start = batch?.startDate ? new Date(batch.startDate) : null;
      if (!start || Number.isNaN(start.getTime())) return true;

      start.setHours(0, 0, 0, 0);
      return start >= today;
    });
  }

  getBatchStatusCount(trek: any, targetStatus: 'active' | 'inactive'): number {
    const rows = this.getVisibleBatches(trek);
    return rows.filter((batch: any) => {
      const status = String(batch?.status || batch?.batchStatus || '').toLowerCase();
      return status === targetStatus;
    }).length;
  }

  getBatchStatusLabel(batch: any): string {
    return String(batch?.status || batch?.batchStatus || '').toLowerCase() || 'inactive';
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'inactive': return 'medium';
      default: return 'primary';
    }
  }

  viewTrek(id: any) {
    this.router.navigate(['/admin/trek-details', id]);
  }

  editTrek(id: number) {
    if (!Number.isFinite(Number(id)) || Number(id) <= 0) return;
    this.router.navigate([`/admin/treks/edit/${id}`]);
  }
}
