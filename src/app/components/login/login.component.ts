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

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  login(): void {
    const ok = this.authService.login(this.email, this.password);
    if (!ok) {
      this.error = 'Please provide a valid email and password.';
      return;
    }

    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
      return;
    }

    this.router.navigate(['/menu']);
  }
}
