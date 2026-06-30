import { Component, inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TransactionService } from '../../../../service/tansaction/transaction.service';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../../../service/auth/auth.service';
import { BrowserStorageService } from '../../../../service/auth/BrowserStorageService.service';
import { DashboardComponent } from '../../components/dashboard/dashboard.component';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, DashboardComponent],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  @Input() username: string = 'User';
  
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  private storage = inject(BrowserStorageService);
  private txService = inject(TransactionService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  totalExpenses: number = 0;
  totalInvestment: number = 0;
  totalDebt: number = 0;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.iconRegistry.addSvgIcon(
        'user-icon',
        this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/user-icon.svg')
      );
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    console.log("UseriD", this.authService.getCurrentUserID());

    const userId = this.authService.getCurrentUserID();
    if (userId) {
      this.txService.calculateTotals(userId).subscribe(totals => {
        this.totalExpenses = totals.totalExpense;
        this.totalInvestment = totals.totalInvestment;
        this.totalDebt = totals.totalDebt;
        console.log('Calculated Totals:', totals);
      });
      console.log("Total Expenses in Dashboard Page:", this.totalExpenses);
    }
  }

}
