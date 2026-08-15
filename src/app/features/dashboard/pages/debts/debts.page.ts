import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../../../service/tansaction/transaction.service';
import { AuthService } from '../../../../service/auth/auth.service';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './debts.page.html',
  styleUrls: ['./debts.page.scss']
})
export class DebtsPage implements OnInit {
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
        this.transactions = (list || []).filter(t => (t.expenseCategory || '').toLowerCase() === 'debt');
        this.total = this.transactions.reduce((s, t) => s + Number(t.txnAmount || 0), 0);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
