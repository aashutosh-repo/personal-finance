import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration,registerables,Chart } from 'chart.js';
import { BaseChartDirective  } from 'ng2-charts';
import { AuthService } from '../../../../../service/auth/auth.service';
import { TransactionService } from '../../../../../service/tansaction/transaction.service';

Chart.register(...registerables);

@Component({
  selector: 'app-expense-chart',
  standalone: true,
  imports: [BaseChartDirective,CommonModule, FormsModule ],
  templateUrl: './expense-chart.component.html',
  styleUrls: ['./expense-chart.component.scss']
})
export class ExpenseChartComponent implements OnInit{
  @Input() months: string[] = []; // e.g., ['Jan', 'Feb', ...]
  @Input() income: number[] = []; // monthly income
  @Input() expenses: number[] = []; // monthly expense

  

  isBrowser: boolean;
  totalIncome:number=0;
  totalExpenses:number=0;
  totalInvestment:number=0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private txService: TransactionService,) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }      
    const userId = this.authService.getCurrentUserID();
    if(userId) {
      this.txService.calculateTotals(userId).subscribe(totals => {
        this.totalExpenses = totals.totalExpense;
        this.totalInvestment = totals.totalInvestment;
        this.totalIncome = totals.totalDebt;
      });
    }
    
        if (this.isBrowser) {
      // Dummy data if none provided
      const months = this.months.length ? this.months : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun','July','Aug','Sep','Oct','Nov','Dec'];
      const income = this.income.length ? this.income : [10000, 12000, 8000, 15000, 11000, 13000];
      const expenses = this.expenses.length ? this.expenses : [5000, 7000, 3000, 4500, 6000, 8000];

      this.chartConfig = {
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: income,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
          },
          {
            label: 'Expenses',
            data: expenses,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
          }
        ]
      };
    }
  }

  chartConfig: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };


  chartOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        autoSkip: false,  // ✅ Disable skipping
        maxRotation: 0,   // ✅ Prevent angled labels
        minRotation: 0,
        font: {
          size: 12
        }
      },
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        font: {
          size: 12
        }
      }
    }
  },
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'Monthly Income vs Expense',
      font: { size: 12 }
    },
    tooltip: {
      enabled: true
    },
  }
};

getTotalExpense(arr: number[]): number {
  return this.totalExpenses;
}




  customLegendPlugin = {
  id: 'customLegendPlugin',
  afterDraw: (chart: any) => {
    const { ctx, chartArea: { top, left, right } } = chart;

    // Define legend positions and styles
    const legendY = top-20; ;
    const boxSize = 12;
    const fontSize = 13;
    const padding = 6;

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textBaseline = 'middle';

    // 🔹 Income legend (Top-left)
    ctx.fillStyle = 'rgba(75, 192, 192, 0.9)';
    ctx.fillRect(left + 10, legendY - boxSize / 2, boxSize, boxSize);
    ctx.fillStyle = '#333';
    ctx.fillText('Income', left + 10 + boxSize + padding, legendY);

    // 🔹 Expense legend (Top-right)
    const expenseLabel = 'Expense';
    const expenseTextWidth = ctx.measureText(expenseLabel).width;
    const expenseX = right - expenseTextWidth - boxSize - padding - 10;

    ctx.fillStyle = 'rgba(255, 99, 132, 0.9)';
    ctx.fillRect(expenseX, legendY - boxSize / 2, boxSize, boxSize);
    ctx.fillStyle = '#333';
    ctx.fillText(expenseLabel, expenseX + boxSize + padding, legendY);

    ctx.restore();
  }
};

}
