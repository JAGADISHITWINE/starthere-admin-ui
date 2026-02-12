import { TrekBatchManagementModule } from './trek-batch-management/trek-batch-management-module';
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./login/login-module').then((m) => m.LoginModule),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./dashboard/dashboard-module').then((m) => m.DashboardModule),
  },
  {
    path: 'admin/treks/list',
    canActivate: [AuthGuard],
    loadChildren: () => import('./treks/trek-list/trek-list-module').then((m) => m.TrekListModule),
  },
  {
    path: 'admin/treks/add',
    canActivate: [AuthGuard],
    loadChildren: () => import('./treks/trek-add/trek-add-module').then((m) => m.TrekAddModule),
  },
  {
    path: 'admin/treks/edit',
    canActivate: [AuthGuard],
    loadChildren: () => import('./treks/trek-edit/trek-edit-module').then((m) => m.TrekEditModule),
  },
  {
    path: 'bookings',
    canActivate: [AuthGuard],
    loadChildren: () => import('./bookings/bookings-module').then((m) => m.BookingsModule),
  },
  {
    path: 'users',
    canActivate: [AuthGuard],
    loadChildren: () => import('./users/users-module').then((m) => m.UsersModule),
  },
  {
    path: 'reviews',
    canActivate: [AuthGuard],
    loadChildren: () => import('./reviews/reviews-module').then((m) => m.ReviewsModule),
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadChildren: () => import('./settings/settings-module').then((m) => m.SettingsModule),
  },
  {
    path: 'admin/blog/posts',
    canActivate: [AuthGuard],
    loadChildren: () => import('./blog/posts-list/posts-list-module').then((m) => m.PostsListModule),
  },
  {
    path: 'admin/blog/editor',
    canActivate: [AuthGuard],
    loadChildren: () => import('./blog/post-editor/post-editor-module').then((m) => m.PostEditorModule),
  },
  {
    path: 'revenue',
    canActivate: [AuthGuard],
    loadChildren: () => import('./analytics/analytics-module').then((m) => m.AnalyticsModule),
  },
  {
    path: 'trekDetails',
    canActivate: [AuthGuard],
    loadChildren: () => import('./tour-details/tour-details-module').then((m) => m.TourDetailsModule),
  },
  {
    path: 'batchManagement',
    canActivate: [AuthGuard],
    loadChildren: () => import('./trek-batch-management/trek-batch-management-module').then((m) => m.TrekBatchManagementModule),
  }
];
