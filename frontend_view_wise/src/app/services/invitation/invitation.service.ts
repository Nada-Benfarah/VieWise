import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// invitation.service.ts
@Injectable({ providedIn: 'root' })
export class InvitationService {
  private apiUrl = `${environment.apiBaseUrl}/api/invitations/`;
  constructor(private http: HttpClient) {}

  sendInvitations(payload: any) {
    return this.http.post(this.apiUrl, payload);
  }

  getAllProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/invitations/projects/`);
  }
  getRemainingInvitations(): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/api/invitations/remaining/`);
  }

  updateStatus(invitationId: number, status: 'Accepté' | 'Rejeté') {
    return this.http.patch(`${environment.apiBaseUrl}/api/invitations/${invitationId}/set-status/`, { status });
  }
  getSentInvitations() {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/api/invitations/sent/`);
  }
  deleteInvitation(id: number) {
    return this.http.delete(`${environment.apiBaseUrl}/api/invitations/${id}/`);
  }

}
