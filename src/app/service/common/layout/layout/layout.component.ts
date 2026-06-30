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

  onMenuSelect(menuId: string) {
    // Navigate based on the menu ID
    const routeMap: { [key: string]: string } = {
      'Dashboard': '/v1/dashboard',
      'transactions': '/v1/transactions',
      'budgets': '/v1/budgets',
      'income': '/v1/income',
      'chatbot': '/v1/chatbot',
      'Investment': '/v1/dashboard', // placeholder
      'Debt': '/v1/dashboard', // placeholder
      'Monthly Overview': '/v1/dashboard', // placeholder
      'Account': '/v1/profile'
    };

    const route = routeMap[menuId];
    if (route) {
      this.router.navigate([route]);
    }
  }
}
