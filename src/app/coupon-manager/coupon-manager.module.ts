import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CouponManagerComponent } from './coupon-manager.component';

const routes: Routes = [{ path: '', component: CouponManagerComponent }];

@NgModule({
  declarations: [],
  imports: [CommonModule, CouponManagerComponent, RouterModule.forChild(routes)]
})
export class CouponManagerModule {}
