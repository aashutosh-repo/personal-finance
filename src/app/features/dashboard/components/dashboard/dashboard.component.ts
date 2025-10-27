import { Component, inject, PLATFORM_ID } from '@angular/core';
import { ExpenseChartComponent } from '../../pages/charts/expense-chart/expense-chart.component';
import { InvestmentChartComponent } from '../../pages/charts/investment-chart/investment-chart.component';
import { DebtChartComponent } from '../../pages/charts/debt-chart/debt-chart.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { TransactionFormComponent } from '../../../transactions/components/transaction-form/transaction-form.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule,ExpenseChartComponent, InvestmentChartComponent, 
    DebtChartComponent, ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
    private platformId = inject(PLATFORM_ID);
    selectedPage: string = 'Dashboard'

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.iconRegistry.addSvgIcon(
        'user-icon',
        this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/user-icon.svg')
      );
    }
  }
    onMenuSelect(menu: string) {
    this.selectedPage = menu;
  }

}
