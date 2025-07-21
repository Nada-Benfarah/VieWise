// guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const currentUser = this.getCurrentUser();

    if (currentUser) {
      return of(true); // ✅ accès autorisé
    }

    this.router.navigate(['/login']);
    return of(false);
  }

  private getCurrentUser(): any {
    // 1. Priorité à l’utilisateur en mémoire
    if (this.authService.user) {
      return this.authService.user;
    }

    // 2. Sinon vérifie dans localStorage
    const userJson = localStorage.getItem('current_user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }

    return null;
  }
}
