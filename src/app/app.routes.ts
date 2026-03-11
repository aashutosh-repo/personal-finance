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
      {
        path: 'register',loadComponent: () =>
          import('./features/auth/register.component').then(
            (m) => m.RegisterComponent),
      },
      {path: 'dashboard', component: DashboardPage, canActivate: [AuthGuard]},
      {
        path: 'profile', 
        loadComponent: () =>
          import('./features/auth/user-profile.component').then(
            (m) => m.UserProfileComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/transactions/budget-list.component').then(
            (m) => m.BudgetListComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transaction-list.component').then(
            (m) => m.TransactionListComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'income',
        loadComponent: () =>
          import('./features/transactions/income-list.component').then(
            (m) => m.IncomeListComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'chatbot',
        loadComponent: () =>
          import('./features/dashboard/chatbot.component').then(
            (m) => m.ChatbotComponent),
        canActivate: [AuthGuard]
      },
      { path: '', redirectTo: '/v1/login', pathMatch: 'full' },
    ],
  },
];
