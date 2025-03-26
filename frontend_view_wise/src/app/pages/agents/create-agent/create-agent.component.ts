import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Agent, AgentService } from '../../../services/agents/agent.service';

@Component({
  selector: 'app-create-agent',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgFor,
    NgIf,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './create-agent.component.html',
  styleUrl: './create-agent.component.scss'
})
export class CreateAgentComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  fileNames: string[] = [];

  agent: Agent = {
    agentName: '',
    agentRole: '',
    agentObjective: '',
    agentInstructions: '',
    datasource: 0,
    modele: 0,
    etat: 'draft'
  };

  datasources: any[] = [];
  modeles: any[] = [];
  conversationStarters: string[] = [''];

  constructor(private agentService: AgentService, private router: Router) {}

  ngOnInit(): void {
    this.agentService.getAllDatasources().subscribe((res) => {
      this.datasources = res;
      console.log(this.datasources,"oooo")
    });

    this.agentService.getAllModeles().subscribe((res) => {
      this.modeles = res;
      console.log(this.modeles,"mmmmmm")

    });
  }

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileNames = Array.from(input.files).map((file) => file.name);
    }
  }

  handleInputChange(index: number): void {
    const value = this.conversationStarters[index];
    const hasEmpty = this.conversationStarters.some(v => !v || v.trim() === '');

    if (value && value.trim() !== '' && !hasEmpty) {
      this.conversationStarters.push('');
    }
  }

  removeStarter(index: number): void {
    if (this.conversationStarters.length === 1) return;
    this.conversationStarters.splice(index, 1);
  }

  submitAgent(): void {
    this.agentService.createAgent(this.agent).subscribe({
      next: () => {
        alert('Agent créé avec succès.');
        this.router.navigate(['/agents']);
      },
      error: (err) => {
        console.error(err);
        alert("Erreur lors de la création de l'agent.");
      }
    });
  }
}
