import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { TourDetailsComponent } from './tour-details.component';
const routes: Routes = [{ path: ':id', component: TourDetailsComponent }];

@NgModule({
  declarations: [],
  imports: [
   CommonModule, IonicModule, TourDetailsComponent, RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class TourDetailsModule { }
