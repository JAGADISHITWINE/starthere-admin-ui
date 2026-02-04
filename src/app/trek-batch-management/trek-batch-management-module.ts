import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { TrekBatchManagementComponent } from './trek-batch-management.component';

const routes: Routes = [{ path: '', component: TrekBatchManagementComponent }];

@NgModule({
  declarations: [],
  imports: [
   CommonModule, IonicModule, TrekBatchManagementComponent, RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class TrekBatchManagementModule { }
