import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private baseUrl = 'http://localhost:8000/api/subscriptions';

  constructor(private http: HttpClient) {}

  getCurrentUserPlan(): Observable<any> {
    return this.http.get(`${this.baseUrl}/my-plan/`);
  }
  upgradePlan(planName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/upgrade-plan/`, { plan_name: planName });
  }

}
