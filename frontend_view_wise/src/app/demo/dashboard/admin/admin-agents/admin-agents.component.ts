import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminAgent, AdminAgentsService} from "../../../../services/adminAgent/admin-agent.service";
import {Router} from "@angular/router";

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
    private fb: FormBuilder, private router: Router
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
    this.api.list().subscribe({
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


  remove(row: AdminAgent): void {
    if (!confirm(`Supprimer "${row.agentName}" ?`)) return;
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
