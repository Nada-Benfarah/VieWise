import { Component, ElementRef, HostListener, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrchestratorModalComponent } from '../orchestrator-modal/orchestrator-modal.component';
import { WorkflowService } from '../../../services/workflow/workflow.service';
import { Agent, AgentService } from '../../../services/agents/agent.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification/notification.service';

interface WorkflowNode {
  type: string;
  label: string;
  x: number;
  y: number;
  agentId?: number; // ✅ Ajoute cette ligne
  metadata?: {
    supervisorName?: string;
    tasks?: string[];
    task?: string;           // ✅ Pour les boucles
    variable?: string;
    collection?: string;
    workflowId?: string;     // ✅ Pour les subflows
  };
  groupId?: string;
}



interface ConnectorLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

@Component({
  selector: 'app-worflow-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, OrchestratorModalComponent],
  templateUrl: './worflow-editor.component.html',
  styleUrls: ['./worflow-editor.component.scss']
})
export class WorflowEditorComponent implements OnInit{
  dropdownVisible = false;
  dropdownIndex: number | null = null;

  nodes: WorkflowNode[] = [];
  connectors: ConnectorLine[] = [];

  draggingNodeIndex: number | null = null;
  dragOffsetX = 0;
  dragOffsetY = 0;

  zoomLevel = 1;
  minZoom = 0.5;
  maxZoom = 2;
  zoom: number = 1;
  showSupervisorModal = false;
  supervisorName = '';
  tasks: string[] = [''];
  orchestratorModalVisible = false;
  relations: { parentIndex: number; childIndex: number }[] = [];
  activeParentIndex: number | null = null;
  childCountMap: Record<number, number> = {};
  modalMode: 'orchestrator' | 'optimizer' | 'loop' | 'subflow' | 'agent' | null = null;
  availableAgents: Agent[] = [];
  workflowName: string;
  editingWorkflowId: number | null = null;
  availableSubflows: any[] = []; // à ajouter en haut
  groupBoxes: { id: string; x: number; y: number; width: number; height: number }[] = [];
  isCloned = false;

  @Input() readonly = false;
  @Input() loadedWorkflow: any;

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasInner') canvasInnerRef!: ElementRef<HTMLDivElement>;


  constructor(private router: Router, private notificationService: NotificationService,private workflowService: WorkflowService, private agentService: AgentService) {
    const state = history.state;
    if (state.loadedWorkflow) {
      const wf = state.loadedWorkflow;
      this.nodes = wf.nodes || [];
      this.relations = wf.relations || [];
      this.workflowName = wf.workflowName;
      this.connectors = wf.connectors;

      this.editingWorkflowId = state.isClone ? null : wf.workflowId;
      this.isCloned = !!state.isClone;


      this.updateConnectors();
    }

    this.agentService.getAllAgents().subscribe({
      next: (agents) => this.availableAgents = agents,
      error: () => console.error('Erreur chargement des agents')
    });
    this.workflowService.getAllWorkflows().subscribe({
      next: (res) => this.availableSubflows = res,
      error: () => console.error('Erreur chargement des subflows')
    });
  }

  toggleDropdown(index?: number): void {
    if (index === undefined) {
      this.dropdownIndex = null;
      this.dropdownVisible = !this.dropdownVisible;
      this.activeParentIndex = null;
    } else if (this.dropdownIndex === index && this.dropdownVisible) {
      this.dropdownVisible = false;
      this.dropdownIndex = null;
      // NE PAS remettre à null ici : on garde le parent actif pour plusieurs ajouts
    } else {
      this.dropdownIndex = index;
      this.dropdownVisible = true;
      this.activeParentIndex = index;
    }
  }

  ngOnInit(): void {
    if (this.readonly && this.loadedWorkflow) {
      console.log('📦 Chargement lecture seule depuis loadedWorkflow (pas d’API)');
      // Utilise directement loadedWorkflow sans appeler getWorkflowById
      this.nodes = this.loadedWorkflow.nodes || [];
      this.relations = this.loadedWorkflow.relations || [];
      this.workflowName = this.loadedWorkflow.workflowName || '';
      this.updateConnectors();
      return; // ✅ stop ici
    }

  }





