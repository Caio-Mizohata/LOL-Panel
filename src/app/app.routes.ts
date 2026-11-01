import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/summoner/summoner').then((m) => m.Summoner),
  },
];