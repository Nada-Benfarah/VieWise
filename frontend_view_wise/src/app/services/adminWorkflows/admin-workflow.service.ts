import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface AdminWorkflow {
  workflowId: number;
  workflowName: string;
  description?: string;
  is_active: boolean;
  owner?: boolean;
  role?: 'Éditeur' | 'Visiteur';
  agents?: number[];
}

@Injectable({ providedIn: 'root' })
export class AdminWorkflowsService {
  private base = `${environment.apiBaseUrl}/api/workflows/`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminWorkflow[]> {
    // admin: récupère tout
    return this.http.get<AdminWorkflow[]>(this.base, { params: { all: 'true' } });
  }

  create(data: Partial<AdminWorkflow>): Observable<AdminWorkflow> {
    return this.http.post<AdminWorkflow>(this.base, data);
  }

  update(id: number, data: Partial<AdminWorkflow>): Observable<AdminWorkflow> {
    return this.http.patch<AdminWorkflow>(`${this.base}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}${id}/`);
  }

  toggleActive(id: number, is_active: boolean): Observable<AdminWorkflow> {
    return this.update(id, { is_active });
  }
}
