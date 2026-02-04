import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { BookingsComponent } from './bookings.component';
const routes: Routes = [{ path: '', component: BookingsComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, BookingsComponent, RouterModule.forChild(routes)
  ]
})
export class BookingsModule { }
