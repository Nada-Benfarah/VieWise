import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, throwError } from 'rxjs';
import {catchError} from "rxjs";

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name?: string;
  phone_number?: string | null;
  email_verified?:boolean,
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined?: string;
  avatar_url?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  /**
   * ⚠️ Choisis UNE des deux lignes :
   * - Si environment.apiBaseUrl = 'http://localhost:8000'  -> garde '/auth/users/'
   * - Si environment.apiBaseUrl = 'http://localhost:8000/auth' -> mets '/users/'
   */
  private readonly resourceBase = '/auth/users/'; // ← adapte si besoin

  constructor(private http: HttpClient) {}

  /** Construit une URL propre (évite les doubles slashes) */
  private url(path = ''): string {
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    const res = this.resourceBase.replace(/^\/+/, '').replace(/\/+$/, '');
    const p = path.replace(/^\/+/, '');
    return `${base}/${res}/${p}`.replace(/\/+$/, '/') // toujours terminer par /
  }

  list(search = ''): Observable<AdminUser[]> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<AdminUser[]>(this.url(), { params });
  }

  create(data: Partial<AdminUser> & { password?: string }): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.url(), data);
  }

  update(id: number, data: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.patch<AdminUser>(this.url(`${id}`), data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`${id}`));
  }

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

  toggleStaff(id: number, is_staff: boolean) {
    const toggleUrl = this.url(`${id}/toggle-staff`);
    return this.http.patch<AdminUser>(toggleUrl, { is_staff }).pipe(
      catchError(err => {
        if (err.status === 404) {
          return this.http.patch<AdminUser>(this.url(`${id}`), { is_staff });
        }
        return throwError(() => err);
      })
    );
  }
}
