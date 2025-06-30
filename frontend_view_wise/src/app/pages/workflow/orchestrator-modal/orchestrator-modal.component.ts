import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgForOf } from '@angular/common';
import { Agent } from '../../../services/agents/agent.service';


@Component({
  selector: 'app-orchestrator-modal',
  standalone: true,
  imports: [FormsModule, NgIf, NgForOf],
  templateUrl: './orchestrator-modal.component.html',
  styleUrls: ['./orchestrator-modal.component.scss']
})
export class OrchestratorModalComponent {
  @Input() mode: 'orchestrator' | 'optimizer' | 'loop' | 'subflow' | 'agent' = 'orchestrator';
  @Input() availableAgents: Agent[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() saveData = new EventEmitter<any>();
  @Input() availableWorkflows: any[] = [];
  searchWorkflowTerm: string = '';
  filteredWorkflows: any[] = [];
  selectedWorkflow: any | null = null;
  // Champs communs
  title: string = '';

  // Pour orchestrator et optimizer
  items: string[] = [''];

  // Pour loop
  task: string = '';
  variable: string = '';
  collection: string = '';

  // Pour subflow
  selectedWorkflowId: string = '';
  workflows: string[] = ['Workflow A', 'Workflow B', 'Workflow C'];
  error: string | null = null;

  // Pour agent
  selectedAgentId: number | null = null;
  searchTerm: string = '';
  dropdownOpen: boolean = false;
  selectedAgent: Agent | null = null;
  ngOnInit(): void {
    this.filteredWorkflows = this.availableWorkflows;

  }
  ngOnChanges(): void {
    this.filteredWorkflows = this.availableWorkflows;
  }
  onWorkflowSearch(term: string): void {
    this.searchWorkflowTerm = term;
    const lowerTerm = term.toLowerCase();
    this.filteredWorkflows = this.availableWorkflows.filter(wf =>
      wf.workflowName.toLowerCase().includes(lowerTerm)
    );
  }

  selectWorkflow(wf: any): void {
    this.selectedWorkflow = wf;
    this.searchWorkflowTerm = wf.workflowName;
    this.dropdownOpen = false;
  }


  get filteredAgents(): Agent[] {
    const term = this.searchTerm.toLowerCase().trim();
    return term
      ? this.availableAgents.filter(agent =>
        agent.agentName.toLowerCase().includes(term)
      )
      : this.availableAgents;
  }

  selectAgent(agent: Agent): void {
    this.selectedAgent = agent;
    this.selectedAgentId = agent.agentId;
    this.searchTerm = agent.agentName;
    this.dropdownOpen = false;
  }



  loadWorkflows(): void {
    try {
      this.workflows = ['Workflow A', 'Workflow B'];
      this.error = null;
    } catch (e) {
      this.error = 'Erreur lors du chargement des workflows.';
    }
  }

  addItem(): void {
    this.items.push('');
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  updateItem(index: number, value: string): void {
    this.items = this.items.map((item, i) => i === index ? value : item);
  }

  trackByIndex(index: number): number {
    return index;
  }

  save(): void {
    switch (this.mode) {
      case 'orchestrator':
      case 'optimizer':
        this.saveData.emit({
          title: this.title.trim(),
          items: this.items.filter(i => i.trim() !== '')
        });
        break;

      case 'loop':
        this.saveData.emit({
          title: this.title.trim(),
          task: this.task.trim(),
          variable: this.variable.trim(),
          collection: this.collection.trim()
        });
        break;

      case 'subflow':
        if (this.selectedWorkflow) {
          this.saveData.emit({
            title: this.selectedWorkflow.workflowName,
            selectedWorkflowId: this.selectedWorkflow.workflowId,
            embeddedWorkflow: this.selectedWorkflow // 🧠 utile pour ajout auto
          });
        }
        break;

      case 'agent':
        const agent = this.availableAgents.find(a => a.agentId === this.selectedAgentId);
        if (agent) {
          this.saveData.emit({
            agentId: agent.agentId,
            label: agent.agentName
          });
        }
        break;
    }

    this.close.emit();
  }

  closeModal(): void {
    this.close.emit();
  }
}