  addNode(type: string): void {
    if (this.readonly) return;

    if (['orchestrator', 'optimizer', 'loop', 'subflow', 'agent'].includes(type)) {
      this.openModal(type as any);
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const largeurCanvas = canvas.offsetWidth;

    const parentIndex = this.dropdownIndex;
    let x = 0;
    let y = 0;

    if (parentIndex !== null && this.nodes[parentIndex]) {
      const parent = this.nodes[parentIndex];
      const spacingX = 200;
      const spacingY = 140;

      const siblingCount = this.childCountMap[parentIndex] || 0;
      const offset = (siblingCount - Math.floor(siblingCount / 2)) * spacingX - spacingX;

      x = parent.x + offset;
      y = parent.y + spacingY;

      this.childCountMap[parentIndex] = siblingCount + 1;

    } else {
      x = largeurCanvas / 2 - 80;
      y = this.nodes.length ? this.nodes[this.nodes.length - 1].y + 140 : 100;
    }

    const newNode: WorkflowNode = {
      type,
      label: this.getLabelForType(type),
      x,
      y
    };

    const insertIndex = this.nodes.length;
    this.nodes.push(newNode);

    if (parentIndex !== null) {
      this.relations.push({
        parentIndex,
        childIndex: insertIndex
      });
    }

    this.updateConnectors();

    // ✅ Fermer le dropdown après l'ajout
    this.dropdownVisible = false;
    this.dropdownIndex = null;
  }


  getLabelForType(type: string): string {
    switch (type) {
      case 'human':
        return 'Human Input';
      case 'agent':
        return 'Agent';
      case 'loop':
        return 'Loop';
      case 'orchestrator':
        return 'Orchestrator';
      case 'optimizer':
        return 'Optimizer';
      case 'subflow':
        return 'Subflow';
      default:
        return 'Node';
    }
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'human':
        return '👤';
      case 'agent':
        return '🤖';
      case 'loop':
        return '🔁';
      case 'orchestrator':
        return '🛠';
      case 'optimizer':
        return '⚖';
      case 'subflow':
        return '🔂';
      default:
        return '🔷';
    }
  }

  removeNode(index: number): void {
    const targetNode = this.nodes[index];

    // Si c'est un subflow (il a un groupId), supprimer tous les nœuds de ce groupe
    if (targetNode.groupId) {
      const groupId = targetNode.groupId;

      // 1. Trouver tous les indices du groupe
      const indicesToDelete = this.nodes
        .map((node, idx) => ({ node, idx }))
        .filter(({ node }) => node.groupId === groupId)
        .map(({ idx }) => idx);

      // 2. Supprimer relations liées
      this.relations = this.relations.filter(
        r => !indicesToDelete.includes(r.parentIndex) && !indicesToDelete.includes(r.childIndex)
      );

      // 3. Supprimer les nœuds par index décroissant (pour éviter les décalages)
      indicesToDelete.sort((a, b) => b - a).forEach(i => this.nodes.splice(i, 1));
    } else {
      // Sinon suppression classique
      this.nodes.splice(index, 1);
      this.relations = this.relations.filter(
        r => r.parentIndex !== index && r.childIndex !== index
      );
    }

    this.updateConnectors();
    this.updateGroupBoxes();
  }


  startDrag(event: MouseEvent, index: number): void {

    if (this.readonly) return;
    const node = this.nodes[index];
    // 🚫 Ne pas permettre le déplacement des nœuds de subflow
    if (node.groupId) return;

    const canvasRect = this.canvasInnerRef.nativeElement.getBoundingClientRect();
    this.draggingNodeIndex = index;
    this.dragOffsetX = event.clientX - canvasRect.left - node.x;
    this.dragOffsetY = event.clientY - canvasRect.top - node.y;
    event.preventDefault();
  }

