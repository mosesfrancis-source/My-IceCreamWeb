import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent {
  private readonly cartService = inject(CartService);

  readonly cart$ = this.cartService.cart$;
  readonly total$ = this.cartService.total$;

  increase(index: number, quantity: number): void {
    this.cartService.updateQuantity(index, quantity + 1);
  }

  decrease(index: number, quantity: number): void {
    this.cartService.updateQuantity(index, quantity - 1);
  }

  remove(index: number): void {
    this.cartService.removeItem(index);
  }
}
