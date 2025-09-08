import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PlanService } from '../services/plan/plan.service';
import { WorkflowService } from '../services/workflow/workflow.service';

@Injectable({ providedIn: 'root' })
export class WorkflowAccessGuard implements CanActivate {
  constructor(
    private workflowService: WorkflowService,
    private planService: PlanService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // 1) Admin → accès direct
    if (this.isAdmin()) {
      return of(true);
    }

    // 2) Plan Business → accès
    return this.planService.getCurrentUserPlan().pipe(
      switchMap(plan => {
        const isBusiness = (plan?.name ?? '').toLowerCase() === 'business';
        if (isBusiness) {
          return of(true);
        }

        // 3) Non-Business → vérifier s’il a des workflows partagés
        return this.workflowService.getMyWorkflows().pipe(
          map(workflows => {
            // partagé = accessible mais pas owner
            const hasShared = (workflows ?? []).some((wf: any) => !wf?.owner);
            if (hasShared) return true;

            this.router.navigate(['/pricing-plans']);
            return false;
          }),
          catchError(() => {
            this.router.navigate(['/pricing-plans']);
            return of(false);
          })
        );
      }),
      catchError(() => {
        this.router.navigate(['/pricing-plans']);
        return of(false);
      })
    );
  }

  private isAdmin(): boolean {
    try {
      const raw = localStorage.getItem('current_user');
      const u = raw ? JSON.parse(raw) : null;
      return !!(u?.is_admin || u?.is_staff || u?.is_superuser);
    } catch {
      return false;
    }
  }
}