  @HostListener('window:mouseup')
  stopDrag(): void {
    this.draggingNodeIndex = null;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.draggingNodeIndex !== null) {
      const canvasBounds = this.canvasInnerRef.nativeElement.getBoundingClientRect();
      const node = this.nodes[this.draggingNodeIndex];
      const newX = event.clientX - canvasBounds.left - this.dragOffsetX;
      const newY = event.clientY - canvasBounds.top - this.dragOffsetY;

      let boundedX = newX;
      let boundedY = newY;

      const groupBox = this.groupBoxes.find(box => box.id === node.groupId);

      if (groupBox) {
        const nodeWidth = 160;
        const nodeHeight = 100;

        // Empêcher de sortir du cadre
        boundedX = Math.max(groupBox.x, Math.min(groupBox.x + groupBox.width - nodeWidth, newX));
        boundedY = Math.max(groupBox.y, Math.min(groupBox.y + groupBox.height - nodeHeight, newY));
      }

      node.x = Math.max(0, Math.min(canvasBounds.width - 160, boundedX));
      node.y = Math.max(0, Math.min(canvasBounds.height - 100, boundedY));

      this.updateConnectors();
      this.updateGroupBoxes(); // si tu veux les recalculer en live
    }

  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();

    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom + delta));

    const canvas = this.canvasInnerRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    canvas.style.transformOrigin = `${centerX}px ${centerY}px`;

    this.zoom = newZoom;
  }

  updateConnectors(): void {
    this.connectors = [];

    for (const rel of this.relations) {
      const from = this.nodes[rel.parentIndex];
      const to = this.nodes[rel.childIndex];

      if (from && to) {
        this.connectors.push({
          x1: from.x + 80,
          y1: from.y + 100,
          x2: to.x + 80,
          y2: to.y
        });
      }
    }
  }


  removeRelation(index: number): void {
    const confirmed = confirm('Supprimer cette liaison entre les deux nœuds ?');
    if (!confirmed) return;

    this.relations.splice(index, 1);
    this.updateConnectors();
  }


  zoomIn(): void {
    if (this.zoom < this.maxZoom) {
      this.zoom += 0.1;
    }
  }

  zoomOut(): void {
    if (this.zoom > this.minZoom) {
      this.zoom -= 0.1;
    }
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const clickedInsideDropdown =
      target.closest('.dropdown') !== null || target.classList.contains('new-node-btn') || target.classList.contains('plus-node-btn');

    if (!clickedInsideDropdown) {
      this.dropdownVisible = false;
      this.dropdownIndex = null;
    }
  }

  cancelSupervisorModal(): void {
    this.showSupervisorModal = false;
    this.supervisorName = '';
    this.tasks = [''];
  }

  handleModalSave(data: any): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWidth = canvas.offsetWidth;

    const parentIndex = this.activeParentIndex;
    const parent = parentIndex !== null ? this.nodes[parentIndex] : null;

    const baseX = parent ? parent.x : canvasWidth / 2 - 80;
    const baseY = parent ? parent.y + 140 : (this.nodes.length ? this.nodes[this.nodes.length - 1].y + 140 : 100);

    if (this.modalMode === 'agent') {
      const agentNode: WorkflowNode = {
        type: 'agent',
        label: data.label,
        x: baseX,
        y: baseY,
        metadata: {},
        agentId: data.agentId
      };

      const insertIndex = this.nodes.length;
      this.nodes.push(agentNode);

      if (parentIndex !== null) {
        this.relations.push({ parentIndex, childIndex: insertIndex });
      }
    }

    else if (this.modalMode === 'subflow') {
      const subflowLabel = data.title || 'Subflow';
      const groupId = subflowLabel;

      const offset = this.nodes.length;

      const embeddedNodes: WorkflowNode[] = data.embeddedWorkflow.nodes.map((n: WorkflowNode) => ({
        ...n,
        x: n.x + baseX,
        y: n.y + baseY,
        groupId // 👈 Affecter groupId à tous les nœuds importés
      }));

      const embeddedRelations = data.embeddedWorkflow.relations.map((r: any) => ({
        parentIndex: r.parentIndex + offset,
        childIndex: r.childIndex + offset
      }));

      this.nodes.push(...embeddedNodes);
      this.relations.push(...embeddedRelations);

      if (parentIndex !== null) {
        this.relations.push({
          parentIndex,
          childIndex: offset // lien avec le premier nœud du subflow
        });
      }
    }

    else {
      const newNode: WorkflowNode = {
        type: this.modalMode!,
        label: data.title,
        x: baseX,
        y: baseY,
        metadata: {}
      };

      if (this.modalMode === 'orchestrator' || this.modalMode === 'optimizer') {
        newNode.metadata = { tasks: data.items };
      }

      if (this.modalMode === 'loop') {
        newNode.metadata = {
          task: data.task,
          variable: data.variable,
          collection: data.collection
        };
      }

      const insertIndex = this.nodes.length;
      this.nodes.push(newNode);

      if (parentIndex !== null) {
        this.relations.push({ parentIndex, childIndex: insertIndex });
      }
    }

    // Cleanup
    this.orchestratorModalVisible = false;
    this.dropdownVisible = false;
    this.dropdownIndex = null;
    this.modalMode = null;

    this.updateConnectors();
    this.updateGroupBoxes();
  }



  addTask(): void {
    this.tasks.push('');
  }

  removeTask(index: number): void {
    this.tasks.splice(index, 1);
  }

  saveSupervisorNode(): void {
    // Créer un nœud "orchestrator" avec un label enrichi
    const label = `${this.supervisorName} : ${this.tasks.join(', ')}`;
    this._insertNodeWithLabel('orchestrator', label);
    this.cancelSupervisorModal();
  }

  private _insertNodeWithLabel(type: string, label: string): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWidth = canvas.offsetWidth;

    const origin = this.dropdownIndex !== null ? this.nodes[this.dropdownIndex] : null;

    const newNode: WorkflowNode = {
      type,
      label,
      x: origin ? origin.x : canvasWidth / 2 - 80,
      y: origin ? origin.y + 140 : this.nodes.length ? this.nodes[this.nodes.length - 1].y + 140 : 100
    };

    const insertIndex = this.dropdownIndex !== null ? this.dropdownIndex + 1 : this.nodes.length;
    if (insertIndex < this.nodes.length) {
      for (let i = insertIndex; i < this.nodes.length; i++) {
        this.nodes[i].y += 140;
      }
    }

    this.nodes.splice(insertIndex, 0, newNode);

    this.dropdownVisible = false;
    this.dropdownIndex = null;
    this.updateConnectors();
  }

  openOrchestratorModal(): void {
    this.orchestratorModalVisible = true;
  }

  closeOrchestratorModal(): void {
    this.orchestratorModalVisible = false;
  }

  handleSupervisorSave(data: { supervisorName: string; tasks: string[] }): void {
    const label = data.supervisorName;

    const canvas = this.canvasRef.nativeElement;
    const canvasWidth = canvas.offsetWidth;

    const origin = this.dropdownIndex !== null ? this.nodes[this.dropdownIndex] : null;

    const newNode: WorkflowNode = {
      type: 'orchestrator',
      label,
      x: origin ? origin.x : canvasWidth / 2 - 80,
      y: origin ? origin.y + 140 : this.nodes.length ? this.nodes[this.nodes.length - 1].y + 140 : 100,
      metadata: {
        supervisorName: label,
        tasks: data.tasks.filter(task => task.trim() !== '')
      }
    };

    const insertIndex = this.dropdownIndex !== null ? this.dropdownIndex + 1 : this.nodes.length;

    if (insertIndex < this.nodes.length) {
      for (let i = insertIndex; i < this.nodes.length; i++) {
        this.nodes[i].y += 140;
      }
    }

    this.nodes.splice(insertIndex, 0, newNode);

    this.dropdownVisible = false;
    this.dropdownIndex = null;
    this.updateConnectors();
    this.closeOrchestratorModal();
  }

  private _insertSupervisorNode(supervisorLabel: string, tasks: string[]): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWidth = canvas.offsetWidth;

    // 1. Créer le noeud superviseur (Orchestrator)
    const supervisorNode: WorkflowNode = {
      type: 'orchestrator',
      label: supervisorLabel,
      x: canvasWidth / 2 - 80,
      y: 100
    };

    this.nodes.push(supervisorNode);
    const supervisorIndex = this.nodes.length - 1;

    // 2. Créer chaque tâche comme un nœud agent et connecter au superviseur
    const baseY = supervisorNode.y + 140;
    const spacing = 220;
    const totalWidth = (tasks.length - 1) * spacing;

    tasks.forEach((task, i) => {
      const taskNode: WorkflowNode = {
        type: 'agent',
        label: task,
        x: canvasWidth / 2 - totalWidth / 2 + i * spacing,
        y: baseY
      };
      this.nodes.push(taskNode);

      const taskIndex = this.nodes.length - 1;
      this.connectors.push({
        x1: supervisorNode.x + 80,
        y1: supervisorNode.y + 100,
        x2: taskNode.x + 80,
        y2: taskNode.y
      });
    });
  }

  openModal(type: 'orchestrator' | 'optimizer'): void {
    this.modalMode = type;
    this.orchestratorModalVisible = true;
  }

  saveWorkflowToBackend(): void {
    const name = prompt('Entrez le nom du workflow :', this.workflowName || '');
    if (!name) {
      this.notificationService.warning('Nom requis !');
      return;
    }

    const payload = {
      workflowName: name,
      description: 'Mis à jour depuis l’éditeur',
      agents: this.extractAgentIds(),
      tools: [],
      trigger: null,
      is_active: true,
      nodes: this.nodes,
      relations: this.relations
    };

    if (this.editingWorkflowId) {
      // 👇 Update existant
      this.workflowService.updateWorkflow(this.editingWorkflowId, payload).subscribe({
        next: () => this.notificationService.success('Workflow mis à jour avec succès !'),
        error: () => this.notificationService.error('Erreur lors de la mise à jour.')
      });
    } else {
      this.workflowService.saveWorkflow(payload).subscribe({
        next: () => this.notificationService.success('Workflow enregistré avec succès !'),

        error: () => this.notificationService.error('Erreur d’enregistrement')
      });
    }
  }





  extractAgentIds(): number[] {
    return this.nodes
      .filter(node => node.type === 'agent' && (node as any).agentId)
      .map(node => (node as any).agentId);
  }

  loadWorkflow(id: number): void {
    this.workflowService.getWorkflowById(id).subscribe({
      next: (wf) => {
        this.nodes = wf.nodes || [];
        this.relations = wf.relations || [];
        this.updateConnectors();  // 🔁 Important
      },
      error: () => {
        this.notificationService.error("Erreur lors du chargement du workflow");
      }
    });
  }
  updateGroupBoxes(): void {
    const groups: Record<string, WorkflowNode[]> = {};

    this.nodes.forEach(node => {
      if (node.groupId) {
        if (!groups[node.groupId]) {
          groups[node.groupId] = [];
        }
        groups[node.groupId].push(node);
      }
    });

    this.groupBoxes = Object.entries(groups).map(([id, groupNodes]) => {
      const padding = 40;
      const xs = groupNodes.map(n => n.x);
      const ys = groupNodes.map(n => n.y);

      const minX = Math.min(...xs) - padding;
      const minY = Math.min(...ys) - padding;
      const maxX = Math.max(...xs) + 160 + padding;
      const maxY = Math.max(...ys) + 100 + padding;

      return {
        id,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    });
  }

}
