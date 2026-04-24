import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../services/admin.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.css',
})
export class ManageUsersComponent {
  private readonly adminService = inject(AdminService);

  users: AdminUser[] = [];
  email = '';
  password = '';
  displayName = '';
  error = '';
  isLoading = false;
  isSubmitting = false;

  constructor() {
    void this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.error = '';
    this.isLoading = true;

    try {
      this.users = await this.adminService.getUsers();
    } catch (error) {
      this.error = this.describeError(error, 'Unable to load users.');
    } finally {
      this.isLoading = false;
    }
  }

  async addUser(): Promise<void> {
    this.error = '';
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Email and password are required.';
      return;
    }

    this.isSubmitting = true;
    try {
      await this.adminService.createUser({
        email: this.email.trim(),
        password: this.password,
        displayName: this.displayName.trim(),
      });

      this.email = '';
      this.password = '';
      this.displayName = '';
      await this.loadUsers();
    } catch (error) {
      this.error = this.describeError(error, 'Unable to create user.');
    } finally {
      this.isSubmitting = false;
    }
  }

  async removeUser(uid: string): Promise<void> {
    this.error = '';

    try {
      await this.adminService.deleteUser(uid);
      await this.loadUsers();
    } catch (error) {
      this.error = this.describeError(error, 'Unable to delete user.');
    }
  }

  private describeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot reach backend API. Start Django server and verify CORS/API URL settings.';
      }

      if (error.status === 401) {
        return 'Session token not ready or expired. Please sign out and sign in again.';
      }

      if (error.status === 403) {
        return 'Only the owner admin account can load users.';
      }

      const detail = error.error?.detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }

      if (error.message) {
        return error.message;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
