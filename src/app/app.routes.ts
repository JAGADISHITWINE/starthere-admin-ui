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
    data: { permission: 'dashboard.view' },
    loadChildren: () => import('./dashboard/dashboard-module').then((m) => m.DashboardModule),
  },
  {
    path: 'admin/treks/list',
    canActivate: [AuthGuard],
    data: { permission: 'treks.view' },
    loadChildren: () => import('./treks/trek-list/trek-list-module').then((m) => m.TrekListModule),
  },
  {
    path: 'admin/treks/add',
    canActivate: [AuthGuard],
    data: { permission: 'treks.manage' },
    loadChildren: () => import('./treks/trek-add/trek-add-module').then((m) => m.TrekAddModule),
  },
  {
    path: 'admin/treks/edit',
    canActivate: [AuthGuard],
    data: { permission: 'treks.manage' },
    loadChildren: () => import('./treks/trek-edit/trek-edit-module').then((m) => m.TrekEditModule),
  },
  {
    path: 'admin/bookings',
    canActivate: [AuthGuard],
    data: { permission: 'bookings.view' },
    loadChildren: () => import('./bookings/bookings-module').then((m) => m.BookingsModule),
  },
  {
    path: 'admin/users',
    canActivate: [AuthGuard],
    data: { permission: 'users.view' },
    loadChildren: () => import('./users/users-module').then((m) => m.UsersModule),
  },
  {
    path: 'admin/reviews',
    canActivate: [AuthGuard],
    data: { permission: 'reviews.view' },
    loadChildren: () => import('./reviews/reviews-module').then((m) => m.ReviewsModule),
  },
  {
    path: 'admin/blog/posts',
    canActivate: [AuthGuard],
    data: { permission: 'blog.view' },
    loadChildren: () => import('./blog/posts-list/posts-list-module').then((m) => m.PostsListModule),
  },
  {
    path: 'admin/blog/editor',
    canActivate: [AuthGuard],
    data: { permission: 'blog.manage' },
    loadChildren: () => import('./blog/post-editor/post-editor-module').then((m) => m.PostEditorModule),
  },
  {
    path: 'admin/revenue',
    canActivate: [AuthGuard],
    data: { permission: 'finance.view' },
    loadChildren: () => import('./analytics/analytics-module').then((m) => m.AnalyticsModule),
  },
  {
    path: 'admin/trek-details',
    canActivate: [AuthGuard],
    data: { permission: 'treks.view' },
    loadChildren: () => import('./tour-details/tour-details-module').then((m) => m.TourDetailsModule),
  },
  {
    path: 'admin/batch-management',
    canActivate: [AuthGuard],
    data: { permission: 'bookings.manage' },
    loadChildren: () => import('./trek-batch-management/trek-batch-management-module').then((m) => m.TrekBatchManagementModule),
  },
  {
    path: 'admin/operations',
    canActivate: [AuthGuard],
    data: { permission: 'operations.view' },
    loadChildren: () => import('./operations-center/operations-center-module').then((m) => m.OperationsCenterModule),
  },
  {
    path: 'admin/notifications',
    canActivate: [AuthGuard],
    data: { permission: 'notifications.view' },
    loadChildren: () => import('./notifications/notifications.module').then((m) => m.NotificationsModule),
  },
  {
    path: 'admin/dropdowns',
    canActivate: [AuthGuard],
    data: { permission: 'dropdowns.manage' },
    loadChildren: () => import('./dropdown-manager/dropdown-manager.module').then((m) => m.DropdownManagerModule),
  },
  {
    path: 'admin/coupons',
    canActivate: [AuthGuard],
    data: { permission: 'treks.manage' },
    loadChildren: () => import('./coupon-manager/coupon-manager.module').then((m) => m.CouponManagerModule),
  }
];
