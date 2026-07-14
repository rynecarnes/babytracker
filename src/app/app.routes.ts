import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from './core/services/supabase.service';
import { Router } from '@angular/router';

const authGuard = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  if (!supabase.user()) {
    router.navigate(['/auth']);
    return false;
  }
  return true;
};

const guestGuard = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  if (supabase.user()) {
    router.navigate(['/']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'feeding',
    loadComponent: () =>
      import('./features/feeding/active-feeding/active-feeding.component').then(
        (m) => m.ActiveFeedingComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then((m) => m.HistoryComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
