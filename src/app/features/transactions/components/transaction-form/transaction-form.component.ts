import { Component, EventEmitter, Output } from '@angular/core';
import { ExpenseType, Transaction } from '../../../../../model/transaction.model';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionService } from '../../../../service/tansaction/transaction.service';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SharedMaterialModules } from '../../../../service/common/shared-material.module';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [SharedMaterialModules, MatDatepickerModule,
    MatNativeDateModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent {

  @Output() expenseAdded = new EventEmitter<Transaction>();
  transactionForm: FormGroup;
  expenseTypes = Object.values(ExpenseType);

  constructor(private fb: FormBuilder, private txService: TransactionService) {
    this.transactionForm = this.fb.group({
      txnAmount: [null, [Validators.required, Validators.min(1)]],
      expenseCategory: [null, Validators.required],
      description: ['', Validators.required],
      dateOfExpense: [new Date().toISOString().substring(0, 10), Validators.required],
      userId: [1, Validators.required] // Replace with real logged-in user ID
    });
  }

  submit() {
    if (this.transactionForm.valid) {
      const transaction: Transaction = this.transactionForm.value;
      this.txService.addExpense(transaction).subscribe({
        next: (res) => {
          this.expenseAdded.emit(res);
          this.transactionForm.reset({
            dateOfExpense: new Date().toISOString().substring(0, 10),
            userId: 1
          });
        },
        error: (err) => console.error('Error adding expense', err)
      });
    }
  }

}
