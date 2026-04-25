import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-status.component.html',
  styleUrl: './order-status.component.css',
})
export class OrderStatusComponent {
  private readonly orderService = inject(OrderService);

  readonly orders$ = this.orderService.orders$;

  refreshStatuses(): void {
    void this.orderService.refreshOrders();
  }
}
