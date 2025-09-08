import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {PlanService, UserPlan} from 'src/app/services/plan/plan.service';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { NotificationService } from '../../services/notification/notification.service';
import {PaymeeService} from "../../services/paymee/paymee.service";

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
  isRedirecting = false;

  constructor(private planService: PlanService,  private toastService: NotificationService, private paymee: PaymeeService ) {}


  ngOnInit(): void {
    // 1) S'abonner au plan courant (met à jour la vue)
    this.planService.currentPlan$.subscribe((plan: UserPlan | null) => {
      this.currentPlanName = plan?.name?.toUpperCase() || 'FREE';
    });

    // 2) Charger la valeur initiale (si non déjà appelée ailleurs)
    this.planService.refreshCurrentPlan().subscribe();
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

    this.isRedirecting = true;

    this.paymee.initCheckout(this.selectedPlanToUpgrade as any).subscribe({
      next: (res) => {
        // Ferme le modal avant de quitter la page (UX)
        this.showConfirmationModal = false;

        // Redirection vers le checkout Paymee
        window.location.href = res.redirect_url;
      },
      error: (err) => {
        console.error('Init checkout failed:', err);
        this.isRedirecting = false;
        this.toastService.error(`Erreur lors de l’initialisation du paiement`);
      }
    });
  }



  getSelectedPlanFeatures(): string[] {
    return this.availablePlans.find((p) => p.name === this.selectedPlanToUpgrade)?.features || [];
  }
}
