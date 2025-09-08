import { StorageService } from './storage.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UserLoginForm {
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  is_admin?: boolean;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

export interface UserRegisterForm {
  username: string;
  email: string;
  password: string;
}
export interface OnboardingData {
  discovery: string;
  role: string;
  goal: string;
  company_size: string;
}



@Injectable({ providedIn: 'root' })
export class AuthService {
  private $user = new BehaviorSubject<User | null>(null);
  private router = inject(Router);

  constructor(private http: HttpClient, private storageService: StorageService) {
    // 🔹 Seed depuis localStorage (si présent)
    const raw = localStorage.getItem('current_user');
    if (raw) {
      try {
        const cached = JSON.parse(raw) as User;
        // applique le cache-busting pour éviter les vieilles URLs d’avatar
        this.$user.next(this.normalizeUser(cached));
      } catch { /* ignore */ }
    }
  }

  /** Flux lisible du user courant */
  get user(): Observable<User | null> {
    return this.$user.asObservable();
  }

  /** Setter centralisé : normalise + persiste + notifie */
  set user(value: User | null) {
    const normalized = value ? this.normalizeUser(value) : null;
    this.$user.next(normalized);
    if (normalized) {
      localStorage.setItem('current_user', JSON.stringify(normalized));
    } else {
      localStorage.removeItem('current_user');
    }
  }

  /** Ajoute un cache-busting sur l’avatar et normalise éventuellement d’autres champs */
  private normalizeUser(u: User): User {
    let avatar_url = u.avatar_url || undefined;
    if (avatar_url) {
      const base = avatar_url.split('?')[0]; // enlève un ancien ?v=
      avatar_url = `${base}?v=${Date.now()}`;
    }
    // Exemple : s'assurer que is_admin est cohérent si vous l'utilisez
    const is_admin = !!(u.is_admin || u.is_superuser || u.is_staff);
    return { ...u, avatar_url, is_admin };
  }

  login(data: UserLoginForm) {
    return this.http.post(`${environment.apiBaseUrl}/auth/login/`, data);
  }

  register(data: UserRegisterForm) {
    return this.http.post(`${environment.apiBaseUrl}/auth/register/`, data);
  }

  getCurrentUser() {
    if (!this.storageService.getToken()) return of(false);

    return this.http.get<User>(`${environment.apiBaseUrl}/auth/me`).pipe(
      tap({
        next: (user) => {
          // ⬇️ passe par le setter pour normaliser + notifier + persister
          this.user = user;
        }
      }),
      catchError((error) => {
        if (error.status === 403 || error.status === 401) {
          this.storageService.removeToken();
          this.user = null; // nettoie l’état local
        }
        return of(false);
      })
    );
  }

  logout() {
    this.user = null;
    this.storageService.removeToken();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.storageService.getToken() !== null;
  }

  submitOnboarding(data: OnboardingData) {
    return this.http.post(`${environment.apiBaseUrl}/auth/onboarding/`, data);
  }

  checkOnboardingCompleted(): Observable<boolean> {
    return this.http.get(`${environment.apiBaseUrl}/auth/onboarding/`).pipe(
      map(() => true),
      catchError((error) => {
        if (error.status === 404) return of(false);
        console.error("Erreur lors de la vérification de l'onboarding :", error);
        return of(false);
      })
    );
  }

  loginWithGoogle(idToken: string) {
    return this.http.post(`${environment.apiBaseUrl}/auth/social/google/`, {
      access_token: idToken
    }).pipe(
      catchError((err) => {
        console.error('Erreur Google login:', err);
        return throwError(() => err);
      })
    );
  }

  requestPasswordReset(email: string) {
    return this.http.post(`${environment.apiBaseUrl}/auth/password-reset/`, { email });
  }

  resetPassword(uid: string, token: string, password: string) {
    return this.http.post(`${environment.apiBaseUrl}/auth/password-reset/confirm/`, {
      uid, token, password
    });
  }

  updateCurrentUser(data: Partial<User>) {
    return this.http.patch<User>(`${environment.apiBaseUrl}/auth/me/`, data).pipe(
      tap((user) => {
        // ⬇️ une seule source de vérité
        this.user = user;
      })
    );
  }

  uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http.patch<User>(`${environment.apiBaseUrl}/auth/me/avatar/`, fd).pipe(
      tap((user) => {
        // ⬇️ pousse la version avec cache-busting
        this.user = user;
      })
    );
  }

  deleteAvatar() {
    return this.http.delete<User>(`${environment.apiBaseUrl}/auth/me/avatar/`).pipe(
      tap((user) => {
        this.user = user;
      })
    );
  }
}
