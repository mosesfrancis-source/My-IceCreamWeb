import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IceCreamItem } from '../../Models/ice-cream-item';
import { CartService } from '../../services/cart.service';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-customize-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customize-order.component.html',
  styleUrl: './customize-order.component.css',
})
export class CustomizeOrderComponent {
  item?: IceCreamItem;
  quantity = 1;
  error = '';
  coneType: 'waffle' | 'sugar' | 'cup' = 'cup';
  toppings = {
    sprinkles: false,
    caramel: false,
    nuts: false,
    cherries: false,
  };
  note = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly menuService: MenuService,
    private readonly cartService: CartService,
  ) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.item = this.menuService.getMenuItemById(id);
  }

  get isUnavailable(): boolean {
    return !this.item || !this.item.inStock || this.item.quantity <= 0;
  }

  addCustomOrder(): void {
    if (this.isUnavailable || !this.item) {
      this.error = 'This item is currently out of stock and cannot be added.';
      return;
    }

    const toppingList = Object.entries(this.toppings)
      .filter(([, selected]) => selected)
      .map(([name]) => name);

    const added = this.cartService.addItem(
      this.item,
      this.quantity,
      toppingList,
      this.coneType,
      this.note,
    );

    if (!added) {
      this.error = 'Requested quantity is unavailable right now.';
      return;
    }

    this.router.navigate(['/cart']);
  }
}
