import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  error = '';
  errorCode = '';
  isSubmitting = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  async register(): Promise<void> {
    this.error = '';
    this.errorCode = '';
    this.isSubmitting = true;

    try {
      const result = await this.authService.register(
        this.name.trim(),
        this.email.trim(),
        this.password,
      );
      if (!result.ok || !result.user) {
        this.error = result.errorMessage ?? 'Please complete all required fields and try again.';
        this.errorCode = result.errorCode ?? '';
        return;
      }

      await this.router.navigate(['/menu']);
    } finally {
      this.isSubmitting = false;
    }
  }
}
