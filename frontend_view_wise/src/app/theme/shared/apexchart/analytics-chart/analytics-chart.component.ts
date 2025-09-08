// angular import
import { Component, OnInit, viewChild, inject } from '@angular/core';

// third party
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';

// service
import { PlanService } from 'src/app/services/plan/plan.service';

@Component({
  selector: 'app-analytics-chart',
  imports: [NgApexchartsModule],
  templateUrl: './analytics-chart.component.html',
  styleUrl: './analytics-chart.component.scss'
})
export class AnalyticsChartComponent implements OnInit {
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  private plansApi = inject(PlanService);

  constructor() {
    // ✅ on garde EXACTEMENT ta config initiale
    this.chartOptions = {
      chart: {
        type: 'line',
        height: 340,
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        bar: { columnWidth: '45%', borderRadius: 4 }
      },
      colors: ['#FFB814'],
      stroke: { curve: 'smooth', width: 1.5 },
      grid: { strokeDashArray: 4, borderColor: '#f5f5f5' },
      series: [
        { data: [58, 90, 38, 83, 63, 75, 35, 55] } // 👈 sera remplacé
      ],
      xaxis: {
        type: 'datetime', // 👈 on remplacera juste les catégories et le type
        categories: [
          '2018-05-19T00:00:00.000Z',
          '2018-06-19T00:00:00.000Z',
          '2018-07-19T01:30:00.000Z',
          '2018-08-19T02:30:00.000Z',
          '2018-09-19T03:30:00.000Z',
          '2018-10-19T04:30:00.000Z',
          '2018-11-19T05:30:00.000Z',
          '2018-12-19T06:30:00.000Z'
        ],
        labels: {
          format: 'MMM',
          style: { colors: ['#222', '#222', '#222', '#222', '#222', '#222', '#222'] }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: { show: false },
      tooltip: { theme: 'light' }
    };
  }

  ngOnInit(): void {
    this.loadPlanCounts();
  }

  private loadPlanCounts(): void {
    this.plansApi.getPlanUserCounts().subscribe({
      next: (res) => {
        // tri/ordre voulu des plans
        const rank: Record<string, number> = { FREE: 0, PRO: 1, TEAM: 2, BUSINESS: 3 };
        const rows = [...res.plans].sort((a, b) => (rank[a.name] ?? 99) - (rank[b.name] ?? 99));

        const categories = rows.map(r => r.name.toUpperCase());
        const data = rows.map(r => r.count);

        // ✅ on remplace UNIQUEMENT les variables: catégories + data
        this.chartOptions = {
          ...this.chartOptions,
          xaxis: {
            ...(this.chartOptions.xaxis || {}),
            type: 'category',          // passe en catégorie (sinon labels datetime)
            categories,
            labels: {
              ...(this.chartOptions.xaxis?.labels || {}),
              format: undefined        // on enlève le format date
            }
          },
          series: [{ name: 'Utilisateurs', data }]
        };
      },
      error: (err) => console.error('Erreur stats plans', err)
    });
  }
}
