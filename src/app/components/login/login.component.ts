import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  errorCode = '';
  isSubmitting = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  async login(): Promise<void> {
    this.error = '';
    this.errorCode = '';
    this.isSubmitting = true;

    try {
      const result = await this.authService.login(this.email.trim(), this.password);
      if (!result.ok || !result.user) {
        this.error = result.errorMessage ?? 'Unable to sign in. Check your email and password.';
        this.errorCode = result.errorCode ?? '';
        return;
      }

      await this.router.navigate([result.user.role === 'admin' ? '/admin' : '/menu']);
    } finally {
      this.isSubmitting = false;
    }
  }
}
