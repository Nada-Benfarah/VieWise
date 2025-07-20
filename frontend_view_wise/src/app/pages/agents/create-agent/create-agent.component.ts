import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Agent, AgentService, Link } from '../../../services/agents/agent.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../services/notification/notification.service';

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
    links: [],
    agentName: '',
    agentRole: '',
    agentObjective: '',
    agentInstructions: '',
    datasource: this.defaultDatasource.id,
    modele: this.defaultModel.id,
    etat: 'draft',
    site_web:''


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

  websiteLinks: string[] = [];
  loadingLinks = false;
  errorLoadingLinks = '';
  constructor(private notificationService: NotificationService,private agentService: AgentService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    const state = history.state;
    this.agentId = Number(this.route.snapshot.paramMap.get('id'));
    const isCloning = !!state?.isClone;

    this.isEditMode = !!this.agentId && !isCloning;

    console.log('isCloning:', isCloning);
    console.log('agentId:', this.agentId);
    console.log('isEditMode:', this.isEditMode);

    if (this.agentId) {
      this.agentService.getAgentById(this.agentId).subscribe(agent => {
        if (isCloning) {
          // ✅ Mode clonage
          this.agent = {
            ...agent,
            agentName: agent.agentName + ' (Copie)',
            etat: 'draft',
            creator: null, // sera re-set plus tard
          };
          this.agentId = null; // ID nul pour forcer une création
          this.isEditMode = false;
        } else {
          // ✅ Mode édition
          this.agent = agent;
          this.existingFiles = agent.files || [];
          this.isEditMode = true;
        }

        try {
          this.websiteLinks = agent.links.map(linkObj => linkObj.url?.url || '').filter(Boolean);
          if (agent.links.length > 0) {
            this.agent.site_web = agent.links[0].source_name || '';
          }
        } catch (err) {
          console.error("Erreur lors du traitement des liens :", err);
        }
      });
    }

    const storedUser = localStorage.getItem('current_user');
    if (storedUser && !this.agent.creator) {
      const user = JSON.parse(storedUser);
      this.agent.creator = user.id;
    }

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

    // ✅ Sécuriser creator, utile pour clonage depuis marketplace
    if (!this.agent.creator) {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.agent.creator = user.id;
      } else {
        this.notificationService.error("Utilisateur non identifié. Impossible de créer l'agent.");
        return;
      }
    }

    formData.append('creator', this.agent.creator.toString());
    formData.append('datasource', this.agent.datasource.toString());
    formData.append('modele', this.agent.modele.toString());

    // ✅ Fichiers uploadés
    this.uploadedFiles.forEach(file => {
      formData.append('files', file, file.name);
    });

    // ✅ Traitement des liens du site web
    const validLinks = (this.websiteLinks || [])
      .filter(link => typeof link === 'string' && link.trim().length > 0)
      .map(url => ({ url, description: '', source_name: this.agent.site_web || '' }));

    formData.append('website_links', JSON.stringify(validLinks));
    formData.append('site_web', this.agent.site_web || '');

    // ✅ Création ou mise à jour selon mode
    if (this.isEditMode && this.agentId) {
      this.agentService.updateAgentWithFiles(this.agentId, formData).subscribe({
        next: () => {
          this.notificationService.success('Agent mis à jour avec succès.');
          this.router.navigate(['/agents']);
        },
        error: err => {
          console.error(err);
          this.notificationService.error("Erreur lors de la mise à jour de l'agent.");
        }
      });
    } else {
      this.agentService.createAgentWithFiles(formData).subscribe({
        next: () => {
          this.notificationService.success('Agent créé avec succès.');
          this.router.navigate(['/agents']);
        },
        error: err => {
          console.error(err);
          if (err.status === 403) {
            this.notificationService.error(err.error?.detail || 'Limite d’agent atteinte.');
            this.openUpgradeModal();
          } else {
            this.notificationService.error('Erreur lors de la création de l’agent.');
          }
        }
      });
    }
  }

  showUpgradeModal = false;

  openUpgradeModal() {
    this.showUpgradeModal = true;
  }

  closeUpgradeModal() {
    this.showUpgradeModal = false;
  }

  goToPricingPlans() {
    this.router.navigate(['/pricing-plans']); // adapte selon ta route exacte
  }

  removeExistingFile(fileId: number) {
    if (confirm('Confirmer la suppression de ce fichier ?')) {
      this.agentService.deleteAgentFile(fileId).subscribe({
        next: () => {
          this.existingFiles = this.existingFiles.filter(f => f.id !== fileId);
          this.notificationService.success('Fichier supprimé avec succès.');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du fichier :', err);
          this.notificationService.error("Une erreur est survenue pendant la suppression.");
        }
      });
    }

  }

  fetchWebsiteLinks(): void {
    if (!this.agent.site_web) {
      this.notificationService.warning("Veuillez saisir une URL valide.");
      return;
    }

    const body = { websiteUrl: this.agent.site_web };
    this.agentService.fetchLinksFromWebsite(body).subscribe({
      next: (res: any) => {
        this.websiteLinks = res.links || [];
        this.notificationService.success("Liens récupérés avec succès.");
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des liens', err);
        this.notificationService.error('Impossible de récupérer les liens.');
      }
    });

  }

  removeLink(index: number): void {
    const linkToRemove = this.websiteLinks[index];
    if (confirm(`Confirmer la suppression du lien : ${linkToRemove} ?`)) {
      this.websiteLinks.splice(index, 1);
    }
  }



}
