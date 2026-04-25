import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IceCreamItem } from '../Models/ice-cream-item';
import { ApiClientService } from './api-client.service';

const MENU_STORAGE_KEY = 'icecream-menu-items';

const STARTER_MENU: IceCreamItem[] = [
  {
    id: 1,
    name: 'Classic Vanilla Dream',
    flavor: 'Vanilla',
    description: 'Madagascar vanilla bean ice cream with a creamy finish.',
    price: 4.5,
    imageUrl: 'images/vanilla-dream.svg',
    quantity: 24,
    inStock: true,
    tags: ['classic', 'best seller'],
  },
  {
    id: 2,
    name: 'Strawberry Swirl Bliss',
    flavor: 'Strawberry',
    description: 'Fresh strawberry blend with ribboned berry swirl.',
    price: 5,
    imageUrl: 'images/strawberry-swirl.svg',
    quantity: 18,
    inStock: true,
    tags: ['fruity'],
  },
  {
    id: 3,
    name: 'Chocolate Thunder Scoop',
    flavor: 'Chocolate',
    description: 'Rich cocoa ice cream with dark chocolate chips.',
    price: 5.25,
    imageUrl: 'images/chocolate-thunder.svg',
    quantity: 14,
    inStock: true,
    tags: ['chocolate', 'kids favorite'],
  },
  {
    id: 4,
    name: 'Mint Cookie Crush',
    flavor: 'Mint',
    description: 'Cool mint cream loaded with chocolate cookie chunks.',
    price: 5.5,
    imageUrl: 'images/mint-cookie.svg',
    quantity: 0,
    inStock: false,
    tags: ['seasonal'],
  },
];

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly menuSubject = new BehaviorSubject<IceCreamItem[]>(this.loadMenu());
  readonly menu$ = this.menuSubject.asObservable();

  constructor(private readonly apiClient: ApiClientService) {
    void this.refreshMenu();
  }

  getMenu(): IceCreamItem[] {
    return this.menuSubject.value;
  }

  getMenuItemById(id: number): IceCreamItem | undefined {
    return this.menuSubject.value.find((item) => item.id === id);
  }

  addMenuItem(newItem: Omit<IceCreamItem, 'id'>): void {
    const normalizedQuantity = Math.max(0, Math.trunc(newItem.quantity));
    const payload = {
      name: newItem.name,
      flavor: newItem.flavor,
      description: newItem.description,
      price: newItem.price,
      image_url: newItem.imageUrl,
      quantity: normalizedQuantity,
      tags: newItem.tags,
    };

    void (async () => {
      try {
        await this.apiClient.post('/menu/', payload, true);
        await this.refreshMenu();
      } catch {
        // Keep the current state if the backend request fails.
      }
    })();
  }

  updateMenuItem(updatedItem: IceCreamItem): void {
    this.updateItemQuantity(updatedItem.id, updatedItem.quantity);
  }

  updateItemQuantity(id: number, quantity: number): void {
    const normalizedQuantity = Math.max(0, Math.trunc(quantity));

    void (async () => {
      try {
        await this.apiClient.patch(`/menu/${id}/`, { quantity: normalizedQuantity }, true);
        await this.refreshMenu();
      } catch {
        // Keep the current state if the backend request fails.
      }
    })();
  }

  removeMenuItem(id: number): void {
    void (async () => {
      try {
        await this.apiClient.delete(`/menu/${id}/`, true);
        await this.refreshMenu();
      } catch {
        // Keep the current state if the backend request fails.
      }
    })();
  }

  async refreshMenu(): Promise<void> {
    try {
      const items = await this.apiClient.get<MenuApiItem[]>('/menu/');
      const mapped = items.map((item) => this.mapApiItem(item));

      if (mapped.length === 0) {
        // Avoid wiping the UI when backend is empty/unseeded.
        if (this.menuSubject.value.length === 0) {
          this.updateMenu(STARTER_MENU);
        }
        return;
      }

      this.updateMenu(mapped);
    } catch {
      // Keep local fallback state if backend is offline.
    }
  }

  private updateMenu(items: IceCreamItem[]): void {
    this.menuSubject.next(items);
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
  }

  private loadMenu(): IceCreamItem[] {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) {
      return STARTER_MENU;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<IceCreamItem>[];
      return parsed.map((item, index) => {
        const quantity = Math.max(0, Math.trunc(Number(item.quantity ?? 0)));
        return {
          id: Number(item.id ?? index + 1),
          name: item.name ?? 'Untitled Item',
          flavor: item.flavor ?? 'Unknown',
          description: item.description ?? '',
          price: Number(item.price ?? 0),
          imageUrl: item.imageUrl ?? 'images/vanilla-dream.svg',
          quantity,
          inStock: quantity > 0,
          tags: Array.isArray(item.tags) ? item.tags : ['new'],
        };
      });
    } catch {
      localStorage.removeItem(MENU_STORAGE_KEY);
      return STARTER_MENU;
    }
  }

  private mapApiItem(item: MenuApiItem): IceCreamItem {
    const quantity = Math.max(0, Math.trunc(Number(item.quantity ?? 0)));

    return {
      id: Number(item.id),
      name: item.name,
      flavor: item.flavor,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.image_url,
      quantity,
      inStock: quantity > 0,
      tags: Array.isArray(item.tags) ? item.tags : [],
    };
  }
}

interface MenuApiItem {
  id: number;
  name: string;
  flavor: string;
  description: string;
  price: number;
  image_url: string;
  quantity: number;
  tags: string[];
}
