import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SuperuserGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate() {
    return this.auth.getCurrentUser().pipe(
      map((u: any) => {
        if (u && u.is_superuser) return true;
        this.router.navigate(['/dashboard']);
        return false;
      })
    );
  }
}
