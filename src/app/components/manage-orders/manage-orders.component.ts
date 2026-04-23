import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Order } from '../../Models/order';

@Component({
  selector: 'app-manage-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-orders.component.html',
  styleUrl: './manage-orders.component.css',
})
export class ManageOrdersComponent {
  private readonly adminService = inject(AdminService);

  readonly orders$ = this.adminService.orders$;
  readonly statuses: Order['status'][] = ['received', 'preparing', 'ready', 'completed'];

  updateStatus(orderId: number, status: Order['status']): void {
    this.adminService.setOrderStatus(orderId, status);
  }
}
