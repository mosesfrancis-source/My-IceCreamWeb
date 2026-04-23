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

  readonly cart$ = this.cartService.cart$;
  readonly total$ = this.cartService.total$;
  readonly pickup$ = this.orderService.pickup$;

  placeOrder(): void {
    const items = this.cartService.getItems();
    if (!items.length || !this.customerName || !this.customerEmail) {
      return;
    }

    this.orderService.placeOrder({
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      items,
    });

    this.cartService.clearCart();
    this.router.navigate(['/order-confirmation']);
  }
}
