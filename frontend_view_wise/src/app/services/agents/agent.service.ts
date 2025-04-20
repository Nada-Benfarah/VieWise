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
    return this.http.get<Agent[]>(this.apiUrl);
  }

  getAgentById(id: number) {
    return this.http.get<Agent>(`${this.apiUrl}${id}/`);
  }

  createAgent(agent: Agent) {
    return this.http.post<Agent>(this.apiUrl, agent);
  }

  uploadFile(agentId: number, file: File) {
    const formData = new FormData();
    formData.append('agent', agentId.toString());
    formData.append('file', file);
    return this.http.post(`${environment.apiBaseUrl}/api/agent-files/`, formData);
  }

  createAgentWithFiles(formData: FormData) {
    return this.http.post(`${environment.apiBaseUrl}/api/agents/create-with-files/`, formData);
  }

  updateAgent(id: number, agent: Agent) {
    return this.http.put<Agent>(`${this.apiUrl}${id}/`, agent);
  }

  updateAgentWithFiles(agentId: number, formData: FormData) {
    return this.http.put(`${this.apiUrl}${agentId}/update-with-files/`, formData);
  }


  deleteAgent(id: number) {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }

  getAllDatasources() {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/agents/datasources/`);
  }

  getAllModeles() {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/agents/modeles/`);
  }
  deleteAgentFile(fileId: number) {
    return this.http.delete(`${environment.apiBaseUrl}/api/agent-files/${fileId}/`);
  }

}
