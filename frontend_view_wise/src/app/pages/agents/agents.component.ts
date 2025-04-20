import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Agent, AgentService } from 'src/app/services/agents/agent.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss'
})
export class AgentsComponent implements OnInit {
  agents: Agent[] = [];

  constructor(private router: Router, private agentService: AgentService) {}

  ngOnInit() {
    this.loadAgents();
  }

  loadAgents() {
    this.agentService.getAllAgents().subscribe({
      next: (data) => {
        this.agents = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des agents :', err);
      }
    });
  }



  editAgent(agent: Agent) {
    this.router.navigate(['/create-agent', agent.agentId]);
  }

  chatAgent(agent: Agent) {
    this.router.navigate(['/chatgpt-page']);
  }

  deleteAgent(agent: Agent) {
    if (confirm(`Confirmer la suppression de "${agent.agentName}" ?`)) {
      this.agentService.deleteAgent(agent.agentId).subscribe({
        next: () => {
          this.agents = this.agents.filter(a => a.agentId !== agent.agentId);
        },
        error: (err) => {
          console.error('Erreur suppression :', err);
        }
      });
    }
  }

  goToCreateAgent() {
    this.router.navigate(['/create-agent']);
  }
}
