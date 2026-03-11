import { Component, inject, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TransactionService } from '../../../../service/tansaction/transaction.service';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../../../service/auth/auth.service';
import { BrowserStorageService } from '../../../../service/auth/BrowserStorageService.service';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { DashboardComponent } from '../../components/dashboard/dashboard.component';
import { TransactionFormComponent } from '../../../transactions/components/transaction-form/transaction-form.component';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule,SidebarComponent, DashboardComponent,
    TransactionFormComponent],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  @Input() username: string = 'User';
  constructor(
    private storage: BrowserStorageService,
    private txService: TransactionService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,

  ) {

      if (isPlatformBrowser(this.platformId)) {
      this.iconRegistry.addSvgIcon(
        'user-icon',
        this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/user-icon.svg')
      );
    }
  }
    // Placeholder stats (to be replaced with real API data later)
  totalExpenses: number = 0;
  totalInvestment: number = 0;
  totalDebt: number = 0;

  ngOnInit(): void {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      console.log("UseriD",this.authService.getCurrentUserID());
      
    
    // console.log('User stored in session:', this.storage.get('user'));
    const userId = this.authService.getCurrentUserID();
    if(userId) {
      this.txService.calculateTotals(userId).subscribe(totals => {
        this.totalExpenses = totals.totalExpense;
        this.totalInvestment = totals.totalInvestment;
        this.totalDebt = totals.totalDebt;
        console.log('Calculated Totals:', totals);
      });
      console.log("Total Expenses in Dashboard Page:",this.totalExpenses);
    }  
  }

  
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  selectedPage: string = 'Dashboard'


  onMenuSelect(menu: string) {
    this.selectedPage = menu;
  }

}
