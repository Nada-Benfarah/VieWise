// src/app/demo/dashboard/admin/admin-marketplace/admin-marketplace.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgentService } from 'src/app/services/agents/agent.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import {
  AdminMarketplaceRow,
  AdminMarketPlaceService,
  AdminMarketplaceWorkflowRow
} from '../../../../services/admin-marketplace/admin-market-place.service';
import {ActivatedRoute, Router} from "@angular/router";
import {WorflowEditorComponent} from "../../../../pages/workflow/worflow-editor/worflow-editor.component";
import {WorkflowService} from "../../../../services/workflow/workflow.service";
import {AdminAgent} from "../../../../services/adminAgent/admin-agent.service";

interface AgentMini {
  agentId: number;
  agentName: string;
  agentObjective?: string;
}
type ViewMode = 'agents' | 'workflows';

@Component({
  selector: 'app-admin-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, WorflowEditorComponent],
  templateUrl: './admin-marketplace.component.html',
  styleUrls: ['./admin-marketplace.component.scss']
})
export class AdminMarketplaceComponent implements OnInit {
  rows: AdminMarketplaceRow[] = [];
  filtered: AdminMarketplaceRow[] = [];
  page = 1;
  pageSize = 10;
  q = '';
  loading = false;

  showModal = false;
  isEdit = false;
  current: AdminMarketplaceRow | null = null;

  form: FormGroup;
  categories = ['Commercialisation', 'Entreprise', 'Éducation', 'Général', 'Ventes', 'Ingénierie', 'Légal'];

  // Sélecteur d’agent pour création
  agentsAll: AgentMini[] = [];
  agentsAvailable: AgentMini[] = [];

  wfRows: AdminMarketplaceWorkflowRow[] = [];
  wfFiltered: AdminMarketplaceWorkflowRow[] = [];
  showWorkflowModal = false;
  selectedWorkflow: any = null;
  view: ViewMode = 'agents'; // 👈 toggle
  showInUseModal = false;
  inUseAgentName = '';
  inUseWorkflows: { id: number; workflowId: number; workflowName: string; category: string; tags?: string }[] = [];
  constructor(
    private api: AdminMarketPlaceService,
    private agentApi: AgentService,
    private fb: FormBuilder,
    private notify: NotificationService,
    private router: Router,
    private route: ActivatedRoute,private workflowService: WorkflowService
) {
    this.form = this.fb.group({
      agent_id: [null, [Validators.required]], // utilisé seulement en création
      category: ['', [Validators.required]],
      tags: ['']
    });
  }

  ngOnInit(): void {
    this.load();
    this.loadWorkflows();
    const viewParam = (this.route.snapshot.queryParamMap.get('view') || '').toLowerCase();
    if (viewParam === 'workflows' || viewParam === 'agents') {
      this.view = viewParam as ViewMode;
    }
    this.route.queryParamMap.subscribe((qp) => {
      const v = (qp.get('view') || '').toLowerCase();
      if (v === 'workflows' || v === 'agents') this.view = v as ViewMode;
    });
  }

