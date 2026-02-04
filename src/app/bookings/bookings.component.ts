import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Bookings } from './bookings';

interface Booking {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  trekName: string;
  date: string;
  participants: number;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  bookingDate: string;
}

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class BookingsComponent implements OnInit {
  searchQuery = '';
  selectedStatus = 'all';
  bookings: any = [];
  startDate: string = '';
  endDate: string = '';
  constructor(private bookingService: Bookings) { }

  ngOnInit() {
    this.bookingService.getBookingData().subscribe((res: any) => {
      if (res.success == true) {
        this.bookings = res.data
      }
    });
  }

  statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];



  get filteredBookings(): Booking[] {
    let list = [...this.bookings];

    // Status filter
    if (this.selectedStatus !== 'all') {
      list = list.filter(b => b.status === this.selectedStatus);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(b =>
        b.customerName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.trekName.toLowerCase().includes(q)
      );
    }

    // Date range filter
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      list = list.filter(b => {
        const booking = new Date(b.bookingDate);
        return booking >= start && booking <= end;
      });
    }

    // Sort by latest booking first
    list.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

    return list;
  }

  // Status and payment badge colors
  getStatusColor(status: string) {
    return status === 'confirmed' ? 'success' : status === 'pending' ? 'warning' : 'danger';
  }

  getPaymentColor(status: string) {
    return status === 'paid' ? 'success' : 'warning';
  }
}
