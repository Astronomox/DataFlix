import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LayoutComponent } from './components/layout/layout.component';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      { 
        path: 'ai-briefing',
        loadComponent: () => import('./components/ai-briefing/ai-briefing.component').then(m => m.AiBriefingComponent)
      },
      { 
        path: 'materials',
        loadComponent: () => import('./components/materials/materials.component').then(m => m.MaterialsComponent)
      },
      { 
        path: 'timetable',
        loadComponent: () => import('./components/timetable/timetable.component').then(m => m.TimetableComponent)
      },
      { 
        path: 'announcements',
        loadComponent: () => import('./components/announcements/announcements.component').then(m => m.AnnouncementsComponent)
      },
      { 
        path: 'profile',
        loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
      },
      { 
        path: 'contact',
        loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent)
      },
    ]
  },
  { path: '**', redirectTo: 'dashboard' } 
];