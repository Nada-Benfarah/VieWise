import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '../../services/workflow/workflow.service';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit {
  workflows: any[] = [];

  constructor(private notificationService:NotificationService,private router: Router, private workflowService: WorkflowService) {
  }

  ngOnInit(): void {
    this.loadWorkflows();
  }

  loadWorkflows(): void {
    this.workflowService.getMyWorkflows().subscribe({
      next: (data) => this.workflows = data,
      error: () => this.notificationService.error("Erreur lors du chargement des workflows")

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
