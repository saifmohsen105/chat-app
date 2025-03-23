import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: 'sign-in.component.html',
  styleUrls: ['sign-in.component.css'],
})
export class SignInComponent {
  email: string = '';
  password: string = '';

  private router = inject(Router);
  private authService = inject(AuthService)



  login() {
    this.authService
      .login(this.email, this.password)
      .then(() => {
        console.log('Login successful!');
        this.router.navigate(['/chat']);
      })
      .catch((error) => {
        console.error('Login failed:', error);
      });
  }
}
