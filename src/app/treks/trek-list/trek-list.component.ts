import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrekList } from './trek-list';


@Component({
  selector: 'app-trek-list',
  templateUrl: './trek-list.component.html',
  styleUrls: ['./trek-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class TrekListComponent implements OnInit {
  searchQuery: string = '';
  treks: any[] = [];
  activeCount = 0;
  draftCount = 0;

  constructor(private router: Router, private trekService: TrekList) { }

  ngOnInit() {
    this.loadTreks();
  }

  get filteredTreks(): any[] {
    if (!this.searchQuery.trim()) return this.treks;
    const query = this.searchQuery.toLowerCase();
    return this.treks.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.location.toLowerCase().includes(query)
    );
  }

  getTotalRevenue(trek: any): number {
    return (trek.activeBookings || 0) * trek.price;
  }

  get totalActiveBookings(): number {
    return this.treks?.reduce((sum, t) => sum + (t.activeBookings || 0), 0);
  }

  loadTreks() {
    this.trekService.getAllTreks().subscribe((res: any) => {
      this.treks = res.data || [];
      this.activeCount = this.treks.filter(t => t.status === 'active').length;
      this.draftCount = this.treks.filter(t => t.status === 'draft').length;
    });
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
    this.router.navigate(['/trekDetails', id]);
  }

  editTrek(id: number) {
    this.router.navigate(['/admin/treks/edit', id]);
  }
}

