import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { DefaultRouteComponent } from './shared/components/default-route/default-route.component';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  // Public Authentication Routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Protected Banking Portal Routes (wrapped inside LayoutComponent shell)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DefaultRouteComponent, pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // Accounts
      { path: 'accounts', loadComponent: () => import('./features/accounts/accounts.component').then(m => m.AccountsComponent) },
      { path: 'accounts/:id', loadComponent: () => import('./features/accounts/accounts.component').then(m => m.AccountsComponent) },

      // Transfers
      { path: 'transfers', loadComponent: () => import('./features/transfers/transfers.component').then(m => m.TransfersComponent) },
      { path: 'transfers/history', loadComponent: () => import('./features/transfers/transfers.component').then(m => m.TransfersComponent) },

      // Beneficiaries
      { path: 'beneficiaries', loadComponent: () => import('./features/beneficiaries/beneficiaries.component').then(m => m.BeneficiariesComponent) },

      // Bills
      { path: 'bills', loadComponent: () => import('./features/bills/bills.component').then(m => m.BillsComponent) },
      { path: 'bills/history', loadComponent: () => import('./features/bills/bills.component').then(m => m.BillsComponent) },

      // Loans
      { path: 'loans', loadComponent: () => import('./features/loans/loans.component').then(m => m.LoansComponent) },
      { path: 'loans/apply', loadComponent: () => import('./features/loans/loans.component').then(m => m.LoansComponent) },
      { path: 'loans/:id', loadComponent: () => import('./features/loans/loans.component').then(m => m.LoansComponent) },

      // Investments
      { path: 'investments', loadComponent: () => import('./features/investments/investments.component').then(m => m.InvestmentsComponent) },
      { path: 'investments/portfolio', loadComponent: () => import('./features/investments/investments.component').then(m => m.InvestmentsComponent) },

      // Transactions
      { path: 'transactions', loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent) },

      // Notifications
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },

      // Profile & Security
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'security', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },

      // Admin Console
      {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'], tab: 'USERS' }
      },
      {
        path: 'admin/accounts',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'], tab: 'ACCOUNTS' }
      },
      {
        path: 'admin/loans',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'], tab: 'USERS' }
      },
      {
        path: 'admin/billers',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'], tab: 'BILLERS' }
      },
      {
        path: 'admin/audit-logs',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'], tab: 'AUDIT' }
      },
      {
        path: 'admin/transactions',
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'], tab: 'TRANSACTIONS' }
      }
    ]
  },

  // Fallback Route
  { path: '**', redirectTo: 'dashboard' }
];
