import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Agent, AgentService } from 'src/app/services/agents/agent.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../services/notification/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss'
})
export class AgentsComponent implements OnInit {
  agents: Agent[] = [];
  currentUserId: number | null = null;

  constructor(private authService:AuthService,private router: Router, private agentService: AgentService, private notificationService: NotificationService) {}

  ngOnInit() {
    const storedUser = localStorage.getItem('current_user');

      const user = JSON.parse(storedUser);
      this.currentUserId = user?.id ?? null;
      console.log('📦 ID utilisateur depuis localStorage:', this.currentUserId);
      this.loadAgents();

  }

  loadAgents() {
    this.agents = [];

    this.agentService.getAllAgents().subscribe(allAgents => {
      console.log('aaaaaaaaaaaaaaaaa:', this.currentUserId);

      const mapped = allAgents.map(agent => ({
        ...agent,
        owner: agent.creator === this.currentUserId,
        role: agent.role || (agent.creator === this.currentUserId ? 'Éditeur' : 'Visiteur')
      }));
      this.agents = mapped;
      console.log('xxxxxxx:', this.agents);

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
