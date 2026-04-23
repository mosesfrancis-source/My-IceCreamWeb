import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-manage-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-menu.component.html',
  styleUrl: './manage-menu.component.css',
})
export class ManageMenuComponent {
  private readonly adminService = inject(AdminService);
  private toastTimer?: number;
  private readonly maxImageSizeInBytes = 2 * 1024 * 1024;
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

  readonly menu$ = this.adminService.menu$;
  name = '';
  flavor = '';
  description = '';
  price = 0;
  quantity = 10;
  imageUrl = '';
  imagePreview = '';
  fileError = '';
  toastMessage = '';

  addItem(): void {
    if (!this.name || !this.flavor || this.price <= 0) {
      return;
    }

    const resolvedImageUrl =
      this.imagePreview || this.imageUrl.trim() || 'images/vanilla-dream.svg';

    this.adminService.createMenuItem({
      name: this.name,
      flavor: this.flavor,
      description: this.description,
      price: this.price,
      imageUrl: resolvedImageUrl,
      quantity: this.quantity,
      inStock: true,
      tags: ['new'],
    });

    this.name = '';
    this.flavor = '';
    this.description = '';
    this.price = 0;
    this.quantity = 10;
    this.imageUrl = '';
    this.imagePreview = '';
    this.fileError = '';
    this.showToast('Item added to live menu.');
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileError = '';

    if (!file) {
      return;
    }

    if (!this.allowedImageTypes.includes(file.type)) {
      this.imagePreview = '';
      this.fileError = 'Allowed formats: JPG, PNG, WEBP.';
      input.value = '';
      return;
    }

    if (file.size > this.maxImageSizeInBytes) {
      this.imagePreview = '';
      this.fileError = 'Image is too large. Max size is 2MB.';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  }

  clearSelectedImage(): void {
    this.imagePreview = '';
    this.fileError = '';
  }

  updateQuantity(id: number, value: string): void {
    this.adminService.updateMenuItemQuantity(id, Number(value));
  }

  removeItem(id: number): void {
    this.adminService.deleteMenuItem(id);
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }

    this.toastTimer = window.setTimeout(() => {
      this.toastMessage = '';
    }, 2200);
  }
}
