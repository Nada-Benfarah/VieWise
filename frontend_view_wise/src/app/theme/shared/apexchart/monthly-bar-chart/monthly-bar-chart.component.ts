// src/app/components/monthly-bar-chart/monthly-bar-chart.component.ts
import { Component, OnInit, viewChild, inject } from '@angular/core';
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';
import { AdminAgentsService, AgentCloneStat } from 'src/app/services/adminAgent/admin-agent.service';
import { WorkflowService, WorkflowCloneStat } from 'src/app/services/workflow/workflow.service';
import {MarketplaceService} from "../../../../services/marketplace/marketplace.service";

type ViewMode = 'agents' | 'workflows';

@Component({
  selector: 'app-monthly-bar-chart',
  imports: [NgApexchartsModule],
  templateUrl: './monthly-bar-chart.component.html',
  styleUrl: './monthly-bar-chart.component.scss'
})
export class MonthlyBarChartComponent implements OnInit {
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  private agentsApi = inject(AdminAgentsService);
  private workflowsApi = inject(WorkflowService);
  private marketApi = inject(MarketplaceService);


  currentView: ViewMode = 'agents';
  agentStats: { name: string; count: number }[] = [];
  workflowStats: { name: string; count: number }[] = [];
  topN = 10;
  private marketplaceAgentIds = new Set<number>();

  ngOnInit() {
    // toggle par défaut
    document.querySelector('.chart-income.agents')?.classList.add('active');
    document.querySelector('.chart-income.workflows')?.classList.remove('active');

    // base du chart
    this.chartOptions = {
      chart: { height: 450, type: 'bar', toolbar: { show: false }, background: 'transparent' },
      dataLabels: { enabled: false },
      colors: ['rgba(145,29,220,0.76)'],
      series: [{ name: 'Clonages', data: [] }],
      stroke: { width: 2 },
      xaxis: { categories: [], labels: { rotate: -45, style: { colors: '#8c8c8c' } }, axisBorder: { show: true, color: '#f0f0f0' } },
      yaxis: {
        min: 1,
        max: 10,
        tickAmount: 10,
        title: { text: 'Nombre de clones' },
        labels: {
          style: { colors: ['#8c8c8c'] },
          formatter: (val: number) => `${Math.round(val)}`
        }
      },      grid: { strokeDashArray: 0, borderColor: '#f5f5f5' },
      theme: { mode: 'light' },
      tooltip: { theme: 'light' }
    };

    // charger stats
    this.loadMarketplaceAgentIds().then(() => this.loadStats());
  }

  private async loadMarketplaceAgentIds(): Promise<void> {
    return new Promise((resolve) => {
      this.marketApi.getMarketplaceAgents().subscribe({
        next: (rows: any[]) => {
          // rows[i].agent.agentId doit exister (voir serializer ci-dessus)
          rows.forEach(r => {
            const id = Number(r?.agent?.agentId);
            if (Number.isInteger(id)) this.marketplaceAgentIds.add(id);
          });
          resolve();
        },
        error: () => resolve()
      });
    });
  }
  private loadStats() {
    // Agents
    this.agentsApi.getCloneStats().subscribe({
      next: (rows: AgentCloneStat[]) => {
        this.agentStats = rows
          // 👇 ne garder que ceux du marketplace
          .filter(r => this.marketplaceAgentIds.has(r.agentId))
          .map(r => ({ id: r.agentId, name: r.agentName, count: r.clone_count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, this.topN);
        if (this.currentView === 'agents') this.renderCurrent();
      }
    });

    // Workflows
    this.workflowsApi.getCloneStats().subscribe({
      next: (rows: WorkflowCloneStat[]) => {
        this.workflowStats = rows
          .map(r => ({ name: r.workflowName, count: r.clone_count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, this.topN);
        if (this.currentView === 'workflows') this.renderCurrent();
      }
    });
  }

  toggleView(view: ViewMode) {
    this.currentView = view;
    this.renderCurrent();

    if (view === 'agents') {
      document.querySelector('.chart-income.agents')?.classList.add('active');
      document.querySelector('.chart-income.workflows')?.classList.remove('active');
    } else {
      document.querySelector('.chart-income.workflows')?.classList.add('active');
      document.querySelector('.chart-income.agents')?.classList.remove('active');
    }
  }

  private renderCurrent() {
    const data = this.currentView === 'agents' ? this.agentStats : this.workflowStats;
    const categories = data.map(d => d.name);
    const seriesData = data.map(d => d.count);

    this.chartOptions = {
      ...this.chartOptions,
      xaxis: { ...(this.chartOptions.xaxis || {}), categories },
      series: [{ name: 'Clonages', data: seriesData }]
    };
  }
}
