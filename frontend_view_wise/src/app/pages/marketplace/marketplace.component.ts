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
import {HttpClient, HttpHeaders} from "@angular/common/http";



export interface WebhookUI {
  run_label?: string;
  success_toast?: string;
}

type WebhookInput = { name:string; label:string; type:'string'|'email'|'number'|'url'|'textarea'; required?:boolean };
type WebhookPayload = {
  type:'webhook'; method:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';
  endpoint:string; headers?:Record<string,string>;
  inputs:WebhookInput[]; example_curl?:string;
  ui?:{ run_label?:string; success_toast?:string };
  values?:Record<string,any>;
};



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

  webhookModal = {
    open: false,
    agentId: null as number | null,
    agentName: '' as string,
    payload: null as WebhookPayload | null,
    form: {} as Record<string, any>,
    submitting: false
  };

  activeTab: 'overview' | 'instructions' | 'guide' = 'overview';
  instructionsExpanded = false;

  constructor(
    private router: Router,  private http: HttpClient,
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
    this.activeTab = 'overview';
    this.instructionsExpanded = false;
    this.showAgentModal = true;
  }

  closeAgentModal(): void {
    this.showAgentModal = false;
    this.selectedAgent = null;
  }

  toggleInstructions() {
    this.instructionsExpanded = !this.instructionsExpanded;
  }

  copyInstructions() {
    const txt = this.selectedAgent?.agentInstructions || '';
    navigator.clipboard.writeText(txt).then(
      () => this.notificationService?.success?.('Instructions copiées'),
      () => this.notificationService?.error?.('Copie impossible')
    );
  }

  downloadInstructions() {
    const txt = this.selectedAgent?.agentInstructions || '';
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${this.selectedAgent?.agentName || 'instructions'}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  get selectedAgentGuide(): any | null {
    const links = (this.selectedAgent as any)?.links || [];
    const guide = Array.isArray(links)
      ? links.find((l: any) => l?.source_name === 'guide' && l?.url?.type === 'guide')
      : null;
    return guide?.url || null; // {type,title,steps,notes,...}
  }

// steps peut être string ou tableau; normalisation simple
  normalizeGuideSteps(steps: any): string[] {
    if (!steps) return [];
    if (Array.isArray(steps)) return steps.map(s => (s == null ? '' : String(s)));
    return String(steps).split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
  }

// rendu HTML simple et sûr (retours à la ligne -> <br>)
  asHtml(s: string) {
    const escaped = s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const withBr = escaped.replace(/\n/g, '<br>');
    // Si vous voulez autoriser un sous-ensemble basique (liens), adaptez ici.
    return withBr;
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

  private findWebhookLink(agent: Agent) {
    const links = (agent as any)?.links || [];
    return Array.isArray(links)
      ? links.find((l: any) => l?.source_name === 'webhook' && l?.url?.type === 'webhook')
      : null;
  }

  webhookInputModal = {
    open: false,
    agent: null as Agent | null,
    linkIndex: -1,
    payload: null as WebhookPayload | null,
    form: {} as Record<string, any>,
    saving: false
  };

  openWebhookInputsFor(agent: Agent) {
    const link = this.findWebhookLink(agent);
    if (!link) return;

    const payload: WebhookPayload = link.url;
    const form: Record<string, any> = {};
    for (const inp of payload.inputs || []) {
      form[inp.name] = payload.values?.[inp.name] ?? ''; // préremplir si existant
    }

    this.webhookInputModal = {
      open: true,
      agent,
      linkIndex: (agent as any).links.indexOf(link),
      payload,
      form,
      saving: false
    };
  }

  closeWebhookInputs() {
    this.webhookInputModal.open = false;
    this.webhookInputModal.agent = null;
    this.webhookInputModal.payload = null;
    this.webhookInputModal.form = {};
    this.webhookInputModal.linkIndex = -1;
  }

  canSaveInputs(): boolean {
    const p = this.webhookInputModal.payload;
    if (!p) return false;
    return (p.inputs || []).every(i => !i.required || !!this.webhookInputModal.form[i.name]);
  }

  saveWebhookInputs() {
    const modal = this.webhookInputModal;
    if (!modal.agent || !modal.payload) return;

    // fusion locale
    const nextPayload = { ...modal.payload, values: { ...modal.form } };
    const nextLinks = [...((modal.agent as any).links || [])];
    const idx = modal.linkIndex;
    if (idx >= 0) nextLinks[idx] = { ...nextLinks[idx], source_name: 'webhook', url: nextPayload };
    else nextLinks.push({ source_name: 'webhook', url: nextPayload });

    this.agentService.updateLinks(modal.agent.agentId!, nextLinks).subscribe({
      next: () => {
        this.notificationService.success('Paramètres enregistrés. Exécute l’agent depuis Mes agents.');
        this.closeWebhookInputs();
        this.router.navigate(['/agents']);
      },
      error: () => {
        modal.saving = false;
        this.notificationService.error('Échec de l’enregistrement des paramètres.');
      }
    });
  }



  cloneAgent(item: MarketplaceAgent): void {
    const agentId = item?.agent?.agentId;
    if (!agentId) { this.notificationService.error("Agent introuvable"); return; }

    this.agentService.cloneAgent(agentId).subscribe({
      next: (clone: Agent) => {
        // re-fetch pour obtenir links
        this.agentService.getAgentById(clone.agentId!).subscribe({
          next: (fresh) => {
            const hook = this.findWebhookLink(fresh);
            if (hook) {
              this.openWebhookInputsFor(fresh); // ouvre la modale de saisie
            } else {
              this.notificationService.success(`Agent cloné : ${fresh.agentName}`);
              this.router.navigate(['/agents']);
            }
          },
          error: () => {
            this.notificationService.success(`Agent cloné : ${clone.agentName}`);
            this.router.navigate(['/agents']);
          }
        });
      },
      error: (err) => {
        if (err?.status === 403) {
          this.notificationService.error(err?.error?.error || "Plan insuffisant");
        } else {
          this.notificationService.error("Échec du clonage");
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

  closeWebhookModal() {
    this.webhookModal.open = false;
    this.webhookModal.payload = null;
    this.webhookModal.form = {};
  }

  canRunWebhook(): boolean {
    const p = this.webhookModal.payload;
    if (!p) return false;
    return (p.inputs || []).every(i => !i.required || !!this.webhookModal.form[i.name]);
  }

  runWebhook() {
    const p = this.webhookModal.payload;
    if (!p) return;

    const headers = new HttpHeaders(p.headers || { 'Content-Type': 'application/json' });
    const endpoint = p.endpoint;
    const method = (p.method || 'POST').toUpperCase();

    if (!this.canRunWebhook()) {
      this.notificationService.error("Champs requis manquants");
      return;
    }

    const body = { ...this.webhookModal.form };

    this.webhookModal.submitting = true;

    let req$;
    switch (method) {
      case 'GET':
        req$ = this.http.get(endpoint, { headers, params: body as any });
        break;
      case 'POST':
        req$ = this.http.post(endpoint, body, { headers });
        break;
      case 'PUT':
        req$ = this.http.put(endpoint, body, { headers });
        break;
      case 'PATCH':
        req$ = this.http.patch(endpoint, body, { headers });
        break;
      case 'DELETE':
        req$ = this.http.request('DELETE', endpoint, { headers, body });
        break;
      default:
        this.notificationService.error(`Méthode non supportée ${method}`);
        this.webhookModal.submitting = false;
        return;
    }

    req$.subscribe({
      next: () => {
        const toast = p.ui?.success_toast || 'Exécution lancée';
        this.notificationService.success(toast);
        this.webhookModal.submitting = false;
        // garder la modale ouverte pour relancer facilement
      },
      error: () => {
        this.notificationService.error("Échec de l’exécution");
        this.webhookModal.submitting = false;
      }
    });
  }
}
