import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./login/login-module').then((m) => m.LoginModule),
  },
  {
    path: 'admin/dashboard',
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
    path: 'admin/bookings',
    canActivate: [AuthGuard],
    loadChildren: () => import('./bookings/bookings-module').then((m) => m.BookingsModule),
  },
  {
    path: 'admin/users',
    canActivate: [AuthGuard],
    loadChildren: () => import('./users/users-module').then((m) => m.UsersModule),
  },
  {
    path: 'admin/reviews',
    canActivate: [AuthGuard],
    loadChildren: () => import('./reviews/reviews-module').then((m) => m.ReviewsModule),
  },
  {
    path: 'admin/settings',
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
    path: 'admin/revenue',
    canActivate: [AuthGuard],
    loadChildren: () => import('./analytics/analytics-module').then((m) => m.AnalyticsModule),
  },
  {
    path: 'admin/trek-details',
    canActivate: [AuthGuard],
    loadChildren: () => import('./tour-details/tour-details-module').then((m) => m.TourDetailsModule),
  },
  {
    path: 'admin/batch-management',
    canActivate: [AuthGuard],
    loadChildren: () => import('./trek-batch-management/trek-batch-management-module').then((m) => m.TrekBatchManagementModule),
  },
  {
    path: 'admin/notifications',
    canActivate: [AuthGuard],
    loadChildren: () => import('./notifications/notifications.module').then((m) => m.NotificationsModule),
  }
];
