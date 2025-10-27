import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { BaseChartDirective  } from 'ng2-charts';


Chart.register(...registerables);


@Component({
  selector: 'app-debt-chart',
  standalone: true,
  imports: [BaseChartDirective,CommonModule, FormsModule],
  templateUrl: './debt-chart.component.html',
  styleUrl: './debt-chart.component.scss'
})
export class DebtChartComponent {

  @Input() bankLoan: number = 0;
  @Input() salaryAdvance: number = 0;
  @Input() personalDebt: number = 0;

  chartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: []
  };

  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Default dummy data if no input provided
      const bankLoan = this.bankLoan || 50000;
      const salaryAdvance = this.salaryAdvance || 20000;
      const personalDebt = this.personalDebt || 15000;

      this.chartData = {
        labels: ['Bank Loan', 'Salary Advance', 'Personal Debt'],
        datasets: [
          {
            label: 'Debt Distribution',
            data: [bankLoan, salaryAdvance, personalDebt],
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)'
            ],
            borderColor: ['white', 'white', 'white'],
            borderWidth: 2
          }
        ]
      };
    }
  }

}
