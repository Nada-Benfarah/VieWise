// income-overview-chart.component.ts
import { Component, OnInit, viewChild, inject } from '@angular/core';
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { PlanService } from 'src/app/services/plan/plan.service';

@Component({
  selector: 'app-income-overview-chart',
  imports: [CardComponent, NgApexchartsModule],
  templateUrl: './income-overview-chart.component.html',
  styleUrl: './income-overview-chart.component.scss'
})
export class IncomeOverviewChartComponent implements OnInit {
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;
  private plansApi = inject(PlanService);

  ngOnInit() {

    // charge les données réelles
    this.plansApi.getPlanUserCounts().subscribe({
      next: (res) => {
        // Option : fixer l’ordre FREE, PRO, TEAM, BUSINESS si présents
        const order = ['FREE', 'PRO', 'TEAM', 'BUSINESS'];
        const sorted = [...res.plans].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

        this.chartOptions = {
          ...this.chartOptions,
          xaxis: { ...(this.chartOptions.xaxis || {}), categories: sorted.map(p => p.name) },
          series: [{ name: 'Utilisateurs', data: sorted.map(p => p.count) }]
        };
      }
    });
    this.chartOptions = {
      chart: { type: 'bar', height: 365, toolbar: { show: false }, background: 'transparent' },
      plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      series: [{ data: [] }],
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: ['#8c8c8c'] } }
      },
      // 👇 valeurs entières seulement sur l’axe Y
      yaxis: {
        show: true,
        min: 0,
        forceNiceScale: true,
        labels: {
          formatter: (val: number) => `${Math.round(val)}`,
          style: { colors: ['#8c8c8c'] }
        },
        title: { text: 'Utilisateurs' }
      },
      colors: ['#5cdbd3'],
      grid: { show: true, borderColor: '#f0f0f0' },
      tooltip: { theme: 'light', y: { formatter: (v: number) => `${Math.round(v)}` } }
    };

    // charge les données réelles
    this.plansApi.getPlanUserCounts().subscribe({
      next: (res) => {
        // Option : fixer l’ordre FREE, PRO, TEAM, BUSINESS si présents
        const order = ['FREE', 'PRO', 'TEAM', 'BUSINESS'];
        const sorted = [...res.plans].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

        this.chartOptions = {
          ...this.chartOptions,
          xaxis: { ...(this.chartOptions.xaxis || {}), categories: sorted.map(p => p.name) },
          series: [{ name: 'Utilisateurs', data: sorted.map(p => p.count) }]
        };
      }
    });
  }
}
