import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Agent, AgentService } from 'src/app/services/agents/agent.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss'
})
export class AgentsComponent implements OnInit {
  agents: Agent[] = [];

  constructor(private router: Router, private agentService: AgentService, private notificationService: NotificationService) {}

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
        this.notificationService.error('Impossible de charger les agents.');
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
          this.notificationService.success(`Agent "${agent.agentName}" supprimé avec succès.`);
        },
        error: (err) => {
          console.error('Erreur suppression :', err);
          this.notificationService.error(`Erreur lors de la suppression de l'agent "${agent.agentName}".`);
        }
      });
    }
  }


  goToCreateAgent() {
    this.router.navigate(['/create-agent']);
  }
}
