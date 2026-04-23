import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-pickup-scheduler',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pickup-scheduler.component.html',
  styleUrl: './pickup-scheduler.component.css',
})
export class PickupSchedulerComponent {
  date = '';
  time = '';

  constructor(
    private readonly orderService: OrderService,
    private readonly router: Router,
  ) {
    const pickup = this.orderService.getPickup();
    this.date = pickup.date;
    this.time = pickup.time;
  }

  continueToCheckout(): void {
    this.orderService.setPickup(this.date, this.time);
    this.router.navigate(['/checkout']);
  }
}
