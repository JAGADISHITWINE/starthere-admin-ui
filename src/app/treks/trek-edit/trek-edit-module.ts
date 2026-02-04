import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TrekEditComponent } from './trek-edit.component';
const routes: Routes = [{ path: ':id', component: TrekEditComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, TrekEditComponent, RouterModule.forChild(routes)
  ]
})
export class TrekEditModule { }
