import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent {
  // ✅ propriétés nécessaires pour éviter les erreurs HTML
  workflows: any[] = []; // vide par défaut, à peupler dynamiquement si besoin
  isModalOpen: boolean = false;
  jobDescription: string = '';
  workflowName: string = '';

  constructor(private router: Router) {}

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.jobDescription = '';
    this.workflowName = '';
  }

  generateWithAI(): void {
    if (!this.workflowName.trim() || !this.jobDescription.trim()) {
      alert('Veuillez remplir le nom et la description.');
      return;
    }

    console.log('Nom du workflow :', this.workflowName);
    console.log('Description :', this.jobDescription);

    this.router.navigate(['/workflow/editor'],{
      state: {
        name: this.workflowName,
        description: this.jobDescription
      }
    });
  }
}
