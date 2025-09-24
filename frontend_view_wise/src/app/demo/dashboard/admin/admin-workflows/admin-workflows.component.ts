import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminWorkflow, AdminWorkflowsService} from "../../../../services/adminWorkflows/admin-workflow.service";
import {Router} from "@angular/router";
import {WorkflowService} from "../../../../services/workflow/workflow.service";
import { NotificationService } from '../../../../services/notification/notification.service';
import {WorflowEditorComponent} from "../../../../pages/workflow/worflow-editor/worflow-editor.component";
import {ConfirmDialogService} from "../../../../services/confirm-dialog.service";

@Component({
  selector: 'app-admin-workflows',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, WorflowEditorComponent],
  templateUrl: './admin-workflows.component.html',
  styleUrls: ['./admin-workflows.component.scss']
})
export class AdminWorkflowsComponent implements OnInit {
  rows: AdminWorkflow[] = [];
  filtered: AdminWorkflow[] = [];
  q = '';
  loading = false;
  page = 1;
  pageSize = 10;

  selectedWorkflow: AdminWorkflow | null = null;
  showWorkflowModal = false;
  showDetailsModal = false;
  isEdit = false;
  current: AdminWorkflow | null = null;

  form: FormGroup;

  constructor(
    private api: AdminWorkflowsService,
    private fb: FormBuilder,
    private router: Router,
    private workflowService: WorkflowService,
    private notificationService: NotificationService, private confirm: ConfirmDialogService
  ) {
    this.form = this.fb.group({
      workflowName: ['', Validators.required],
      description: [''],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.load();
  }

  get paged(): AdminWorkflow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  load(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (rows) => {
        this.rows = rows;
        this.apply();
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  apply(): void {
    const t = this.q.toLowerCase().trim();
    this.filtered = !t
      ? [...this.rows]
      : this.rows.filter((w) => w.workflowName?.toLowerCase().includes(t) || (w.description || '').toLowerCase().includes(t));
    this.page = 1;
  }

  editWorkflow(row: AdminWorkflow): void {
    const wfId = row?.workflowId;
    if (!wfId) {
      console.warn('❌ Impossible d’éditer : workflowId manquant.');
      return;
    }

    this.workflowService.getWorkflowById(wfId).subscribe({
      next: (full: any) => {
        this.router.navigate(['/workflow/editor'], {
          state: { loadedWorkflow: full }, // 👈 pas d’isClone → mode édition
          queryParams: { edit: 1 } // (optionnel)
        });
      },
      error: () => {
        console.error('❌ Chargement du workflow impossible :', wfId);
      }
    });
  }

  async remove(row: AdminWorkflow) {
    const ok = await this.confirm.open({
      title: 'Supprimer le workflow',
      message: `Supprimer le workflow « ${row.workflowName} » ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      danger: false
    });
    if (!ok) return;
    this.api.delete(row.workflowId).subscribe({
      next: () => {
        this.rows = this.rows.filter((r) => r.workflowId !== row.workflowId);
        this.apply();
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

  viewWorkflow(workflow: AdminWorkflow): void {
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

  protected readonly Math = Math;
}
