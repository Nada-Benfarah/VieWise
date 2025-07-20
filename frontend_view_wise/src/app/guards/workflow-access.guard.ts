import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PlanService } from '../services/plan/plan.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowAccessGuard implements CanActivate {
  constructor(private planService: PlanService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.planService.getCurrentUserPlan().pipe(
      map((plan) => {
        if (plan?.name?.toLowerCase() === 'business') {
          return true; // autorisé
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
}
