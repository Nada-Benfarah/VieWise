import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';

export interface UserPlan {
  name: string;
  credits_nbr?: number;
  data_source_size?: string;
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private baseUrl = 'http://localhost:8000/api/subscriptions';
  private currentPlanSubject = new BehaviorSubject<UserPlan | null>(null);
  currentPlan$ = this.currentPlanSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCurrentUserPlan(): Observable<UserPlan> {
    return this.http.get<UserPlan>(`${this.baseUrl}/my-plan/`).pipe(
      tap((plan) => this.currentPlanSubject.next(plan))
    );
  }

  refreshCurrentPlan(): Observable<UserPlan> {
    return this.http.get<UserPlan>(`${this.baseUrl}/my-plan/`).pipe(
      tap((plan) => this.currentPlanSubject.next(plan))
    );
  }

  upgradePlan(planName: string): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/upgrade-plan/`, { plan_name: planName })
      .pipe(switchMap(() => this.refreshCurrentPlan()));
  }

  getPlanUserCounts() {
    return this.http.get<{ plans: { name: string; count: number }[] }>(
      `${this.baseUrl}/plan-user-counts/`
    );
  }
}
