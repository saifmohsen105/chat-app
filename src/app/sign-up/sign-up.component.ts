import { Component, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  updateProfile,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: 'sign-up.component.html',
  styleUrls: ['sign-up.component.css'],
})
export class SignUpComponent {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  passwordMismatch = false;

  get isFormValid(): boolean {
    return (
      this.username.trim() !== '' &&
      this.email.trim() !== '' &&
      this.password.length >= 6 &&
      this.confirmPassword === this.password
    );
  }

  register() {
    if (this.password !== this.confirmPassword) {
      this.passwordMismatch = true;
      return;
    }
    this.passwordMismatch = false;

    createUserWithEmailAndPassword(this.auth, this.email, this.password)
      .then(async (userCredential) => {
        const user = userCredential.user;

        // تحديث اسم المستخدم في Firebase Authentication
        await updateProfile(user, { displayName: this.username });

        // تخزين بيانات المستخدم في Firestore
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        await setDoc(userDocRef, {
          username: this.username,
          email: this.email,
          createdAt: Date.now()
        });

        this.router.navigate(['/sign-in']);
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
          this.errorMessage =
            'This email is already registered. Please use another email or log in.';
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }
      });
  }
}
