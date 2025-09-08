// src/app/services/admin-marketplace/admin-market-place.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface AdminMarketplaceRow {
  id: number;
  category: string;
  tags?: string;
  agent: { agentId: number; agentName: string; agentObjective?: string };
}


export interface AdminMarketplaceWorkflowRow {
  id: number;
  category: string;
  tags?: string;
  workflow: { workflowId: number; workflowName: string; description?: string };
}

@Injectable({ providedIn: 'root' })
export class AdminMarketPlaceService {
  private base = `${environment.apiBaseUrl.replace(/\/+$/, '')}/api/marketplace`;

  constructor(private http: HttpClient) {}

  // AGENTS
  list(): Observable<AdminMarketplaceRow[]> {
    return this.http.get<AdminMarketplaceRow[]>(`${this.base}/`);
  }
  create(data: { agent_id: number; category: string; tags?: string }): Observable<AdminMarketplaceRow> {
    return this.http.post<AdminMarketplaceRow>(`${this.base}/`, data);
  }
  update(id: number, data: { category: string; tags?: string }): Observable<AdminMarketplaceRow> {
    return this.http.patch<AdminMarketplaceRow>(`${this.base}/${id}/`, data);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/`);
  }

  // WORKFLOWS 👇
  listWorkflows(): Observable<AdminMarketplaceWorkflowRow[]> {
    return this.http.get<AdminMarketplaceWorkflowRow[]>(`${this.base}/workflows/`);
  }
  createWorkflow(data: { workflow_id: number; category: string; tags?: string }): Observable<AdminMarketplaceWorkflowRow> {
    return this.http.post<AdminMarketplaceWorkflowRow>(`${this.base}/workflows/`, data);
  }
  updateWorkflow(id: number, data: { category: string; tags?: string }): Observable<AdminMarketplaceWorkflowRow> {
    return this.http.patch<AdminMarketplaceWorkflowRow>(`${this.base}/workflows/${id}/`, data);
  }
  deleteWorkflow(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/workflows/${id}/`);
  }
}
