import { Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  {
    path: 'sign-in',
    loadChildren: () => import('./sign-in/sign-in.component').then(m => m.SignInComponent)
  },
  {
    path: 'sign-up',
    loadChildren: () => import('./sign-up/sign-up.component').then(m => m.SignUpComponent)
  },
  { path: 'chat', component: ChatComponent },
  { path: '**', component: NotFoundComponent },
];
