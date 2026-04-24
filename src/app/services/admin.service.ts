import { Injectable, inject } from '@angular/core';
import { MenuService } from './menu.service';
import { OrderService } from './order.service';
import { IceCreamItem } from '../Models/ice-cream-item';
import { Order } from '../Models/order';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly menuService = inject(MenuService);
  private readonly orderService = inject(OrderService);
  private readonly apiClient = inject(ApiClientService);

  readonly menu$ = this.menuService.menu$;
  readonly orders$ = this.orderService.orders$;

  constructor() {
    void this.menuService.refreshMenu();
    void this.orderService.refreshOrders();
  }

  createMenuItem(payload: Omit<IceCreamItem, 'id'>): void {
    this.menuService.addMenuItem(payload);
  }

  deleteMenuItem(id: number): void {
    this.menuService.removeMenuItem(id);
  }

  updateMenuItemQuantity(id: number, quantity: number): void {
    this.menuService.updateItemQuantity(id, quantity);
  }

  setOrderStatus(orderId: number, status: Order['status']): void {
    this.orderService.updateOrderStatus(orderId, status);
  }

  async getUsers(): Promise<AdminUser[]> {
    return await this.apiClient.get<AdminUser[]>('/admin/users/', true);
  }

  async createUser(payload: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<AdminUser> {
    return await this.apiClient.post<AdminUser>(
      '/admin/users/',
      {
        email: payload.email,
        password: payload.password,
        display_name: payload.displayName,
      },
      true,
    );
  }

  async deleteUser(uid: string): Promise<void> {
    await this.apiClient.delete(`/admin/users/${uid}/`, true);
  }
}

export interface AdminUser {
  uid: string;
  email: string;
  display_name?: string;
  disabled: boolean;
}
