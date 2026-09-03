import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  id: string;
  route: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() menuSelect = new EventEmitter<string>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  selected = '/v1/dashboard';

  menuGroups: NavGroup[] = [
    {
      title: 'FINANCE',
      items: [
        { label: 'Dashboard', icon: '📊', id: 'Dashboard', route: '/v1/dashboard' },
        { label: 'Transactions', icon: '💳', id: 'transactions', route: '/v1/transactions' },
        { label: 'Income', icon: '📈', id: 'income', route: '/v1/income' },
        { label: 'Expenses', icon: '🧾', id: 'expenses', route: '/v1/transactions' }
      ]
    },
    {
      title: 'PLANNING',
      items: [
        { label: 'Budget', icon: '💰', id: 'budgets', route: '/v1/budgets' },
        { label: 'Monthly Overview', icon: '📅', id: 'monthly-overview', route: '/v1/monthly-overview' }
      ]
    },
    {
      title: 'WEALTH',
      items: [
        { label: 'Investments', icon: '📗', id: 'investments', route: '/v1/investments' },
        { label: 'Debts', icon: '💳', id: 'debts', route: '/v1/debts' }
      ]
    },
    { title: 'MARKET INTELLIGENCE', 
      items: [ 
        { label: 'Companies', icon: '🏢', id: 'companies', route: '/v1/stocks/companies' }, 
        { label: 'Stock Analysis', icon: '📈', id: 'stock-analysis', route: '/v1/stocks/analysis' }, 
        { label: 'Market Sync Jobs', icon: '🔄', id: 'market-sync', route: '/v1/stocks/sync-jobs' } ] 
    },
    { title: 'STOCKS', 
      items: [ 
        { label: 'Watchlist', icon: '🏢', id: 'companies', route: '/v1/stocks/watchlist' }, 
        { label: 'AI Research', icon: '📈', id: 'stock-analysis', route: '/v1/stocks/research'}]
    },
    {
      title: 'AI',
      items: [
        { label: 'Chatbot', icon: '🤖', id: 'chatbot', route: '/v1/chatbot' }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Account', icon: '👤', id: 'profile', route: '/v1/profile' }
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.selected = this.router.url;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.selected = event.urlAfterRedirects;
      });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
  }

  select(item: NavItem) {
    this.selected = item.route;
    this.menuSelect.emit(item.id);
  }

  isActive(item: NavItem): boolean {
    return this.selected === item.route || this.selected.startsWith(item.route + '/');
  }
}
