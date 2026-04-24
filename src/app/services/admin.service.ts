import { Injectable, inject } from '@angular/core';
import { MenuService } from './menu.service';
import { OrderService } from './order.service';
import { IceCreamItem } from '../Models/ice-cream-item';
import { Order } from '../Models/order';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly menuService = inject(MenuService);
  private readonly orderService = inject(OrderService);

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
}
