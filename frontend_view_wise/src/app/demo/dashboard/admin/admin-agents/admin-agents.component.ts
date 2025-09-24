import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminAgent, AdminAgentsService} from "../../../../services/adminAgent/admin-agent.service";
import {Router} from "@angular/router";
import {ConfirmDialogService} from "../../../../services/confirm-dialog.service";

@Component({
  selector: 'app-admin-agents',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-agents.component.html',
  styleUrls: ['./admin-agents.component.scss']
})
export class AdminAgentsComponent implements OnInit {
  agents: AdminAgent[] = [];
  filtered: AdminAgent[] = [];
  q = '';
  page = 1;
  pageSize = 10;
  loading = false;

  showModal = false;
  isEdit = false;
  current: AdminAgent | null = null;
  form: FormGroup;

  constructor(
    private api: AdminAgentsService,
    private fb: FormBuilder, private router: Router, private confirm:ConfirmDialogService
  ) {
    this.form = this.fb.group({
      agentName: ['', Validators.required],
      agentObjective: [''],
      etat: ['draft']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  get paged(): AdminAgent[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  load(): void {
    this.loading = true;
    this.api.list({ not_in_marketplace: true, all: true }).subscribe({
      next: (rows) => {
        this.agents = rows;
        this.apply();
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  apply(): void {
    const t = this.q.toLowerCase().trim();
    this.filtered = !t
      ? [...this.agents]
      : this.agents.filter(
          (a) =>
            a.agentName?.toLowerCase().includes(t) ||
            (a.agentObjective || '').toLowerCase().includes(t) ||
            (a.creator_email || '').toLowerCase().includes(t)
        );
    this.page = 1;
  }

  editAgent(row: AdminAgent): void {
    if (!row?.agentId) return;

    this.router.navigate(['/create-agent', row.agentId], {
      queryParams: { returnUrl: '/admin/agents' },
      state: { returnTo: '/admin/agents' }
    });
  }


  async remove(row: AdminAgent) {
    const ok = await this.confirm.open({
      title: 'Supprimer l’agent',
      message: `Confirmer la suppression de « ${row.agentName} » ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      danger: false
    });
    if (!ok) return;
    this.api.delete(row.agentId).subscribe({
      next: () => {
        this.agents = this.agents.filter((a) => a.agentId !== row.agentId);
        this.apply();
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
  }

  protected readonly Math = Math;
}
