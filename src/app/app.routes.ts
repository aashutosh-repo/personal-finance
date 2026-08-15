import { Routes } from '@angular/router';
import { LayoutComponent } from './service/common/layout/layout/layout.component';
import { AuthGuard } from './guards/auth.guard';
import { register } from 'module';

export const routes: Routes = [
  // PUBLIC ROUTES - No Layout (Login/Register only)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'v1/register',
    loadComponent: () => import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent),
  },

  // PROTECTED ROUTES - With Layout (Sidebar + Header + Footer)
  {
    path: 'v1',
    component: LayoutComponent,
    canActivate: [AuthGuard], // Protect entire layout from unauthenticated access
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/components/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      {
        path: 'profile',
        loadComponent: () =>import('./features/auth/user-profile.component').then((m) => m.UserProfileComponent) 
      },
      {
        path: 'budgets',
        loadComponent: () =>import('./features/transactions/budget-list.component').then((m) => m.BudgetListComponent)
      },
      {
        path: 'transactions',
        loadComponent: () =>import('./features/transactions/transaction-list.component').then((m) => m.TransactionListComponent),
      },
      {
        path: 'income',
        loadComponent: () =>import('./features/transactions/income-list.component').then((m) => m.IncomeListComponent)
      },
      {
        path: 'chatbot',
        loadComponent: () =>import('./features/dashboard/components/chatbot/chatbot.component').then((m) => m.ChatbotComponent)
      },
      {
        path: 'investments',
        loadComponent: () => import('./features/dashboard/pages/investments/investments.page').then(m => m.InvestmentsPage)
      },
      {
        path: 'debts',
        loadComponent: () => import('./features/dashboard/pages/debts/debts.page').then(m => m.DebtsPage)
      },
      {
        path: 'monthly-overview',
        loadComponent: () => import('./features/dashboard/pages/monthly-overview/monthly-overview.page').then(m => m.MonthlyOverviewPage)
      },
    ],
  },

  // Default redirect
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }, // Catch-all for unknown routes
];
