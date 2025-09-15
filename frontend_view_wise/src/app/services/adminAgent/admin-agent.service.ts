import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  list(opts?: { not_in_marketplace?: boolean; in_marketplace?: boolean; all?: boolean }): Observable<AdminAgent[]> {
    let params = new HttpParams();
    if (opts?.not_in_marketplace) params = params.set('not_in_marketplace', 'true');
    if (opts?.in_marketplace)     params = params.set('in_marketplace', 'true');
    if (opts?.all)                params = params.set('all', 'true');
    return this.http.get<AdminAgent[]>(this.base + '', { params });
  }
}
