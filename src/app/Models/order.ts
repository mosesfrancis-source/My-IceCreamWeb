import { CartItem } from './cart-item';

export interface Order {
  id: number;
  items: CartItem[];
  customerName: string;
  customerEmail: string;
  pickupDate: string;
  pickupTime: string;
  status: 'received' | 'preparing' | 'ready' | 'completed';
  total: number;
  createdAt: string;
}
