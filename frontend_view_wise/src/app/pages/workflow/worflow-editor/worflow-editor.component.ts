import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WorkflowNode {
  type: string;
  label: string;
  x: number;
  y: number;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './worflow-editor.component.html',
  styleUrls: ['./worflow-editor.component.scss']
})
export class WorflowEditorComponent {
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

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasInner') canvasInnerRef!: ElementRef<HTMLDivElement>;

  toggleDropdown(index?: number): void {
    if (index === undefined) {
      this.dropdownIndex = null;
      this.dropdownVisible = !this.dropdownVisible;
    } else if (this.dropdownIndex === index && this.dropdownVisible) {
      this.dropdownVisible = false;
      this.dropdownIndex = null;
    } else {
      this.dropdownIndex = index;
      this.dropdownVisible = true;
    }
  }
  addNode(type: string): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWidth = canvas.offsetWidth;

    const origin = this.dropdownIndex !== null ? this.nodes[this.dropdownIndex] : null;

    const newNode: WorkflowNode = {
      type,
      label: this.getLabelForType(type),
      x: origin ? origin.x : canvasWidth / 2 - 80,
      y: origin
        ? origin.y + 140
        : this.nodes.length
          ? this.nodes[this.nodes.length - 1].y + 140
          : 100
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

  getLabelForType(type: string): string {
    switch (type) {
      case 'human':
        return 'Human Input';
      case 'agent':
        return 'Agent';
      case 'loop':
        return 'Loop';
      case 'router':
        return 'Router';
      case 'code':
        return 'Code';
      case 'webhook':
        return 'Webhook';
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
      case 'router':
        return '🔀';
      case 'code':
        return '💻';
      case 'webhook':
        return '🌐';
      default:
        return '🔷';
    }
  }

  removeNode(index: number): void {
    this.nodes.splice(index, 1);
    this.updateConnectors();
  }

  startDrag(event: MouseEvent, index: number): void {
    const canvasRect = this.canvasInnerRef.nativeElement.getBoundingClientRect();
    this.draggingNodeIndex = index;
    const node = this.nodes[index];
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

      node.x = Math.max(0, Math.min(canvasBounds.width - 160, newX));
      node.y = Math.max(0, Math.min(canvasBounds.height - 100, newY));

      this.updateConnectors();
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
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const from = this.nodes[i];
      const to = this.nodes[i + 1];

      this.connectors.push({
        x1: from.x + 80,
        y1: from.y + 100,
        x2: to.x + 80,
        y2: to.y
      });
    }
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
      target.closest('.dropdown') !== null ||
      target.classList.contains('new-node-btn') ||
      target.classList.contains('plus-node-btn');

    if (!clickedInsideDropdown) {
      this.dropdownVisible = false;
      this.dropdownIndex = null;
    }
  }
}
