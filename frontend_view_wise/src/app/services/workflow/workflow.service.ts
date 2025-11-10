import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WorkflowCloneStat {
  workflowId: number;
  workflowName: string;
  clone_count: number;
}
@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private baseUrl = 'http://localhost:8000/api/workflows/';

  constructor(private http: HttpClient) {}

  saveWorkflow(workflowData: any): Observable<any> {
    return this.http.post(this.baseUrl, workflowData);
  }
  getWorkflowById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}${id}/`);
  }
  getAllWorkflows(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}?all=true`);
  }
  getMyWorkflows(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }
  deleteWorkflow(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${id}/?all=true`);
  }
  updateWorkflow(id: number, payload: any) {
    return this.http.put(`${this.baseUrl}${id}/`, payload);
  }
  getPublicWorkflow(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}${id}/public/`);
  }
  getCloneStats(): Observable<WorkflowCloneStat[]> {
    return this.http.get<WorkflowCloneStat[]>(`${this.baseUrl}clones-stats/`);
  }
  cloneWorkflow(workflowId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}${workflowId}/clone/`, {});
  }
}
