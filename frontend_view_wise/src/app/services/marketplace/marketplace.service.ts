import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Agent } from '../agents/agent.service';

export interface MarketplaceAgent {
  id: number;
  category: string;
  tags: string;
  agentName: string;
  agentObjective: string;
  agentRole: string;
  agent:Agent
}
export interface MarketplaceWorkflowEntry {
  id: number;
  category: string;
  tags?: string;
  workflow: { workflowId: number; workflowName: string; description?: string };
}

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {

  constructor(private http: HttpClient) { }

  getMarketplaceAgents(): Observable<MarketplaceAgent[]> {
    return this.http.get<MarketplaceAgent[]>(`${environment.apiBaseUrl}/api/marketplace/`);
  }
  getMarketplaceWorkflows() {
    const base = `${environment.apiBaseUrl}/api/marketplace/workflows/`; // adaptez selon votre service
    return this.http.get<MarketplaceWorkflowEntry[]>(base);
  }
}
