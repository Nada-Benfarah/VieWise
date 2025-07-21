import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PlanService } from '../services/plan/plan.service';
import { WorkflowService } from '../services/workflow/workflow.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowAccessGuard implements CanActivate {
  constructor(private workflowService: WorkflowService, private planService: PlanService, private router: Router) {
  }

  canActivate(): Observable<boolean> {
    return this.planService.getCurrentUserPlan().pipe(
      switchMap(plan => {
        if (plan?.name?.toLowerCase() === 'business') {
          return of(true);
        } else {
          // Vérifie s’il a des workflows partagés
          return this.workflowService.getAllWorkflows().pipe(
            map(workflows => {
              const hasShared = workflows.some(wf => !wf.owner); // 👈 shared
              if (hasShared) {
                return true;
              } else {
                this.router.navigate(['/pricing-plans']);
                return false;
              }
            }),
            catchError(() => {
              this.router.navigate(['/pricing-plans']);
              return of(false);
            })
          );
        }
      }),
      catchError(() => {
        this.router.navigate(['/pricing-plans']);
        return of(false);
      })
    );
  }
}
