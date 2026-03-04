import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DropdownManagerComponent } from './dropdown-manager.component';

const routes: Routes = [{ path: '', component: DropdownManagerComponent }];

@NgModule({
  declarations: [],
  imports: [CommonModule, DropdownManagerComponent, RouterModule.forChild(routes)]
})
export class DropdownManagerModule {}
