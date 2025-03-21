import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';



@Component({
  selector: 'app-agents',
  imports: [CommonModule, MatButtonModule],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss'
})
export class AgentsComponent {
  activeMenu: number | null = null;

  constructor(private router: Router) {}


  agents = [
    { name: 'Agent Builder', description: 'Un agent IA pour construire des projets complexes.' },
    { name: 'Agent Assistant', description: 'Un assistant IA pour la gestion des tâches quotidiennes.' },
    { name: 'Agent Analytique', description: 'Un agent IA pour l\'analyse de données et les rapports.' },
    { name: 'Agent Vocal', description: 'Un agent IA pour la génération de contenu créatif.' }
  ];

  toggleMenu(index: number) {
    this.activeMenu = this.activeMenu === index ? null : index;
  }

  editAgent(agent: any) {
    console.log('Modifier :', agent.name);
  }

  chatAgent(agent: any) {
    this.router.navigate(['/chatgpt-page']);
  }

  deleteAgent(agent: any) {
    console.log('Supprimer :', agent.name);
  }

  goToCreateAgent() {
    this.router.navigate(['/create-agent']);
  }
}
