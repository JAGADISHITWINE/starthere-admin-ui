import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AnalyticsComponent } from './analytics.component';
const routes: Routes = [{ path: '', component: AnalyticsComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, AnalyticsComponent, RouterModule.forChild(routes)
  ]
})
export class AnalyticsModule { }
