import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/summoner/summoner').then((m) => m.Summoner),
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./pages/summoner/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/summoner/profile/profile').then((m) => m.Profile),
  },
];
