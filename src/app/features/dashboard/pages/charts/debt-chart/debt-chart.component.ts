import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnChanges, OnInit, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables);

@Component({
  selector: 'app-debt-chart',
  standalone: true,
  imports: [BaseChartDirective, CommonModule, FormsModule],
  templateUrl: './debt-chart.component.html',
  styleUrl: './debt-chart.component.scss'
})
export class DebtChartComponent implements OnInit, OnChanges {
  @Input() bankLoan = 0;
  @Input() salaryAdvance = 0;
  @Input() personalDebt = 0;

  chartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: []
  };
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          padding: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(context.parsed || 0))}`
        }
      }
    }
  };
  hasDebtData = false;
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bankLoan'] || changes['salaryAdvance'] || changes['personalDebt']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.isBrowser) {
      return;
    }

    const debtEntries = [
      { label: 'Bank Loan', value: Number(this.bankLoan || 0) },
      { label: 'Salary Advance', value: Number(this.salaryAdvance || 0) },
      { label: 'Personal Debt', value: Number(this.personalDebt || 0) }
    ].filter((item) => item.value > 0);

    if (!debtEntries.length) {
      this.chartData = { labels: [], datasets: [] };
      this.hasDebtData = false;
      return;
    }

    this.hasDebtData = true;
    this.chartData = {
      labels: debtEntries.map((item) => item.label),
      datasets: [
        {
          label: 'Debt Distribution',
          data: debtEntries.map((item) => item.value),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
          borderWidth: 2
        }
      ]
    };
  }
}
