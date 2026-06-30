import { Component, EventEmitter, Output } from '@angular/core';
import { ExpenseType, Transaction, TransactionType } from '../../../../../model/transaction.model';
import { IncomeSource} from '../../../../../model/enums/IncomeSource.model';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormBuilder, FormGroup,Validators } from '@angular/forms';
import { TransactionService } from '../../../../service/tansaction/transaction.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SharedMaterialModules } from '../../../../service/common/shared-material.module';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [SharedMaterialModules, MatDatepickerModule,MatButtonToggleModule,
    MatNativeDateModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent {

  selectedPage: 'transaction' | 'income' = 'transaction';


  @Output() expenseAdded = new EventEmitter<Transaction>();
  transactionForm: FormGroup;
  incomeForm!: FormGroup;
  transactionTypes = Object.values(TransactionType);
  expenseCategories = Object.values(ExpenseType);
  incomeSources = Object.values(IncomeSource);


  constructor(private fb: FormBuilder, private txService: TransactionService) {
    this.transactionForm = this.fb.group({
      txnAmount: [null, [Validators.required, Validators.min(1)]],
      txnType: [null, Validators.required],
      expenseCategory: [null, Validators.required],
      description: ['', Validators.required],
      dateOfExpense: [new Date().toISOString().substring(0, 10), Validators.required],
      userId: [1, Validators.required] // Replace with real logged-in user ID
    });
    this.incomeForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(1)]],
      source: [null, Validators.required],
      incomeDate: [null, Validators.required],
      description: ['']
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

    if (this.incomeForm.valid) {
      const payload = {
        ...this.incomeForm.value,
        incomeDate: this.incomeForm.value.incomeDate.toISOString()
      };
      console.log('Income data submitted:', payload);

      // TODO: call REST API service here
      // this.incomeService.saveIncome(payload).subscribe(...)
    } else {
      this.incomeForm.markAllAsTouched();
    }
  }

  get f() {
    return this.incomeForm.controls;
  }

}