  get pagedAgents() {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get pagedWorkflows() {
    const start = (this.page - 1) * this.pageSize;
    return this.wfFiltered.slice(start, start + this.pageSize);
  }

  load() {
    this.loading = true;
    this.api.list().subscribe({
      next: (rows) => {
        this.rows = rows;
        this.apply();
        this.loading = false;
        this.loadAgentsAvailable();
      },
      error: () => (this.loading = false)
    });
  }

  loadWorkflows() {
    this.api.listWorkflows().subscribe({
      next: (rows) => {
        this.wfRows = rows;
        this.apply(); // réapplique le filtre courant
      }
    });
  }


  loadAgentsAvailable() {
    this.agentApi.getAllAgents().subscribe((agents) => {
      // On filtre les agents qui ont un agentId défini
      const usedIds = new Set(this.rows.map((r) => r.agent.agentId));
      this.agentsAll = (agents || [])
        .filter((a) => !!a.agentId)
        .map((a) => ({
          agentId: a.agentId!,
          agentName: a.agentName,
          agentObjective: a.agentObjective
        }));
      this.agentsAvailable = this.agentsAll.filter((a) => !usedIds.has(a.agentId));
    });
  }

  apply() {
    const t = this.q.toLowerCase().trim();

    this.filtered = !t
      ? [...this.rows]
      : this.rows.filter(
          (r) =>
            r.category.toLowerCase().includes(t) ||
            (r.tags || '').toLowerCase().includes(t) ||
            (r.agent?.agentName || '').toLowerCase().includes(t) ||
            (r.agent?.agentObjective || '').toLowerCase().includes(t)
        );

    this.wfFiltered = !t
      ? [...this.wfRows]
      : this.wfRows.filter(
          (r) =>
            r.category.toLowerCase().includes(t) ||
            (r.tags || '').toLowerCase().includes(t) ||
            (r.workflow?.workflowName || '').toLowerCase().includes(t) ||
            (r.workflow?.description || '').toLowerCase().includes(t)
        );

    this.page = 1;
  }

  changeView(v: ViewMode) {
    this.view = v;
    this.page = 1;
  }

  // actions delete pour workflows
  removeWorkflow(row: AdminMarketplaceWorkflowRow) {
    if (!confirm(`Supprimer l’entrée pour "${row.workflow.workflowName}" ?`)) return;
    this.api.deleteWorkflow(row.id).subscribe({
      next: () => {
        this.wfRows = this.wfRows.filter((r) => r.id !== row.id);
        this.apply();
        this.notify.success('Entrée workflow marketplace supprimée.');
      },
      error: () => this.notify.error('Suppression impossible.')
    });
  }

  openCreate() {
    this.router.navigate(['create-agent'], { queryParams: { addToMarketplace: 1 } });
  }
  openCreateWorkflow() {
    this.router.navigate(['workflow/editor'], { queryParams: { addToMarketplace: 1 } });
  }


  save() {
    if (this.form.invalid) return;

    const payload = this.form.getRawValue();
    if (this.isEdit && this.current) {
      const data = { category: payload.category, tags: payload.tags };
      this.api.update(this.current.id, data).subscribe({
        next: (upd) => {
          const i = this.rows.findIndex((r) => r.id === upd.id);
          if (i > -1) this.rows[i] = upd;
          this.apply();
          this.showModal = false;
          this.notify.success('Entrée marketplace mise à jour.');
        },
        error: () => this.notify.error('Échec de mise à jour.')
      });
    } else {
      // création
      this.api.create(payload).subscribe({
        next: (created) => {
          this.rows.unshift(created);
          this.apply();
          this.loadAgentsAvailable();
          this.showModal = false;
          this.notify.success('Entrée marketplace créée.');
        },
        error: () => this.notify.error('Échec de création.')
      });
    }
  }


  closeModal() {
    this.showModal = false;
  }


  viewWorkflow(row: AdminMarketplaceWorkflowRow): void {
    const wfId = row?.workflow?.workflowId;
    if (!wfId) {
      console.warn('❌ Impossible d’afficher : workflowId manquant.');
      return;
    }

    this.workflowService.getPublicWorkflow(wfId).subscribe({
      next: (res) => {
        this.selectedWorkflow = res;
        this.showWorkflowModal = true;
      },
      error: () => {
        console.error('❌ Ce workflow est introuvable ou privé.');
      }
    });
  }

  closeWorkflowModal(): void {
    this.showWorkflowModal = false;
    this.selectedWorkflow = null;
  }

  private deepClone<T>(obj: T): T {
    return obj == null ? (obj as T) : JSON.parse(JSON.stringify(obj));
  }

// admin-marketplace.component.ts (ajoutez ceci dans la classe)
  editWorkflow(row: AdminMarketplaceWorkflowRow): void {
    const wfId = row?.workflow?.workflowId;
    if (!wfId) {
      this.notify.error('Impossible d’éditer : workflowId manquant.');
      return;
    }

    this.workflowService.getPublicWorkflow(wfId).subscribe({
      next: (full: any) => {
        this.router.navigate(['/workflow/editor'], {
          state: { loadedWorkflow: full },       // 👈 pas d’isClone → mode édition
          queryParams: { edit: 1 }               // (optionnel) indicateur d’édition
        });
      },
      error: () => {
        this.notify.error('Chargement du workflow impossible.');
        console.error('❌ getPublicWorkflow a échoué pour', wfId);
      }
    });
  }

  editAgent(row: any): void {
    if (!row?.agent) return;

    this.router.navigate(['/create-agent', row.agent.agentId], {
      queryParams: {
        returnUrl: '/admin/marketplace',
        addToMarketplace: 1,
        category: row.category,
        tags: row.tags || '',
        marketplaceId: row.id
      },
      state: {
        returnTo: '/admin/marketplace',
        addToMarketplace: true,
        market: { category: row.category, tags: row.tags || '' },
        marketplaceId: row.id
      }
    });
  }

  remove(row: AdminMarketplaceRow) {
    // 1) confirmation
    if (!confirm(`Supprimer l’entrée pour "${row.agent.agentName}" ?`)) return;

    // 2) pré-vérification d’usage
    this.api.checkAgentUsage(row.agent.agentId).subscribe({
      next: (usage) => {
        if (usage.in_use) {
          // ➜ afficher modale d’alerte
          this.inUseAgentName = row.agent.agentName;
          this.inUseWorkflows = usage.workflows || [];
          this.showInUseModal = true;
          return;
        }
        // 3) pas utilisé → suppression directe
        this.confirmDeleteMarketplaceAgent(row);
      },
      error: () => {
        // En cas d’erreur de vérif, on tente quand même la suppression
        this.confirmDeleteMarketplaceAgent(row);
      }
    });
  }

  private confirmDeleteMarketplaceAgent(row: AdminMarketplaceRow) {
    this.api.delete(row.id).subscribe({
      next: () => {
        this.rows = this.rows.filter((r) => r.id !== row.id);
        this.apply();
        this.loadAgentsAvailable();
        this.notify.success('Entrée supprimée.');
      },
      error: (err) => {
        if (err?.status === 409 && err?.error?.error === 'AGENT_IN_USE') {
          // Sécurité côté serveur : retombe aussi ici si quelqu’un bypass la pré-vérif
          this.inUseAgentName = row.agent.agentName;
          this.inUseWorkflows = err.error.workflows || [];
          this.showInUseModal = true;
          return;
        }
        this.notify.error('Suppression impossible.');
      }
    });
  }

  onCloseInUseModal() {
    this.showInUseModal = false;
    this.inUseWorkflows = [];
    this.inUseAgentName = '';
  }

  gotoWorkflowsTab() {
    this.view = 'workflows';
    this.onCloseInUseModal();
  }



  get f() {
    return this.form;
  }
  protected readonly Math = Math;
}
