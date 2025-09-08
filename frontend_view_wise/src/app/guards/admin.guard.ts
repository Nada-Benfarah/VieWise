// src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(): boolean {
    try {
      const raw = localStorage.getItem('current_user');
      const user = raw ? JSON.parse(raw) : null;
      if (user?.is_admin || user?.is_superuser || user?.is_staff) return true;
    } catch {}
    this.router.navigate(['/']); // ou /login
    return false;
  }
}
