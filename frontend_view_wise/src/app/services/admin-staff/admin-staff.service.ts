import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import {catchError, Observable, throwError} from 'rxjs';
import { AdminUser } from '../admin/admin-user.service';

@Injectable({ providedIn: 'root' })
export class AdminStaffService {
  private readonly resourceBase = '/auth/admins/';
  private base = `${environment.apiBaseUrl}/auth/admins/`;
  private url(path = ''): string {
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    const res = this.resourceBase.replace(/^\/+/, '').replace(/\/+$/, '');
    const p = path.replace(/^\/+/, '');
    return `${base}/${res}/${p}`.replace(/\/+$/, '/') // toujours terminer par /
  }

  constructor(private http: HttpClient) {}
  list(q = ''): Observable<AdminUser[]> {
    const params = q ? new HttpParams().set('search', q) : undefined;
    return this.http.get<AdminUser[]>(this.base, { params });
  }
  create(data: Partial<AdminUser> & { password?: string }) {
    // is_staff sera forcé côté backend
    return this.http.post<AdminUser>(this.base, data);
  }
  update(id: number, data: Partial<AdminUser>) {
    return this.http.patch<AdminUser>(`${this.base}${id}/`, data);
  }
  delete(id: number) {
    return this.http.delete(`${this.base}${id}/`);
  }
  // toggleStaff(id: number, is_staff: boolean) {
  //   return this.http.patch<AdminUser>(`${this.base}${id}/toggle-staff/`, { is_staff });
  // }
  toggleActive(id: number, is_active: boolean) {
    const toggleUrl = this.url(`${id}/toggle-active/`);
    return this.http.patch<AdminUser>(toggleUrl, { is_active }).pipe(
      catchError(err => {
        if (err.status === 404) {
          // pas d’action côté backend → PATCH direct sur l’utilisateur
          return this.http.patch<AdminUser>(this.url(`${id}`), { is_active });
        }
        return throwError(() => err);
      })
    );
  }
}
