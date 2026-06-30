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
    { label: 'Dashboard', icon: '📊', id: 'Dashboard' },
    { label: 'Transactions', icon: '💳', id: 'transactions' },
    { label: 'Budget', icon: '💰', id: 'budgets' },
    { label: 'Income', icon: '📈', id: 'income' },
    { label: 'Chatbot', icon: '🤖', id: 'chatbot' },
    { label: 'Investments', icon: '📗', id: 'Investment' },
    { label: 'Debts', icon: '💳', id: 'Debt' },
    { label: 'Monthly Overview', icon: '📅', id: 'Monthly Overview' },
    { label: 'Account', icon: '👤', id: 'Account' }
  ];

  selected = 'Dashboard';

  select(item: any) {
    this.selected = item.label;
    this.menuSelect.emit(item.id);
  }

}
