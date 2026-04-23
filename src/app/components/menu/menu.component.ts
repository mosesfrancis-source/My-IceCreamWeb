import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { IceCreamItem } from '../../Models/ice-cream-item';
import { CartService } from '../../services/cart.service';
import { MenuService } from '../../services/menu.service';
import { MenuItemComponent } from '../menu-item/menu-item.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuItemComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent {
  private readonly menuService = inject(MenuService);
  private readonly cartService = inject(CartService);
  private readonly searchTermSubject = new BehaviorSubject<string>('');

  search = '';
  readonly menu$ = this.menuService.menu$;
  readonly filteredMenu$: Observable<IceCreamItem[]> = combineLatest([
    this.menu$,
    this.searchTermSubject.asObservable(),
  ]).pipe(
    map(([items, term]) =>
      items.filter((item) =>
        `${item.name} ${item.flavor} ${item.tags.join(' ')}`
          .toLowerCase()
          .includes(term.trim().toLowerCase()),
      ),
    ),
  );

  onSearchChange(value: string): void {
    this.searchTermSubject.next(value);
  }

  addToCart(item: IceCreamItem): void {
    this.cartService.addItem(item, 1, [], 'cup');
  }
}
