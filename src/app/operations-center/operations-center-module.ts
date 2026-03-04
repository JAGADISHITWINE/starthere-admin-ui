import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { OperationsCenterComponent } from './operations-center.component';

const routes: Routes = [{ path: '', component: OperationsCenterComponent }];

@NgModule({
  declarations: [],
  imports: [CommonModule, OperationsCenterComponent, RouterModule.forChild(routes)],
})
export class OperationsCenterModule {}
