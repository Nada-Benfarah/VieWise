import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface AdminAgent {
  agentId: number;
  agentName: string;
  agentObjective?: string;
  etat?: 'draft' | 'deployed';
  creator?: number;
  creator_email?: string;
}

export interface AgentCloneStat {
  agentId: number;
  agentName: string;
  clone_count: number;
}
@Injectable({ providedIn: 'root' })
export class AdminAgentsService {
  private base = `${environment.apiBaseUrl}/api/agents/`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminAgent[]> {
    // Pour les admins, vous pouvez ajouter ?all=true si votre backend le supporte
    return this.http.get<AdminAgent[]>(this.base, { params: { all: 'true' } });
  }

  create(data: Partial<AdminAgent>): Observable<AdminAgent> {
    return this.http.post<AdminAgent>(this.base, data);
  }

  update(id: number, data: Partial<AdminAgent>): Observable<AdminAgent> {
    return this.http.patch<AdminAgent>(`${this.base}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}${id}/`);
  }

  /**
   * Récupère les statistiques de clonage des agents (nombre de clonages par agent)
   */

  getCloneStats(): Observable<AgentCloneStat[]> {
    return this.http.get<AgentCloneStat[]>(`${this.base}clones-stats/`);
  }
}
