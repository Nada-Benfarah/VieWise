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
import {AdminMarketPlaceService} from "../../../services/admin-marketplace/admin-market-place.service";
import { Location as NgLocation } from '@angular/common';
import { StorageService } from 'src/app/services/storage.service';
import { PlanService } from 'src/app/services/plan/plan.service';
import {ConfirmDialogService} from "../../../services/confirm-dialog.service";

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

  addToMarketplace = false;
  isAdminLike = false; // is_superuser || is_staff || is_admin
  marketCategories = ['Commercialisation', 'Entreprise', 'Éducation', 'Général', 'Ventes', 'Ingénierie', 'Légal'];
  market = { category: '', tags: '' };

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
  parentAgentId: number | null = null;
  returnUrl: string | null = null;
  marketplaceEntryId: number | null = null;
  // (optionnel) liste blanche pour éviter les open-redirects
  private readonly allowedReturnUrls = new Set([
    '/agents',
    '/admin/agents',
    '/admin/marketplace',
    '/marketplace',
    '/'
  ]);
  storageUsedBytes = 0;
  storageLimitBytes = 0;
  constructor(private confirm:ConfirmDialogService,private planService: PlanService , private location: NgLocation,private notificationService: NotificationService,private agentService: AgentService, private router: Router, private route: ActivatedRoute, private marketplaceService: AdminMarketPlaceService, private storageService: StorageService) {
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.returnUrl = this.resolveReturnUrl();


    this.addToMarketplace = qp.get('addToMarketplace') === '1' || !!history.state?.addToMarketplace;

    const catFromState = history.state?.market?.category ?? qp.get('category');
    const tagsFromState = history.state?.market?.tags ?? qp.get('tags');
    const mpId = history.state?.marketplaceId ?? qp.get('marketplaceId');

    if (catFromState) this.market.category = catFromState;
    if (tagsFromState) this.market.tags = tagsFromState;
    this.marketplaceEntryId = mpId ? Number(mpId) : null;

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
          this.parentAgentId = state?.parentAgentId || this.agentId;
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
      this.isAdminLike = !!(user?.is_superuser || user?.is_staff || user?.is_admin);

    }

    if (!this.isEditMode) {
      this.agent.agentInstructions = `Vous êtes une IA qui répond à des questions via une base de connaissances.
- Pour chaque message, vous recevrez un contexte de la base de connaissances et un message utilisateur.
- Soyez bref et poli.
- Soyez conversationnel et amical.`;
    }

    this.agentService.getAllDatasources().subscribe(res => this.datasources = res);
    this.agentService.getAllModeles().subscribe(res => this.modeles = res);
    this.planService.currentPlan$.subscribe((plan) => {
      const sizeStr = plan?.data_source_size || null;
      this.storageLimitBytes = this.parseSizeToBytes(sizeStr);
    });
    // valeur initiale (si nécessaire)
    this.planService.refreshCurrentPlan().subscribe();

    // Stockage utilisé (côté serveur) — bytes
    this.storageService.used$.subscribe(u => {
      this.storageUsedBytes = u.bytes || 0;
    });
    this.storageService.refresh().subscribe();
  }

  private resolveReturnUrl(): string | null {
    // 1) query param
    const qp = this.route.snapshot.queryParamMap.get('returnUrl');
    if (qp && this.allowedReturnUrls.has(qp)) return qp;

    // 2) navigation state
    const st = history.state?.returnTo;
    if (st && this.allowedReturnUrls.has(st)) return st;

    // 3) repli: rien de fiable, on laissera Location.back() tenter le retour
    return null;
  }
  get showMarketplaceFields(): boolean {
    return this.addToMarketplace === true || !this.isEditMode && this.addToMarketplace && this.isAdminLike;
  }

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    // Pas de limite ? (plan unlimited)
    const unlimited = this.storageLimitBytes === 0;

    // poids déjà compté (utilisé serveur + fichiers existants de l’agent + fichiers déjà sélectionnés localement)
    const existingBytes = (this.existingFiles || []).reduce((acc, f) => acc + (Number(f.size) || 0), 0);
    const localSelectedBytes = this.uploadedFiles.reduce((acc, f) => acc + (f.size || 0), 0);

    let currentTotal = this.storageUsedBytes + existingBytes + localSelectedBytes;

    const rejected: string[] = [];
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files.item(i)!;
      if (!unlimited && currentTotal + file.size > this.storageLimitBytes) {
        rejected.push(`${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`);
        continue; // refuse ce fichier
      }
      this.uploadedFiles.push(file);
      currentTotal += file.size;
    }

    // Feedback utilisateur
    if (rejected.length) {
      const maxMB = (this.storageLimitBytes / 1024 / 1024).toFixed(2);
      this.notificationService.error(
        `Espace insuffisant. Fichier(s) refusé(s) :\n- ${rejected.join('\n- ')}\n\n` +
        `Limite du plan : ${maxMB} MB`
      );
    }

    // reset input pour permettre de re-sélectionner le même fichier ensuite si besoin
    this.fileInputRef.nativeElement.value = '';
  }




  private redirectBack(): void {
    // Si on a une URL valide → on l'utilise
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }
    // Sinon on tente de revenir dans l'historique
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    // Repli final
    this.router.navigateByUrl('/agents');
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
    if (this.parentAgentId) {
      formData.append('parent_agent', String(this.parentAgentId));
    }

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
          this.storageService.refresh().subscribe();
          this.redirectBack(); // 👈 redirection contextuelle
        },
        error: err => {
          console.error(err);
          this.notificationService.error("Erreur lors de la mise à jour de l'agent.");
        }
      });
      return;
    }
    else {
      this.agentService.createAgentWithFiles(formData).subscribe({
        next: (res: any) => {
          const newAgentId = res?.agent?.agentId ?? res?.agentId;
          if (this.showMarketplaceFields && newAgentId) {
            // Ajout auto au marketplace
            const category = this.market.category || 'Général';
            const tags = this.market.tags || '';
            this.marketplaceService.create({ agent_id: newAgentId, category, tags }).subscribe({
              next: () => {
                this.notificationService.success('Agent créé et ajouté au marketplace.');
                this.storageService.refresh().subscribe();
                this.router.navigate(['/admin/marketplace']);
              },
              error: () => {
                this.notificationService.warning("Agent créé, mais l'ajout au marketplace a échoué.");
                // this.router.navigate(['/agents']);
              }
            });
          } else {
            this.notificationService.success('Agent créé avec succès.');
            this.router.navigate(['/agents']);
          }
        },
        error: (err) => {
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

  async removeExistingFile(fileId: number) {
    const ok = await this.confirm.open({
      title: 'Supprimer le fichier',
      message: `Confirmer la suppression du fichier ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      danger: false
    });

    if (!ok) return;
    this.agentService.deleteAgentFile(fileId).subscribe({
        next: () => {
          this.existingFiles = this.existingFiles.filter(f => f.id !== fileId);
          this.storageService.refresh().subscribe();
          this.notificationService.success('Fichier supprimé avec succès.');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du fichier :', err);
          this.notificationService.error("Une erreur est survenue pendant la suppression.");
        }
      });
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

  async removeLink(index: number) {
    const linkToRemove = this.websiteLinks[index];
    const ok = await this.confirm.open({
      title: 'Supprimer le fichier',
      message: `Confirmer la suppression du lien :  ${linkToRemove} ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      danger: false
    });
    this.websiteLinks.splice(index, 1);

    if (!ok) return;
  }

  private parseSizeToBytes(label: string | null | undefined): number {
    if (!label) return 0;
    const s = String(label).trim().toLowerCase();
    if (['unlimited','illimité','illimite','∞','no_limit','nolimit'].includes(s)) return 0; // 0 = illimité
    const m = s.match(/^(\d+(?:\.\d+)?)\s*(gb|mb|kb|b)$/i);
    if (!m) return 0;
    const val = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    const pow = unit === 'gb' ? 3 : unit === 'mb' ? 2 : unit === 'kb' ? 1 : 0;
    return Math.round(val * Math.pow(1024, pow));
  }


}
