import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { map, Observable, of, switchMap, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.user.pipe(
      switchMap((connectedUser) => {
        if (connectedUser != null) {
          return this.authService.checkOnboardingCompleted().pipe(
            map((completed) => {
              const tryingToAccessWelcome = route.routeConfig?.path === 'welcome';

              if (completed) {
                if (tryingToAccessWelcome) {
                  // ⚡ L'utilisateur a terminé l'onboarding mais tente d'accéder à /welcome => On l'envoie vers le dashboard
                  this.router.navigate(['/']);
                  return false;
                }
                return true;
              } else {
                if (tryingToAccessWelcome) {
                  // L'utilisateur n'a pas terminé, et il est sur /welcome => OK
                  return true;
                }
                // 🚫 Il essaie d'aller ailleurs sans avoir terminé => bloqué vers /welcome
                this.router.navigate(['/welcome']);
                return false;
              }
            }),
            catchError((error) => {
              console.error('Erreur check onboarding :', error);
              this.router.navigate(['/welcome']);
              return of(false);
            })
          );
        } else {
          this.router.navigate(['/login']);
          return of(false);
        }
      })
    );
  }
}
