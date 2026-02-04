import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PostsListComponent } from './posts-list.component';
const routes: Routes = [{ path: '', component: PostsListComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, PostsListComponent, RouterModule.forChild(routes)
  ]
})
export class PostsListModule { }
