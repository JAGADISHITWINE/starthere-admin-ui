import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { Analytics } from './analytics';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink],
})
export class AnalyticsComponent implements OnInit {
  totalBookings: number = 0;
  totalRevenue: number = 0;
  averageBookingValue: number = 0;
  monthlyData: any = [];
  trekRevenue: any[] = [];
  monthlyGrowth: any = 0;
  selectedPeriod: string = 'monthly';

  constructor(private analyticService: Analytics) { }

  ngOnInit(): void {
    this.analyticService.getRevenueData().subscribe((res: any) => {
      if (res.success == true) {
        this.totalBookings = res.data.totalBooking;
        this.totalRevenue = res.data.totalRevenue;
        this.monthlyData = res.data.monthlyData;
        this.trekRevenue = res.data.trekRevenue;
        this.averageBookingValue = res.data.averageBookingValue;
        this.monthlyGrowth = res.data.monthlyGrowth
      }
    });
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
