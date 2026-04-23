import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../Models/cart-item';
import { Order } from '../Models/order';

const ORDERS_STORAGE_KEY = 'icecream-orders';
const VALID_STATUSES: Order['status'][] = ['received', 'preparing', 'ready', 'completed'];

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly ordersSubject = new BehaviorSubject<Order[]>(this.loadOrders());
  readonly orders$ = this.ordersSubject.asObservable();

  private readonly latestOrderSubject = new BehaviorSubject<Order | null>(
    this.ordersSubject.value[0] ?? null,
  );
  readonly latestOrder$ = this.latestOrderSubject.asObservable();

  private readonly pickupSubject = new BehaviorSubject<{ date: string; time: string }>({
    date: '',
    time: '',
  });
  readonly pickup$ = this.pickupSubject.asObservable();

  setPickup(date: string, time: string): void {
    this.pickupSubject.next({ date, time });
  }

  getPickup(): { date: string; time: string } {
    return this.pickupSubject.value;
  }

  placeOrder(payload: { customerName: string; customerEmail: string; items: CartItem[] }): Order {
    const nextId = Math.max(1000, ...this.ordersSubject.value.map((order) => order.id)) + 1;
    const pickup = this.pickupSubject.value;

    const order: Order = {
      id: nextId,
      items: payload.items,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      pickupDate: pickup.date,
      pickupTime: pickup.time,
      status: 'received',
      total: payload.items.reduce((sum, item) => sum + item.item.price * item.quantity, 0),
      createdAt: new Date().toISOString(),
    };

    this.persistOrders([order, ...this.ordersSubject.value]);
    this.latestOrderSubject.next(order);
    return order;
  }

  updateOrderStatus(orderId: number, status: Order['status']): void {
    if (!VALID_STATUSES.includes(status)) {
      return;
    }

    this.persistOrders(
      this.ordersSubject.value.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  }

  getLatestOrder(): Order | null {
    return this.latestOrderSubject.value;
  }

  private persistOrders(orders: Order[]): void {
    this.ordersSubject.next(orders);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }

  private loadOrders(): Order[] {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Partial<Order>[];
      return parsed.map((order, index) => {
        const fallbackStatus: Order['status'] = 'received';
        const status = VALID_STATUSES.includes(order.status as Order['status'])
          ? (order.status as Order['status'])
          : fallbackStatus;

        return {
          id: Number(order.id ?? index + 1001),
          items: Array.isArray(order.items) ? (order.items as CartItem[]) : [],
          customerName: order.customerName ?? 'Guest',
          customerEmail: order.customerEmail ?? '',
          pickupDate: order.pickupDate ?? '',
          pickupTime: order.pickupTime ?? '',
          status,
          total: Number(order.total ?? 0),
          createdAt: order.createdAt ?? new Date().toISOString(),
        };
      });
    } catch {
      localStorage.removeItem(ORDERS_STORAGE_KEY);
      return [];
    }
  }
}
