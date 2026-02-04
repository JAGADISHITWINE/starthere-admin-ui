import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
const routes: Routes = [{ path: '', component: SettingsComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, SettingsComponent, RouterModule.forChild(routes)
  ]
})
export class SettingsModule { }
