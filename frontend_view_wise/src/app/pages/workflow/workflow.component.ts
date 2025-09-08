import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '../../services/workflow/workflow.service';
import { NotificationService } from '../../services/notification/notification.service';
import { PlanService } from '../../services/plan/plan.service';
import {WorflowEditorComponent} from "./worflow-editor/worflow-editor.component";

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule, WorflowEditorComponent],
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit {
  workflows: any[] = [];
  selectedWorkflow: any = null;
  showWorkflowModal = false;
  showDetailsModal = false;
  isBusinessPlan = false;
  hasSharedWorkflows = false;
  currentUserId: number | null = null;
  isAdmin: any;

  constructor(
    private planService: PlanService,
    private notificationService: NotificationService,
    private router: Router,
    private workflowService: WorkflowService
  ) {}

  private loadCurrentUser(): void {
    try {
      const storedUser = localStorage.getItem('current_user');
      if (!storedUser) {
        this.currentUserId = null;
        return;
      }
      const user = JSON.parse(storedUser);
      this.currentUserId = user?.id ?? null;
      this.isAdmin = user?.is_admin ?? false;
      console.log('📦 ID utilisateur depuis localStorage:', this.currentUserId);
    } catch {
      this.currentUserId = null;
    }
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.checkAccessPermission();
    this.loadWorkflows();
  }

  loadWorkflows(): void {
    this.workflows = [];
    this.workflowService.getMyWorkflows().subscribe({
      next: (data) => {
        this.workflows = (data || []).map((wf) => {
          const ownerFromApi = (wf as any).owner;
          const creatorFromApi = (wf as any).creator;
          const computedOwner =
            typeof ownerFromApi === 'boolean'
              ? ownerFromApi
              : creatorFromApi != null && this.currentUserId != null
                ? creatorFromApi === this.currentUserId
                : false;

          const role: any = (wf as any).role ?? (computedOwner ? 'Éditeur' : 'Visiteur');

          return { ...wf, owner: computedOwner, role };
        });
      },
      error: () => this.notificationService.error('Erreur lors du chargement des workflows')
    });
  }

  checkAccessPermission(): void {
    this.planService.getCurrentUserPlan().subscribe({
      next: (plan) => {
        this.isBusinessPlan = (plan?.name ?? '').toLowerCase() === 'business';

        if (!this.isBusinessPlan) {
          this.workflowService.getMyWorkflows().subscribe((workflows) => {
            const hasShared = (workflows || []).some((wf) => {
              const ownerFromApi = (wf as any).owner;
              const creatorFromApi = (wf as any).creator;

              const owner =
                typeof ownerFromApi === 'boolean'
                  ? ownerFromApi
                  : creatorFromApi != null && this.currentUserId != null
                    ? creatorFromApi === this.currentUserId
                    : false;

              return !owner;
            });
            this.hasSharedWorkflows = hasShared;
          });
        }
      },
      error: () => {
        this.isBusinessPlan = false;
        this.hasSharedWorkflows = false;
      }
    });
  }

  goToCreateWorkflow(): void {
    this.router.navigate(['/workflow/editor']);
  }

  openWorkflowEditor(workflow: any): void {
    this.router.navigate(['/workflow/editor'], {
      state: { loadedWorkflow: workflow }
    });
  }

  deleteWorkflow(workflowId: number): void {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?');
    if (!confirmed) return;

    this.workflowService.deleteWorkflow(workflowId).subscribe({
      next: () => {
        this.workflows = this.workflows.filter((wf) => wf.workflowId !== workflowId);
        this.notificationService.success('Workflow supprimé avec succès.');
      },
      error: () => {
        this.notificationService.error('Erreur lors de la suppression du workflow.');
      }
    });
  }

  openDetails(workflow: any): void {
    console.log('🧩 Chargement du workflow :', workflow);

    this.workflowService.getWorkflowById(workflow.workflowId).subscribe({
      next: (res) => {
        this.selectedWorkflow = res;
        this.showDetailsModal = true;
      },
      error: () => {
        console.error('❌ Ce workflow est introuvable.');
        this.notificationService.error('Erreur lors du chargement du workflow');
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedWorkflow = null;
  }

  closeWorkflowModal(): void {
    this.showWorkflowModal = false;
    this.selectedWorkflow = null;
  }

  viewWorkflow(workflow: any): void {
    console.log('🧩 Chargement du workflow :', workflow);

    this.workflowService.getWorkflowById(workflow.workflowId).subscribe({
      next: (res) => {
        this.selectedWorkflow = res;
        this.showWorkflowModal = true;
      },
      error: () => {
        console.error('❌ Ce workflow est introuvable.');
        this.notificationService.error('Erreur lors du chargement du workflow');
      }
    });
  }

  openInChat(workflow: any) {
    this.router.navigate(['/chatgpt-page']);
  }
}
