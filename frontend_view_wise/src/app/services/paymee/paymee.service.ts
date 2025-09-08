import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserPlan } from 'src/app/services/plan/plan.service';

export type PlanCode = 'PRO' | 'TEAM' | 'BUSINESS';

export interface PaymeeCheckoutRequest {
  plan_name: PlanCode;
}

export interface PaymeeCheckoutResponse {
  redirect_url: string;
  reference: string;
  expires_at?: string;
}

export interface PaymentConfirmResponse {
  paid: boolean;
  plan: UserPlan;
  amount: number;
  currency: string;
  reference: string;
  raw?: unknown;
}

@Injectable({ providedIn: 'root' })
export class PaymeeService {
  private base = `${environment.apiBaseUrl}/payments/paymee`;

  constructor(private http: HttpClient) {}

  /** Crée une session de paiement Paymee et retourne l'URL du checkout */
  initCheckout(planName: PlanCode): Observable<PaymeeCheckoutResponse> {
    const body: PaymeeCheckoutRequest = { plan_name: planName };
    return this.http.post<PaymeeCheckoutResponse>(`${this.base}/checkout`, body);
  }

  /** Confirme un paiement après retour success */
  confirm(reference: string): Observable<PaymentConfirmResponse> {
    const params = new HttpParams().set('reference', reference);
    return this.http.get<PaymentConfirmResponse>(`${this.base}/confirm`, { params });
  }
}
