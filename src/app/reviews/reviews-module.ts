import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReviewsComponent } from './reviews.component';
const routes: Routes = [{ path: '', component: ReviewsComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, ReviewsComponent, RouterModule.forChild(routes)
  ]
})
export class ReviewsModule { }
