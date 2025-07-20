import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PlanService } from 'src/app/services/plan/plan.service';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { NotificationService } from '../../services/notification/notification.service';

interface PlanFeatures {
  name: string;
  features: string[];
}


@Component({
  selector: 'app-pricing-plans',
  templateUrl: './pricing-plans.component.html',
  imports: [NgClass, NgIf, NgForOf],
  styleUrls: ['./pricing-plans.component.scss']
})
export class PricingPlansComponent implements OnInit {
  @Input() isModal: boolean = false;
  @Output() planSelected = new EventEmitter<any>();
  currentPlanName: string = ''; // Ex: 'FREE', 'PRO', etc.

  planRanks: Record<string, number> = {
    FREE: 0,
    PRO: 1,
    TEAM: 2,
    BUSINESS: 3
  };
  selectedPlanToUpgrade: string | null = null;
  showConfirmationModal: boolean = false;
  availablePlans: PlanFeatures[] = [
    {
      name: 'FREE',
      features: ['100 credits', '1 user', '1 agent', '10MB of Knowledge']
    },
    {
      name: 'PRO',
      features: ['20,000 credits/month', '3 users', '1 agent', '3 tools', '100MB of Knowledge', 'Live-chat support']
    },
    {
      name: 'TEAM',
      features: [
        '100,000 credits/month',
        '10 users',
        '5 agents',
        'Unlimited tools',
        'Schedule tasks',
        '1GB of Knowledge',
        'Premium integrations'
      ]
    },
    {
      name: 'BUSINESS',
      features: [
        '300,000 credits/month',
        'Unlimited users',
        'Multi-agent system',
        'Unlimited tools',
        'Schedule tasks',
        '5GB of Knowledge',
        'Premium integrations',
        'Voice agent'
      ]
    }
  ];

  constructor(private planService: PlanService,  private toastService: NotificationService) {}

  ngOnInit(): void {
    this.planService.getCurrentUserPlan().subscribe({
      next: (plan) => {
        this.currentPlanName = plan.name?.toUpperCase();
        // this.currentPlanName = 'TEAM';
        // Assure majuscule
      },
      error: (err) => console.error('Erreur récupération plan', err)
    });
  }

  isCurrentOrLower(planName: string): boolean {
    return this.planRanks[planName] <= this.planRanks[this.currentPlanName];
  }

  isCurrent(planName: string): boolean {
    return this.currentPlanName === planName;
  }

  getPlanClass(planName: string): string {
    if (this.isCurrent(planName)) {
      return 'current-plan';
    } else if (this.planRanks[planName] < this.planRanks[this.currentPlanName]) {
      return 'previous-plan';
    } else {
      return 'upgrade-plan';
    }
  }
  onUpgrade(planName: string): void {
    this.planService.upgradePlan(planName).subscribe({
      next: (res) => {
        console.log(res.message);
        this.currentPlanName = planName;
      },
      error: (err) => console.error('Upgrade failed:', err)
    });
  }
  confirmUpgrade(planName: string): void {
    this.selectedPlanToUpgrade = planName;
    this.showConfirmationModal = true;
  }

  cancelUpgrade(): void {
    this.selectedPlanToUpgrade = null;
    this.showConfirmationModal = false;
  }

  proceedUpgrade(): void {
    if (!this.selectedPlanToUpgrade) return;

    this.planService.upgradePlan(this.selectedPlanToUpgrade).subscribe({
      next: (res) => {
        this.currentPlanName = this.selectedPlanToUpgrade!;
        this.toastService.success(`Vous êtes maintenant abonné au plan ${this.currentPlanName} !`);

        this.planSelected.emit(this.currentPlanName); // ✅ Émission ici

        this.selectedPlanToUpgrade = null;
        this.showConfirmationModal = false;
      },
      error: (err) => {
        console.error('Upgrade failed:', err);
        this.toastService.error(`Erreur lors de l’abonnement`);
        this.showConfirmationModal = false;
      }
    });
  }

  getSelectedPlanFeatures(): string[] {
    return this.availablePlans.find((p) => p.name === this.selectedPlanToUpgrade)?.features || [];
  }
}
