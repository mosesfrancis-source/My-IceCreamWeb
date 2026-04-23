import { IceCreamItem } from './ice-cream-item';

export interface CartItem {
  item: IceCreamItem;
  quantity: number;
  coneType: 'waffle' | 'sugar' | 'cup';
  toppings: string[];
  note?: string;
}
