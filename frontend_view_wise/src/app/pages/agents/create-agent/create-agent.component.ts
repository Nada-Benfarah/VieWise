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
import { ActivatedRoute } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';

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

  defaultDatasource = { id: 1, name: 'Base documentaire interne', type: 'local', config: {} };
  defaultModel = { id: 1, name: 'GPT-4 Turbo', description: 'Modèle de génération avancé' };

  agent: Agent = {
    agentName: '',
    agentRole: '',
    agentObjective: '',
    agentInstructions: '',
    datasource: this.defaultDatasource.id,
    modele: this.defaultModel.id,
    etat: 'draft',

  };

  datasources: any[] = [];
  modeles: any[] = [];
  conversationStarters: string[] = [''];
  uploadedFiles: File[] = [];
  isEditMode = false;
  agentId: number | null = null;
  existingFiles: any[] = [];
  toolsAvailable = [
    { category: 'Email', tools: [{ name: 'Add Email', icon: 'fas fa-envelope' }] },
    { category: 'Web', tools: [
        { name: 'Scrape Website', icon: 'fas fa-globe' },
        { name: 'Search News & Blog Articles', icon: 'fas fa-newspaper' },
        { name: 'Web Search', icon: 'fas fa-search' },
      ]},
    { category: 'Calendrier', tools: [
        { name: 'Google Calendar - Create Events', icon: 'fas fa-calendar-plus' },
        { name: 'Google Calendar - Update Events', icon: 'fas fa-calendar-alt' },
      ]},
    { category: 'Réseaux sociaux', tools: [
        { name: 'Facebook Create Post', icon: 'fab fa-facebook' },
        { name: 'Instagram Create Post', icon: 'fab fa-instagram' },
        { name: 'Instagram Read Comments', icon: 'fas fa-comments' },
      ]}
  ];
  websiteUrl: string = '';
  websiteLinks: string[] = [];
  constructor(private agentService: AgentService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.agentId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.agentId;

    if (this.isEditMode) {
      this.agentService.getAgentById(this.agentId!).subscribe(agent => {
        this.agent = {
          ...agent,
          datasource: agent.datasource, // ou agent.datasource.id
          modele: agent.modele,         // ou agent.modele.id
        };
        this.existingFiles = (agent as any).files || [];

      });
    }

    const storedUser = localStorage.getItem('current_user');
    if (storedUser && !this.isEditMode) {
      const user = JSON.parse(storedUser);
      this.agent.creator = user.id;
    }

    // Instructions par défaut si création
    if (!this.isEditMode) {
      this.agent.agentInstructions = `Vous êtes une IA qui répond à des questions via une base de connaissances.

- Pour chaque message, vous recevrez un contexte de la base de connaissances et un message utilisateur.
- Soyez bref et poli.
- Soyez conversationnel et amical.`;
    }

    this.agentService.getAllDatasources().subscribe(res => this.datasources = res);
    this.agentService.getAllModeles().subscribe(res => this.modeles = res);
  }


  triggerFileInput(): void {
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files.item(i);
        if (file) {
          this.uploadedFiles.push(file);
        }
      }
    }
  }

  removeFile(fileToRemove: File): void {
    this.uploadedFiles = this.uploadedFiles.filter(file => file !== fileToRemove);
  }

  submitAgent(): void {
    const formData = new FormData();
    formData.append('agentName', this.agent.agentName);
    formData.append('agentRole', this.agent.agentRole);
    formData.append('agentObjective', this.agent.agentObjective);
    formData.append('agentInstructions', this.agent.agentInstructions);
    formData.append('etat', this.agent.etat);
    formData.append('creator', this.agent.creator.toString());
    formData.append('datasource', this.agent.datasource.toString());
    formData.append('modele', this.agent.modele.toString());
    formData.append('website_links', JSON.stringify(this.websiteLinks));


    this.uploadedFiles.forEach(file => {
      formData.append('files', file, file.name);
    });

    if (this.isEditMode && this.agentId) {
      this.agentService.updateAgentWithFiles(this.agentId, formData).subscribe({
        next: () => {
          alert('Agent mis à jour avec succès.');
          this.router.navigate(['/agents']);
        },
        error: err => {
          console.error(err);
          alert("Erreur lors de la mise à jour de l'agent.");
        }
      });
    } else {
      this.agentService.createAgentWithFiles(formData).subscribe({
        next: () => {
          alert('Agent et fichiers créés avec succès.');
          this.router.navigate(['/agents']);
        },
        error: err => {
          console.error(err);
          alert("Erreur lors de la création de l'agent.");
        }
      });
    }
  }

  removeExistingFile(fileId: number) {
    if (confirm('Confirmer la suppression de ce fichier ?')) {
      this.agentService.deleteAgentFile(fileId).subscribe({
        next: () => {
          this.existingFiles = this.existingFiles.filter(f => f.id !== fileId);
          alert('Fichier supprimé avec succès.');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du fichier :', err);
          alert("Une erreur est survenue pendant la suppression.");
        }
      });
    }
  }

  fetchWebsiteLinks(): void {
    if (!this.websiteUrl) {
      alert("Veuillez saisir une URL valide.");
      return;
    }

    const body = { websiteUrl: this.websiteUrl }; // ✅ on envoie bien 'websiteUrl'

    this.agentService.fetchLinksFromWebsite(body).subscribe({
      next: (res: any) => {
        this.websiteLinks = res.links; // ✅ 'links' récupéré correctement
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des liens', err);
        alert('Impossible de récupérer les liens.');
      }
    });
  }

  removeLink(index: number): void {
    this.websiteLinks.splice(index, 1);
  }


}
