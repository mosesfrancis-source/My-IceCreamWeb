import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { CartItem } from '../Models/cart-item';
import { IceCreamItem } from '../Models/ice-cream-item';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartSubject = new BehaviorSubject<CartItem[]>([]);
  readonly cart$ = this.cartSubject.asObservable();

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
      return true;
    }

    this.cartSubject.next([
      ...this.cartSubject.value,
      { item, quantity: requestedQuantity, toppings, coneType, note },
    ]);
    return true;
  }

  removeItem(index: number): void {
    this.cartSubject.next(this.cartSubject.value.filter((_, i) => i !== index));
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
  }

  clearCart(): void {
    this.cartSubject.next([]);
  }
}
