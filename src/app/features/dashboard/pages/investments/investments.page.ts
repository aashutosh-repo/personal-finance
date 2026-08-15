import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../../../service/tansaction/transaction.service';
import { AuthService } from '../../../../service/auth/auth.service';


@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './investments.page.html',
  styleUrls: ['./investments.page.scss']
})
export class InvestmentsPage implements OnInit {
  private txService = inject(TransactionService);
  private auth = inject(AuthService);

  loading = false;
  transactions: any[] = [];
  total = 0;

  ngOnInit(): void {
    const userId = this.auth.getCurrentUserID();
    if (!userId) return;
    this.load(userId);
  }

  load(userId: string) {
    this.loading = true;
    this.txService.getExpensesByUser(userId).subscribe({
      next: (list) => {
        this.transactions = (list || []).filter(t => (t.expenseCategory || '').toLowerCase() === 'investment');
        this.total = this.transactions.reduce((s, t) => s + Number(t.txnAmount || 0), 0);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
