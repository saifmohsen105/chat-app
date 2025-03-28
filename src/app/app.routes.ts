import { Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in/sign-in.component').then(m => m.SignInComponent), title: "sign-in"
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./sign-up/sign-up.component').then(m => m.SignUpComponent), title: "sign-up"
  },
  { path: 'chat', component: ChatComponent, title: "chat" },
  { path: '**', component: NotFoundComponent },
];
