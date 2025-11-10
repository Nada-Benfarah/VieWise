import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Agent, AgentService } from 'src/app/services/agents/agent.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../services/notification/notification.service';
import { AuthService } from '../../services/auth.service';
import {StorageService} from "../../services/storage.service";
import {ConfirmDialogService} from "../../services/confirm-dialog.service";
import {environment} from "../../../environments/environment";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {FormsModule} from "@angular/forms";
import { HostListener } from '@angular/core';



type WebhookInput = { name:string; label:string; type:'string'|'email'|'number'|'url'|'textarea'; required?:boolean };
type WebhookPayload = {
  type:'webhook'; method:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';
  endpoint:string; headers?:Record<string,string>;
  inputs:WebhookInput[]; example_curl?:string;
  ui?:{ run_label?:string; success_toast?:string };
  values?:Record<string,any>;
};


@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, MatButtonModule, FormsModule],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss'
})
export class AgentsComponent implements OnInit {
  agents: Agent[] = [];
  currentUserId: number | null = null;

  constructor(
    private http: HttpClient,
    private confirm: ConfirmDialogService,
    private authService: AuthService,
    private router: Router,
    private agentService: AgentService,
    private notificationService: NotificationService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    const storedUser = localStorage.getItem('current_user');

    const user = JSON.parse(storedUser);
    this.currentUserId = user?.id ?? null;
    console.log('📦 ID utilisateur depuis localStorage:', this.currentUserId);
    this.loadAgents();
  }

  loadAgents() {
    this.agentService.getMyAgents().subscribe((allAgents) => {
      this.agents = allAgents.map((a) => ({
        ...a,
        agentId: Number(a.agentId),
        owner: a.creator === this.currentUserId,
        role: a.role || (a.creator === this.currentUserId ? 'Éditeur' : 'Visiteur')
      }));
    });
  }

  hasTemplate(agent: Agent): boolean {
    return Array.isArray(agent.files) && agent.files.length > 0;
  }

  // retourne le premier .json si présent, sinon le premier fichier
  firstTemplate(agent: Agent) {
    if (!this.hasTemplate(agent)) return null;
    const json = agent.files!.find((f) => f.name?.toLowerCase().endsWith('.json'));
    return json || agent.files![0];
  }

  getGuide(agent: Agent) {
    return (agent.links || []).find((l) => l.source_name === 'guide' && l.url);
  }



  toMediaUrl(u?: string): string {
    if (!u) return '';
    return u.startsWith('/media/') ? `${environment.apiBaseUrl}${u}` : u;
  }

  // agents.component.ts
  download(agent: Agent) {
    if (!agent.agentId) return;
    this.agentService.downloadTemplate(agent.agentId).subscribe({
      next: (resp) => {
        const blob = resp.body as Blob;
        // récupérer le nom proposé par le backend si présent
        const cd = resp.headers.get('content-disposition') || '';
        const m = /filename\*=UTF-8''([^;]+)|filename="?([^\";]+)"?/i.exec(cd);
        const headerName = decodeURIComponent((m?.[1] || m?.[2] || '').trim());
        const fallback = this.firstTemplate(agent)?.name || agent.agentName.replace(/\s+/g, '_') + '.json';
        const filename = headerName || fallback;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.error('Template indisponible.')
    });
  }

  editAgent(agent: Agent) {
    this.router.navigate(['/create-agent', agent.agentId]);
  }

  chatAgent(agent: Agent) {
    this.router.navigate(['/chatgpt-page']);
  }

  async deleteAgent(agent: Agent) {
    const ok = await this.confirm.open({
      title: 'Supprimer l’agent',
      message: `Confirmer la suppression de « ${agent.agentName} » ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      danger: false
    });

    if (!ok) return;
    this.agentService.deleteAgent(agent.agentId).subscribe({
      next: () => {
        this.agents = this.agents.filter((a) => a.agentId !== agent.agentId);
        this.storageService.refresh().subscribe();
        this.notificationService.success(`Agent "${agent.agentName}" supprimé avec succès.`);
      },
      error: (err) => {
        console.error('Erreur suppression :', err);
        this.notificationService.error(`Erreur lors de la suppression de l'agent "${agent.agentName}".`);
      }
    });
  }

  goToCreateAgent() {
    this.router.navigate(['/create-agent']);
  }

  private parseWebhookPayload(raw: any): WebhookPayload | null {
    if (!raw) return null;
    if (typeof raw === 'string') {
      try { const obj = JSON.parse(raw); return (obj?.type === 'webhook') ? obj : null; }
      catch { return null; }
    }
    return raw?.type === 'webhook' ? (raw as WebhookPayload) : null;
  }

  getWebhookLink(agent: Agent) {
    const links = (agent as any)?.links || [];
    if (!Array.isArray(links)) return null;
    const l = links.find((it: any) => it?.source_name === 'webhook' && it?.url);
    if (!l) return null;
    // normalise url → objet JSON si besoin
    const payload = this.parseWebhookPayload(l.url);
    return payload ? { ...l, url: payload } : null;
  }

