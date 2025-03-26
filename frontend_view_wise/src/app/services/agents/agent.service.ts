import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface Agent {
  agentId?: number;
  agentName: string;
  agentRole: string;
  agentObjective: string;
  agentInstructions: string;
  etat: 'draft' | 'deployed';
  datasource: number;
  modele: number;
  creator?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private apiUrl = `${environment.apiBaseUrl}/api/agents/`;

  constructor(private http: HttpClient) {}

  getAllAgents() {
    return this.http.get<Agent[]>(`${environment.apiBaseUrl}/api/agents/agents`);
  }

  getAgentById(id: number) {
    return this.http.get<Agent>(`${this.apiUrl}${id}/`);
  }

  createAgent(agent: Agent) {
    return this.http.post<Agent>(`${environment.apiBaseUrl}/api/agents/agents/`, agent);
  }

  updateAgent(id: number, agent: Agent) {
    return this.http.put<Agent>(`${this.apiUrl}${id}/`, agent);
  }

  deleteAgent(id: number) {
    return this.http.delete(`${environment.apiBaseUrl}/api/agents/agents/${id}/`);
  }

  getAllDatasources() {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/agents/datasources/`);
  }

  getAllModeles() {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/agents/modeles/`);
  }

}
