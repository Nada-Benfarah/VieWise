import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {
  page = 1;
  progressWidth: string = '0%';

  selectedDiscovery: string | null = null;
  selectedRole: string | null = null;
  selectedGoal: string | null = null;
  selectedCompany: string | null = null;

  ngOnInit() {
    this.updateProgress();
  }

  updateProgress() {
    const progressSteps = ['0%', '25%', '50%', '75%', '100%'];
    this.progressWidth = progressSteps[this.page];
  }

  discoveryOptions = [
    'Search engines (Google, Bing, etc.)',
    'Recommendation (friend, colleague)',
    'Another app (e.g. Hubspot Marketplace)',
    'Ads', 'YouTube', 'LinkedIn', 'Online community', 'Other'
  ];

  roleOptions = [
    'Development / Engineering', 'Product / Project Manager', 'Founder / Executive',
    'Marketing / Growth', 'Freelancer / Consultant', 'Support / Operations',
    'Sales / Business Development', 'Data / Analytics', 'Human Resources',
    'Student / Professor', 'Other'
  ];

  goalOptions = [
    'Community Management', 'Databases & CMS', 'Document Management', 'Social Media',
    'CRM & Lead Management', 'Artificial Intelligence (AI)', 'Reporting & Analytics',
    'Spreadsheets & Data Sync', 'E-commerce', 'Project Management',
    'Team Communication', 'Personal Productivity', 'Just Exploring', 'Other'
  ];

  companyOptions = [
    'Only Me', '2 - 10', '11 - 50', '51 - 100', '101 - 200',
    '201 - 500', '501 - 1000', '1001 - 5000', '5001 - 10000', '10000+'
  ];

  next(): void {
    if (this.page < 4) this.page++;
    this.updateProgress();
  }

  prev(): void {
    if (this.page > 1) this.page--;
    this.updateProgress();
  }

  submit(): void {
    alert('Formulaire soumis avec succès !');
  }
}
