import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Output() menuSelect = new EventEmitter<string>();

  menuItems = [
    'Dashboard',
    'Transaction',
    'Debt',
    'Investment',
    'Monthly Overview',
    'Account'
  ];

  selected = 'Dashboard';

  select(item: string) {
    this.selected = item;
    this.menuSelect.emit(item);
  }

}
