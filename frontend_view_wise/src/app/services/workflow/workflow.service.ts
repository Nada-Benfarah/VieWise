import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    return this.http.get<any[]>(this.baseUrl);
  }
  deleteWorkflow(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${id}/`);
  }
  updateWorkflow(id: number, payload: any) {
    return this.http.put(`${this.baseUrl}${id}/`, payload);
  }

}


