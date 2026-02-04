import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TrekListComponent } from './trek-list.component';
const routes: Routes = [{ path: '', component: TrekListComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, TrekListComponent, RouterModule.forChild(routes)
  ]
})
export class TrekListModule { }
