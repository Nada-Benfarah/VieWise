// angular import
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import tableData from 'src/fake-data/default-data.json';

import { MonthlyBarChartComponent } from 'src/app/theme/shared/apexchart/monthly-bar-chart/monthly-bar-chart.component';
import { IncomeOverviewChartComponent } from 'src/app/theme/shared/apexchart/income-overview-chart/income-overview-chart.component';
import { AnalyticsChartComponent } from 'src/app/theme/shared/apexchart/analytics-chart/analytics-chart.component';
import { SalesReportChartComponent } from 'src/app/theme/shared/apexchart/sales-report-chart/sales-report-chart.component';

// icons
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { FallOutline, GiftOutline, MessageOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { AuthService } from 'src/app/services/auth.service';
import { AdminUsersService, AdminUser } from 'src/app/services/admin/admin-user.service';

// Add your AuthService for authentication state (if applicable)

@Component({
  selector: 'app-default',
  imports: [
    CommonModule,
    CardComponent,
    MonthlyBarChartComponent,
    AnalyticsChartComponent,
  ],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements OnInit {
  private iconService = inject(IconService);
  private authService = inject(AuthService); // Inject AuthService
  private adminUsersService = inject(AdminUsersService);

  // constructor
  constructor() {
    this.iconService.addIcon(...[RiseOutline, FallOutline, SettingOutline, GiftOutline, MessageOutline]);
  }

  // Initialize any required data or state
  ngOnInit() {
    this.loadingStats = true;
    this.adminUsersService.list().subscribe({
      next: (users) => {
        this.users = users;
        this.activeCount = users.filter(u => u.is_active).length;
        this.blockedCount = users.filter(u => !u.is_active).length;
        // Répartition par plan (si le champ existe)
        this.planStats = {};
        users.forEach(u => {
          // Remplace 'plan' par le vrai nom du champ si besoin
          const plan = (u as any).plan || 'Inconnu';
          this.planStats[plan] = (this.planStats[plan] || 0) + 1;
        });
        this.loadingStats = false;
      },
      error: () => { this.loadingStats = false; }
    });
  }

  // Example of a trackBy function for ngFor
  trackByFn(index: number, item: any): number {
    return item.id || index;
  }

  recentOrder = tableData;

  AnalyticEcommerce = [
    {
      title: 'Total Page Views',
      amount: '4,42,236',
      background: 'bg-light-primary',
      border: 'border-primary',
      icon: 'rise',
      percentage: '59.3%',
      color: 'text-primary',
      number: '35,000'
    },
    {
      title: 'Total Users',
      amount: '78,250',
      background: 'bg-light-primary',
      border: 'border-primary',
      icon: 'rise',
      percentage: '70.5%',
      color: 'text-primary',
      number: '8,900'
    },
    {
      title: 'Total Order',
      amount: '18,800',
      background: 'bg-light-warning',
      border: 'border-warning',
      icon: 'fall',
      percentage: '27.4%',
      color: 'text-warning',
      number: '1,943'
    },
    {
      title: 'Total Sales',
      amount: '$35,078',
      background: 'bg-light-warning',
      border: 'border-warning',
      icon: 'fall',
      percentage: '27.4%',
      color: 'text-warning',
      number: '$20,395'
    }
  ];

  transaction = [
    {
      background: 'text-success bg-light-success',
      icon: 'gift',
      title: 'Order #002434',
      time: 'Today, 2:00 AM',
      amount: '+ $1,430',
      percentage: '78%'
    },
    {
      background: 'text-primary bg-light-primary',
      icon: 'message',
      title: 'Order #984947',
      time: '5 August, 1:45 PM',
      amount: '- $302',
      percentage: '8%'
    },
    {
      background: 'text-danger bg-light-danger',
      icon: 'setting',
      title: 'Order #988784',
      time: '7 hours ago',
      amount: '- $682',
      percentage: '16%'
    }
  ];

  users: AdminUser[] = [];
  activeCount = 0;
  blockedCount = 0;
  planStats: { [plan: string]: number } = {};
  loadingStats = true;

  // Add a method to check if the user is logged in
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn(); // Adjust based on your AuthService implementation
  }
}
