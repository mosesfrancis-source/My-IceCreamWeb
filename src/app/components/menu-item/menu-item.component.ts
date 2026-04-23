import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IceCreamItem } from '../../Models/ice-cream-item';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu-item.component.html',
  styleUrl: './menu-item.component.css',
})
export class MenuItemComponent {
  @Input({ required: true }) item!: IceCreamItem;
  @Output() add = new EventEmitter<IceCreamItem>();

  addToCart(): void {
    this.add.emit(this.item);
  }
}
