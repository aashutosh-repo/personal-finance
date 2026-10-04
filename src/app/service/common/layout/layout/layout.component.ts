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

  isSidebarCollapsed = false;
  isMobileNavOpen = false;
  lastSelected: string | null = null;

  toggleMobileNav(): void {
    this.isMobileNavOpen = !this.isMobileNavOpen;
    if (this.isMobileNavOpen) {
      this.isSidebarCollapsed = false;
    }
  }

  closeMobileNav(): void {
    this.isMobileNavOpen = false;
  }

  onMenuSelect(menuId: string) {
    // Navigate based on the menu ID
    const routeMap: { [key: string]: string } = {
      'Dashboard': '/v1/dashboard',
      'transactions': '/v1/transactions',
      'expenses': '/v1/transactions',
      'budgets': '/v1/budgets',
      'income': '/v1/income',
      'payments': '/v1/payments',
      'chatbot': '/v1/chatbot',
      'investments': '/v1/investments',
      'debts': '/v1/debts',
      'monthly-overview': '/v1/monthly-overview',
      'profile': '/v1/profile'
    };

    const route = routeMap[menuId];
    console.log('Layout onMenuSelect:', menuId, '->', route);
    this.lastSelected = menuId;
    this.closeMobileNav();
    if (route) {
      this.router.navigateByUrl(route);
    }
  }
}
