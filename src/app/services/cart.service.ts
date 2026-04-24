import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { CartItem } from '../Models/cart-item';
import { IceCreamItem } from '../Models/ice-cream-item';
import { AuthService } from './auth.service';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartSubject = new BehaviorSubject<CartItem[]>([]);
  readonly cart$ = this.cartSubject.asObservable();

  constructor(
    private readonly apiClient: ApiClientService,
    private readonly authService: AuthService,
  ) {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        void this.loadRemoteCart();
      }
    });
  }

  readonly itemCount$ = this.cart$.pipe(
    map((items) => items.reduce((total, item) => total + item.quantity, 0)),
  );

  readonly total$ = this.cart$.pipe(
    map((items) => items.reduce((total, entry) => total + entry.item.price * entry.quantity, 0)),
  );

  getItems(): CartItem[] {
    return this.cartSubject.value;
  }

  addItem(
    item: IceCreamItem,
    quantity = 1,
    toppings: string[] = [],
    coneType: 'waffle' | 'sugar' | 'cup' = 'cup',
    note = '',
  ): boolean {
    const requestedQuantity = Math.max(1, Math.trunc(quantity));
    if (!item.inStock || item.quantity <= 0 || requestedQuantity > item.quantity) {
      return false;
    }

    const existingIndex = this.cartSubject.value.findIndex(
      (entry) => entry.item.id === item.id && entry.coneType === coneType && entry.note === note,
    );

    if (existingIndex >= 0) {
      const next = [...this.cartSubject.value];
      const existing = next[existingIndex];
      const nextQuantity = existing.quantity + requestedQuantity;
      if (nextQuantity > item.quantity) {
        return false;
      }

      next[existingIndex] = { ...existing, quantity: nextQuantity };
      this.cartSubject.next(next);
      this.syncRemoteCart();
      return true;
    }

    this.cartSubject.next([
      ...this.cartSubject.value,
      { item, quantity: requestedQuantity, toppings, coneType, note },
    ]);
    this.syncRemoteCart();
    return true;
  }

  removeItem(index: number): void {
    this.cartSubject.next(this.cartSubject.value.filter((_, i) => i !== index));
    this.syncRemoteCart();
  }

  updateQuantity(index: number, quantity: number): void {
    const next = [...this.cartSubject.value];
    if (!next[index]) {
      return;
    }

    if (quantity <= 0) {
      this.removeItem(index);
      return;
    }

    next[index] = { ...next[index], quantity };
    this.cartSubject.next(next);
    this.syncRemoteCart();
  }

  clearCart(): void {
    this.cartSubject.next([]);
    this.syncRemoteCart();
  }

  private async loadRemoteCart(): Promise<void> {
    try {
      const response = await this.apiClient.get<CartPayload>('/cart/', true);
      const mapped = (response.items ?? []).map(
        (entry) =>
          ({
            item: {
              id: entry.item.id,
              name: entry.item.name,
              flavor: entry.item.flavor,
              description: entry.item.description,
              price: Number(entry.item.price),
              imageUrl: entry.item.imageUrl,
              quantity: Number(entry.item.quantity),
              inStock: entry.item.inStock,
              tags: Array.isArray(entry.item.tags) ? entry.item.tags : [],
            },
            quantity: Number(entry.quantity),
            coneType: entry.coneType,
            toppings: Array.isArray(entry.toppings) ? entry.toppings : [],
            note: entry.note ?? '',
          }) as CartItem,
      );

      this.cartSubject.next(mapped);
    } catch {
      // Keep local cart state if remote cart cannot be loaded.
    }
  }

  private syncRemoteCart(): void {
    void (async () => {
      const token = await this.authService.getIdToken();
      if (!token) {
        return;
      }

      const payload: CartPayload = {
        items: this.cartSubject.value.map((entry) => ({
          item: {
            id: entry.item.id,
            name: entry.item.name,
            flavor: entry.item.flavor,
            description: entry.item.description,
            price: entry.item.price,
            imageUrl: entry.item.imageUrl,
            quantity: entry.item.quantity,
            inStock: entry.item.inStock,
            tags: entry.item.tags,
          },
          quantity: entry.quantity,
          coneType: entry.coneType,
          toppings: entry.toppings,
          note: entry.note ?? '',
        })),
      };

      try {
        await this.apiClient.put('/cart/', payload, true);
      } catch {
        // Keep local cart state if remote sync fails.
      }
    })();
  }
}

interface CartPayload {
  items: Array<{
    item: {
      id: number;
      name: string;
      flavor: string;
      description: string;
      price: number;
      imageUrl: string;
      quantity: number;
      inStock: boolean;
      tags: string[];
    };
    quantity: number;
    coneType: 'waffle' | 'sugar' | 'cup';
    toppings: string[];
    note?: string;
  }>;
}
