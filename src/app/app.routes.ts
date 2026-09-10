import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/pages/main/content/content').then(m => m.Content)
    }
];
