import { Component, OnInit } from '@angular/core';
import { MarketplaceAgent, MarketplaceService } from '../../services/marketplace/marketplace.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '../../services/workflow/workflow.service';
import {Agent, AgentService} from '../../services/agents/agent.service';
import { Router } from '@angular/router';
import { WorflowEditorComponent } from '../workflow/worflow-editor/worflow-editor.component';
import { PlanService } from 'src/app/services/plan/plan.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import {StorageService} from "../../services/storage.service";

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, WorflowEditorComponent],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss']
})
export class MarketplaceComponent implements OnInit {
  agents: MarketplaceAgent[] = [];
  filteredAgents: MarketplaceAgent[] = [];
  workflows: any[] = [];
  filteredWorkflows: any[] = [];
  showUpgradeModal = false;

  searchTerm: string = '';
  selectedCategory: string = 'Tous';
  viewMode: 'agents' | 'workflows' = 'agents'; // ✅ Nouveau
  selectedAgent: Agent | null = null;
  showAgentModal: boolean = false;
  selectedWorkflow: any = null;
  showWorkflowModal = false;
  isBusinessPlan: boolean;

  constructor(
    private router: Router,
    private marketplaceService: MarketplaceService,
    private workflowService: WorkflowService,  private planService: PlanService, private notificationService: NotificationService,  private agentService: AgentService, private storageService: StorageService
  ) {
  }

  ngOnInit(): void {
    this.checkPlan();
    this.loadAgents();
    this.loadWorkflows();
  }
  checkPlan(): void {
    this.planService.getCurrentUserPlan().subscribe({
      next: (plan) => {
        this.isBusinessPlan = plan?.name?.toLowerCase() === 'business';
        if (!this.isBusinessPlan && this.viewMode === 'workflows') {
          this.viewMode = 'agents'; // Rediriger à l'onglet Agents
        }
      },
      error: () => {
        this.isBusinessPlan = false;
      }
    });
  }

  loadAgents(): void {
    this.marketplaceService.getMarketplaceAgents().subscribe((agents) => {
      this.agents = agents;
      this.filteredAgents = agents;
    });
  }

  loadWorkflows(): void {
    this.marketplaceService.getMarketplaceWorkflows().subscribe({
      next: (rows) => {
        // rows: MarketplaceWorkflowEntry[]
        this.workflows = rows.map(r => r.workflow);        // 👈 ne garder que le sous-objet workflow
        this.filteredWorkflows = this.workflows;
        this.applyFilters();                                // (optionnel) réappliquer le filtre courant
      },
      error: () => {
        this.workflows = [];
        this.filteredWorkflows = [];
      }
    });
  }


  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  changeViewMode(mode: 'agents' | 'workflows'): void {
    this.viewMode = mode;
    this.applyFilters();
  }

  private applyFilters(): void {
    const lowerSearch = this.searchTerm.toLowerCase();

    if (this.viewMode === 'agents') {
      this.filteredAgents = this.agents.filter((market) => {
        const matchCat = this.selectedCategory === 'Tous' || market.category === this.selectedCategory;
        const matchSearch =
          market.agent.agentName.toLowerCase().includes(lowerSearch) || market.agent.agentObjective.toLowerCase().includes(lowerSearch);
        return matchCat && matchSearch;
      });
    } else {
      this.filteredWorkflows = this.workflows.filter(
        (wf) => wf.workflowName.toLowerCase().includes(lowerSearch) || wf.description.toLowerCase().includes(lowerSearch)
      );
    }
  }

  openAgentDetails(agent: Agent): void {
    this.selectedAgent = agent;
    this.showAgentModal = true;
  }

  closeAgentModal(): void {
    this.showAgentModal = false;
    this.selectedAgent = null;
  }



  viewWorkflow(wf: any): void {
    console.log("🧩 Chargement du workflow public :", wf);

    this.workflowService.getPublicWorkflow(wf.workflowId).subscribe({
      next: (res) => {
        this.selectedWorkflow = res;
        this.showWorkflowModal = true;
      },
      error: () => {
        console.error("❌ Ce workflow est introuvable ou privé.");
      }
    });
  }

  closeWorkflowModal(): void {
    this.showWorkflowModal = false;
    this.selectedWorkflow = null;
  }
  private deepClone<T>(obj: T): T {
    // Suffisant pour objets JSON (nodes/relations/tools/agents/trigger)
    return obj == null ? obj as T : JSON.parse(JSON.stringify(obj));
  }



  openUpgradeModal() {
    this.showUpgradeModal = true;
  }

  closeUpgradeModal() {
    this.showUpgradeModal = false;
  }

  goToPricingPlans() {
    this.router.navigate(['/pricing-plans']); // adapte si nécessaire
  }

  cloneAgent(item: MarketplaceAgent): void {
    const agentId = item?.agent?.agentId;
    if (!agentId) {
      this.notificationService.error("Impossible de cloner : agentId manquant.");
      return;
    }

    this.agentService.cloneAgent(agentId).subscribe({
      next: (clone: any) => {
        this.notificationService.success(`Agent cloné : ${clone?.agentName || 'Copie'}`);
        this.storageService.refresh().subscribe();
        this.router.navigate(['/agents']); // “Mes agents”
      },
      error: (err) => {
        if (err?.status === 403) {
          this.notificationService.error(err?.error?.error || "Votre plan n'autorise pas cette action.");
        } else {
          this.notificationService.error("Échec du clonage de l'agent.");
        }
      }
    });
  }

  // ✅ Remplacement : clonage serveur pour WORKFLOW
  cloneWorkflow(wf: any): void {
    if (!this.isBusinessPlan) { this.openUpgradeModal(); return; }
    const workflowId = wf?.workflowId;
    if (!workflowId) {
      this.notificationService.error("Impossible de cloner : workflowId manquant.");
      return;
    }

    this.workflowService.cloneWorkflow(workflowId).subscribe({
      next: (clone: any) => {
        this.notificationService.success(`Workflow cloné : ${clone?.workflowName || 'Copie'}`);
        this.router.navigate(['/workflow']); // “Mes workflows”
      },
      error: (err) => {
        if (err?.status === 403) {
          this.notificationService.error(err?.error?.error || "Fonctionnalité réservée au plan Business.");
          this.openUpgradeModal();
        } else {
          this.notificationService.error("Échec du clonage du workflow.");
        }
      }
    });
  }


}
