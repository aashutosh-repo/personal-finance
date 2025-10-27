import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration,registerables,Chart } from 'chart.js';
import { BaseChartDirective  } from 'ng2-charts';

Chart.register(...registerables);

@Component({
  selector: 'app-expense-chart',
  standalone: true,
  imports: [BaseChartDirective,CommonModule, FormsModule ],
  templateUrl: './expense-chart.component.html',
  styleUrls: ['./expense-chart.component.scss']
})
export class ExpenseChartComponent {
  @Input() months: string[] = []; // e.g., ['Jan', 'Feb', ...]
  @Input() income: number[] = []; // monthly income
  @Input() expenses: number[] = []; // monthly expense

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
      position: 'top',
    },
    title: {
      display: true,
      text: 'Monthly Income vs Expense'
    }
  }
};

  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
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

}
