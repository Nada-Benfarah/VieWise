import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '../../services/workflow/workflow.service';
import { NotificationService } from '../../services/notification/notification.service';
import { PlanService } from '../../services/plan/plan.service';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit {
  workflows: any[] = [];
  isBusinessPlan = false;
  hasSharedWorkflows = false;
  constructor(private planService:PlanService,private notificationService:NotificationService,private router: Router, private workflowService: WorkflowService) {
  }

  ngOnInit(): void {
    this.checkAccessPermission();
    this.loadWorkflows();
  }

  loadWorkflows(): void {
    this.workflowService.getMyWorkflows().subscribe({
      next: (data) => this.workflows = data,
      error: () => this.notificationService.error("Erreur lors du chargement des workflows")

    });
  }
  checkAccessPermission(): void {
    this.planService.getCurrentUserPlan().subscribe({
      next: (plan) => {
        this.isBusinessPlan = plan?.name?.toLowerCase() === 'business';

        // Si ce n’est pas un plan business, on vérifie s’il a au moins un workflow partagé
        if (!this.isBusinessPlan) {
          this.workflowService.getAllWorkflows().subscribe((workflows) => {
            const sharedOnly = workflows.filter(wf => !wf.owner); // 👈 basé sur ta logique de rôle
            this.hasSharedWorkflows = sharedOnly.length > 0;
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
    const confirmed = confirm("Êtes-vous sûr de vouloir supprimer ce workflow ?");
    if (!confirmed) return;

    this.workflowService.deleteWorkflow(workflowId).subscribe({
      next: () => {
        this.workflows = this.workflows.filter(wf => wf.workflowId !== workflowId);
        this.notificationService.success("Workflow supprimé avec succès.")
      },
      error: () => {
        this.notificationService.error("Erreur lors de la suppression du workflow.")
      }
    });
  }
}
