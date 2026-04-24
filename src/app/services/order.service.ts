import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  FirestoreError,
  getFirestore,
  serverTimestamp,
} from 'firebase/firestore';
import { CartItem } from '../Models/cart-item';
import { Order } from '../Models/order';
import { ApiClientService } from './api-client.service';
import { firebaseConfig } from './firebase.config';

const ORDERS_STORAGE_KEY = 'icecream-orders';
const VALID_STATUSES: Order['status'][] = ['received', 'preparing', 'ready', 'completed'];

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly firebaseApp: FirebaseApp =
    getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  private readonly firestore = getFirestore(this.firebaseApp);

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

  constructor(private readonly apiClient: ApiClientService) {
    void this.refreshOrders();
  }

  setPickup(date: string, time: string): void {
    this.pickupSubject.next({ date, time });
  }

  getPickup(): { date: string; time: string } {
    return this.pickupSubject.value;
  }

  async placeOrder(payload: {
    customerName: string;
    customerEmail: string;
    items: CartItem[];
  }): Promise<OrderOutcome> {
    const pickup = this.pickupSubject.value;

    const body = {
      customer_name: payload.customerName,
      customer_email: payload.customerEmail,
      pickup_date: pickup.date,
      pickup_time: pickup.time,
      items: payload.items.map((item) => ({
        menu_item_id: item.item.id,
        item_name: item.item.name,
        flavor: item.item.flavor,
        image_url: item.item.imageUrl,
        unit_price: item.item.price,
        quantity: item.quantity,
        cone_type: item.coneType,
        toppings: item.toppings,
        note: item.note ?? '',
      })),
    };

    try {
      const fallbackOrder = await this.withTimeout(
        this.createFirestoreOrder(payload, pickup),
        8000,
        'firestore-order-timeout',
      );

      const nextOrders = [fallbackOrder, ...this.ordersSubject.value];
      this.persistOrders(nextOrders);
      this.latestOrderSubject.next(fallbackOrder);

      void this.syncOrderToBackend(body, fallbackOrder);

      return { ok: true, order: fallbackOrder };
    } catch (firestoreError) {
      return {
        ok: false,
        errorCode: this.getOrderErrorCode(firestoreError),
        errorMessage: this.getOrderErrorMessage(firestoreError),
      };
    }
  }

  updateOrderStatus(orderId: number, status: Order['status']): void {
    if (!VALID_STATUSES.includes(status)) {
      return;
    }

    void (async () => {
      try {
        await this.apiClient.patch(`/orders/${orderId}/status/`, { status }, true);
        await this.refreshOrders();
      } catch {
        // Keep current state when backend update fails.
      }
    })();
  }

  getLatestOrder(): Order | null {
    return this.latestOrderSubject.value;
  }

  private persistOrders(orders: Order[]): void {
    this.ordersSubject.next(orders);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }

  async refreshOrders(): Promise<void> {
    try {
      const orders = await this.apiClient.get<OrderApi[]>('/orders/', true);
      const mapped = orders.map((order) => this.mapOrder(order));
      this.persistOrders(mapped);
      this.latestOrderSubject.next(mapped[0] ?? null);
    } catch {
      // Keep local state if backend is offline.
    }
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

  private mapOrder(order: OrderApi): Order {
    return {
      id: Number(order.id),
      items: order.items.map((item) => ({
        item: {
          id: Number(item.menu_item_id ?? 0),
          name: item.item_name,
          flavor: item.flavor,
          description: '',
          price: Number(item.unit_price),
          imageUrl: item.image_url,
          quantity: Number(item.quantity),
          inStock: true,
          tags: [],
        },
        quantity: Number(item.quantity),
        coneType: item.cone_type,
        toppings: Array.isArray(item.toppings) ? item.toppings : [],
        note: item.note ?? '',
      })),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      status: order.status,
      total: Number(order.total),
      createdAt: order.created_at,
    };
  }

  private async createFirestoreOrder(
    payload: { customerName: string; customerEmail: string; items: CartItem[] },
    pickup: { date: string; time: string },
  ): Promise<Order> {
    const createdAt = new Date().toISOString();
    const total = payload.items.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

    const firestorePayload = {
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      pickupDate: pickup.date,
      pickupTime: pickup.time,
      status: 'received',
      total,
      createdAt,
      items: payload.items.map((item) => ({
        menuItemId: item.item.id,
        itemName: item.item.name,
        flavor: item.item.flavor,
        imageUrl: item.item.imageUrl,
        unitPrice: item.item.price,
        quantity: item.quantity,
        coneType: item.coneType,
        toppings: item.toppings,
        note: item.note ?? '',
      })),
      source: 'web-checkout',
      createdAtServer: serverTimestamp(),
    };

    await addDoc(collection(this.firestore, 'orders'), firestorePayload);

    return {
      id: Date.now(),
      items: payload.items,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      pickupDate: pickup.date,
      pickupTime: pickup.time,
      status: 'received',
      total,
      createdAt,
    };
  }

  private async syncOrderToBackend(body: unknown, fallbackOrder: Order): Promise<void> {
    try {
      await this.withTimeout(
        this.apiClient.post('/orders/', body, true),
        8000,
        'backend-order-timeout',
      );
      await this.refreshOrders();
    } catch {
      // The Firestore order is already saved; backend sync is best-effort only.
    }
  }

  private getOrderErrorMessage(firestoreError: unknown): string {
    const firestoreMessage = this.describeUnknownError(firestoreError);
    return `Order save failed in Firestore (default database). ${firestoreMessage}.`;
  }

  private getOrderErrorCode(error: unknown): string {
    if (this.isFirestoreError(error)) {
      return error.code;
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
    ) {
      return String((error as { code: string }).code);
    }

    return 'unknown';
  }

  private isFirestoreError(error: unknown): error is FirestoreError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  private describeUnknownError(error: unknown): string {
    if (this.isFirestoreError(error)) {
      return `${error.code}: ${error.message}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutCode: string,
  ): Promise<T> {
    let timeoutId: number | undefined;

    const timeoutPromise = new Promise<T>((_resolve, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(timeoutCode));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (typeof timeoutId !== 'undefined') {
        window.clearTimeout(timeoutId);
      }
    }
  }
}

interface OrderApi {
  id: number;
  customer_name: string;
  customer_email: string;
  pickup_date: string;
  pickup_time: string;
  status: Order['status'];
  total: number;
  created_at: string;
  items: Array<{
    menu_item_id: number | null;
    item_name: string;
    flavor: string;
    image_url: string;
    unit_price: number;
    quantity: number;
    cone_type: 'waffle' | 'sugar' | 'cup';
    toppings: string[];
    note?: string;
  }>;
}

interface OrderOutcome {
  ok: boolean;
  order?: Order;
  errorCode?: string;
  errorMessage?: string;
}
