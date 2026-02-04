import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TrekAddComponent } from './trek-add.component';
const routes: Routes = [{ path: '', component: TrekAddComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, TrekAddComponent, RouterModule.forChild(routes)
  ]
})
export class TrekAddModule { }
