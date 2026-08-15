import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  private router = inject(Router);

  lastSelected: string | null = null;

  onMenuSelect(menuId: string) {
    // Navigate based on the menu ID
    const routeMap: { [key: string]: string } = {
      'Dashboard': '/v1/dashboard',
      'transactions': '/v1/transactions',
      'budgets': '/v1/budgets',
      'income': '/v1/income',
      'chatbot': '/v1/chatbot',
      'investments': '/v1/investments',
      'debts': '/v1/debts',
      'monthly-overview': '/v1/monthly-overview',
      'profile': '/v1/profile'
    };

    const route = routeMap[menuId];
    console.log('Layout onMenuSelect:', menuId, '->', route);
    this.lastSelected = menuId;
    if (route) {
      this.router.navigateByUrl(route);
    }
  }
}
