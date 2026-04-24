import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  customerName = '';
  customerEmail = '';
  error = '';
  errorCode = '';
  isSubmitting = false;
  private submitWatchdogId: number | undefined;

  readonly cart$ = this.cartService.cart$;
  readonly total$ = this.cartService.total$;
  readonly pickup$ = this.orderService.pickup$;

  async placeOrder(): Promise<void> {
    this.error = '';
    this.errorCode = '';
    const items = this.cartService.getItems();
    if (!items.length || !this.customerName || !this.customerEmail) {
      this.error = 'Please complete customer details before placing your order.';
      return;
    }

    this.isSubmitting = true;
    this.submitWatchdogId = window.setTimeout(() => {
      this.isSubmitting = false;
      this.errorCode = 'checkout-watchdog-timeout';
      this.error =
        'Order request took too long. Please check Firestore rules/network and try again.';
    }, 15000);

    try {
      const result = await this.withTimeout(
        this.orderService.placeOrder({
          customerName: this.customerName,
          customerEmail: this.customerEmail,
          items,
        }),
        12000,
      );

      if (!result.ok || !result.order) {
        this.error =
          result.errorMessage ?? 'Unable to place your order right now. Please try again.';
        this.errorCode = result.errorCode ?? '';
        return;
      }

      this.cartService.clearCart();
      void this.router.navigate(['/order-confirmation']);
    } finally {
      if (typeof this.submitWatchdogId !== 'undefined') {
        window.clearTimeout(this.submitWatchdogId);
        this.submitWatchdogId = undefined;
      }
      this.isSubmitting = false;
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: number | undefined;

    const timeoutPromise = new Promise<T>((_resolve, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('order-timeout'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message === 'order-timeout') {
        return {
          ok: false,
          errorCode: 'order-timeout',
          errorMessage: 'Order request timed out. Please try again.',
        } as T;
      }

      throw error;
    } finally {
      if (typeof timeoutId !== 'undefined') {
        window.clearTimeout(timeoutId);
      }
    }
  }
}
