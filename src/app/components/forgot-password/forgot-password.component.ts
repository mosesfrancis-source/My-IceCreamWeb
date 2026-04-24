import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  email = '';
  submitted = false;
  error = '';
  isSubmitting = false;

  constructor(private readonly authService: AuthService) {}

  async submit(): Promise<void> {
    this.error = '';
    this.submitted = false;
    this.isSubmitting = true;

    try {
      const sent = await this.authService.sendPasswordResetEmail(this.email.trim());
      if (!sent) {
        this.error = 'Unable to send the reset link. Check the email address and try again.';
        return;
      }

      this.submitted = true;
    } finally {
      this.isSubmitting = false;
    }
  }
}
