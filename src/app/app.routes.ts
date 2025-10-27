import { Routes } from '@angular/router';
import { LayoutComponent } from './service/common/layout/layout/layout.component';
import { DashboardPage } from './features/dashboard/pages/dashboard/dashboard.page';
import { AuthGuard } from './guards/auth.guard';
import { DashboardComponent } from './features/dashboard/components/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'v1',
    component: LayoutComponent, // includes the header
    children: [
      // {
      //   path: '',loadComponent: () =>
      //     import('./features/dashboard/dashboard.component').then(
      //       (m) => m.DashboardComponent
      //     ),
      // },
      {
        path: 'login',loadComponent: () =>
          import('./features/auth/login.component').then(
            (m) => m.LoginComponent),
      },
      {path: 'dashboard', component: DashboardPage,canActivate: [AuthGuard]},
      { path: '', redirectTo: '/v1/login', pathMatch: 'full' },
    ],
  },
];
