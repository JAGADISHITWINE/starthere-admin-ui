import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PostEditorComponent } from './post-editor.component';
const routes: Routes = [
  {
    path: '',  // For creating new posts: /admin/blog/editor
    component: PostEditorComponent
  },
  {
    path: ':id',  // For editing posts: /admin/blog/editor/123
    component: PostEditorComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, PostEditorComponent, RouterModule.forChild(routes)
  ]
})
export class PostEditorModule { }
