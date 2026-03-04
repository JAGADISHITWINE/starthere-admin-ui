import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Analytics } from './analytics';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AdminShellComponent } from '../shared/admin-shell/admin-shell.component';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, AdminShellComponent],
})
export class AnalyticsComponent implements OnInit {
  totalBookings: number = 0;
  totalRevenue: number = 0;
  averageBookingValue: number = 0;
  monthlyData: any = [];
  trekRevenue: any[] = [];
  monthlyGrowth: any = 0;
  monthlyGrowthLabel = 'N/A';
  selectedPeriod: string = 'monthly';

  constructor(private analyticService: Analytics) { }

  ngOnInit(): void {
    this.analyticService.getRevenueData().subscribe((res: any) => {
      const data = this.extractAnalyticsData(res);
      this.monthlyData = Array.isArray(data.monthlyData) ? data.monthlyData : [];
      this.trekRevenue = Array.isArray(data.trekRevenue) ? data.trekRevenue : [];

      this.totalBookings = Number(
        data.totalBooking ??
        data.totalBookings ??
        data.total_bookings ??
        0
      );

      this.totalRevenue = Number(
        data.totalRevenue ??
        data.total_revenue ??
        this.monthlyData.reduce((sum: number, row: any) => sum + Number(row?.amount || row?.revenue || 0), 0) ??
        0
      );

      this.averageBookingValue = Number(
        data.averageBookingValue ??
        data.avgBookingValue ??
        data.average_booking_value ??
        (this.totalBookings > 0 ? this.totalRevenue / this.totalBookings : 0)
      );

      this.monthlyGrowth = data.monthlyGrowth ?? data.growth ?? 0;
      this.monthlyGrowthLabel = this.toGrowthLabel(this.monthlyGrowth, this.monthlyData);
    });
  }

  private toGrowthLabel(rawGrowth: any, monthlyData: any[]): string {
    if (!Array.isArray(monthlyData) || monthlyData.length < 2) {
      return 'N/A';
    }

    const value = String(rawGrowth ?? '').trim();
    if (!value || value === '0%' || value === '0.0%') {
      return 'N/A';
    }

    return value;
  }

  private extractAnalyticsData(res: any): any {
    if (res?.data?.data && typeof res.data.data === 'object') return res.data.data;
    if (res?.data && typeof res.data === 'object') return res.data;
    if (res?.results && typeof res.results === 'object') return res.results;
    return {};
  }

  exportReport() {
    // 1️⃣ Convert JSON → Worksheet
    const monthlySheet: XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(this.monthlyData);

    const trekSheet: XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(this.trekRevenue);

    // 2️⃣ Create Workbook
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Monthly Revenue': monthlySheet,
        'Trek Revenue': trekSheet
      },
      SheetNames: ['Monthly Revenue', 'Trek Revenue']
    };

    // 3️⃣ Generate Excel Buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    // 4️⃣ Save File
    const blob = new Blob(
      [excelBuffer],
      { type: 'application/octet-stream' }
    );

    saveAs(blob, `Revenue_Report_${new Date().getFullYear()}.xlsx`);
  }

}