  hasWebhook(agent: Agent): boolean {
    const link = this.getWebhookLink(agent);
    const p = link?.url as WebhookPayload | undefined;
    return !!(p && typeof p.endpoint === 'string' && p.endpoint.length > 0);
  }

  getWebhookPayload(agent: Agent): WebhookPayload | null {
    return (this.getWebhookLink(agent)?.url as WebhookPayload) ?? null;
  }

  missingRequired(agent: Agent): string[] {
    const p = this.getWebhookPayload(agent);
    if (!p) return ['webhook'];
    const inputs = p.inputs || [];
    const vals = p.values || {};
    return inputs.filter(i => i.required && !vals[i.name]).map(i => i.label || i.name);
  }

  canRun(agent: Agent): boolean {
    return this.hasWebhook(agent) && this.missingRequired(agent).length === 0;
  }

  getRunLabel(agent: Agent): string {
    return this.getWebhookPayload(agent)?.ui?.run_label || 'Run';
  }

  runAgent(agent: Agent) {
    if (!this.canRun(agent)) {
      const miss = this.missingRequired(agent).join(', ');
      this.notificationService.error(`Paramètres manquants: ${miss}. Complétez-les depuis la Marketplace.`);
      return;
    }
    this.agentService.runWebhook(agent.agentId!).subscribe({
      next: (res) => this.notificationService.success(res?.message || 'Exécution lancée'),
      error: () => this.notificationService.error("Échec de l’exécution")
    });
  }

  editModal = {
    open: false,
    agent: null as Agent | null,
    linkIndex: -1,
    payload: null as WebhookPayload | null,
    form: {} as Record<string, any>,
    saving: false
  };

  openEditValues(agent: Agent) {
    const link = this.getWebhookLink(agent);
    if (!link) return;
    const payload: WebhookPayload = link.url;
    const form: Record<string, any> = {};
    for (const inp of payload.inputs || []) form[inp.name] = payload.values?.[inp.name] ?? '';

    this.editModal = {
      open: true,
      agent,
      linkIndex: (agent as any).links.indexOf(link),
      payload,
      form,
      saving: false
    };
  }

  saveValuesOnAgent() {
    const m = this.editModal;
    if (!m.agent || !m.payload) return;
    m.saving = true;

    const nextLinks = [...((m.agent as any).links || [])];
    const idx = m.linkIndex;
    const nextPayload = { ...m.payload, values: { ...m.form } };

    if (idx >= 0) nextLinks[idx] = { ...nextLinks[idx], url: nextPayload };
    else nextLinks.push({ source_name: 'webhook', url: nextPayload });

    this.agentService.updateLinks(m.agent.agentId!, nextLinks).subscribe({
      next: () => {
        this.notificationService.success('Paramètres enregistrés.');
        this.editModal.open = false;
      },
      error: () => {
        m.saving = false;
        this.notificationService.error('Échec de l’enregistrement.');
      }
    });
  }

  guideModal = {
    open: false,
    agent: null as Agent | null,
    collapsed: false,
    q: '',


  };

  openGuide(agent: Agent) {
    this.guideModal.open = true;
    this.guideModal.agent = agent;
    this.guideModal.collapsed = false;
  }

  toggleGuideCollapse() {
    this.guideModal.collapsed = !this.guideModal.collapsed;
  }

  closeGuide() {
    this.guideModal.open = false;
    this.guideModal.agent = null;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.guideModal.open) this.closeGuide();
  }

  openParamsFromGuide() {
    const a = this.guideModal.agent;
    if (!a) return;
    this.closeGuide();
    this.openEditValues(a);
  }




  normalizeGuideSteps(raw: any): string[] {
    // Tolérant: array de strings, string long, null
    const text = Array.isArray(raw) ? raw.join('\n') : (raw || '');
    // Découpage par doubles retours, longues lignes de soulignés, ou séparateurs
    const parts = text
      .split(/\n{2,}|_{6,}|—{6,}|-{6,}|\u2500{3,}/g)
      .map(s => s.trim())
      .filter(Boolean);

    const q = (this.guideModal.q || '').toLowerCase().trim();
    return q ? parts.filter(p => p.toLowerCase().includes(q)) : parts;
  }

  private buildGuidePlainText(g: any): string {
    const title = g?.url?.title ? `${g.url.title}\n\n` : '';
    const steps = this.normalizeGuideSteps(g?.url?.steps)
      .map((s: string, i: number) => `${i + 1}. ${s}`)
      .join('\n');
    const notes = g?.url?.notes ? `\n\nNotes\n${g.url.notes}` : '';
    const longI = g?.url?.long_instructions ? `\n\nInstructions détaillées\n${g.url.long_instructions}` : '';
    return `${title}${steps}${notes}${longI}`.trim();
  }

  copyGuide(g: any) {
    const txt = this.buildGuidePlainText(g);
    navigator.clipboard.writeText(txt).catch(() => {});
  }

  downloadGuide(g: any) {
    const txt = this.buildGuidePlainText(g);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'guide.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
