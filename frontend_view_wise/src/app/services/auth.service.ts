import { StorageService } from './storage.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UserLoginForm {
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface UserRegisterForm {
  username: string;
  email: string;
  password: string;
}
export interface OnboardingData {
  discovery: string;
  role: string;
  goal: string;
  company_size: string;
}



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private $user = new BehaviorSubject<User | null>(null);
  private router = inject(Router);

  constructor(private http: HttpClient, private storageService:StorageService) {}

  // private API_URL = 'http://localhost:8000/api/logout';



  get user(): Observable<User | null> {
    return this.$user.asObservable();
  }

  set user(user: User | null) {
    this.$user.next(user);
  }

  login(data: UserLoginForm) {
    return this.http.post(`${environment.apiBaseUrl}/auth/login/`, data);
  }

  register(data: UserRegisterForm) {
    return this.http.post(`${environment.apiBaseUrl}/auth/register/`, data);
  }

  getCurrentUser() {
    if(!this.storageService.getToken()) return of(false);

    return this.http.get(`${environment.apiBaseUrl}/auth/user`).pipe(
      tap({
        next: (user: User) => {
          this.$user.next(user);
        }
      }),
      catchError((error) => {
        if(error.status === 403 || error.status === 401){
          this.storageService.removeToken();
        }
        return of(false);
      })
    );
  }



  logout() {
    this.$user.next(null);
    this.storageService.removeToken();
    this.router.navigate(["/login"]);
  }


  isLoggedIn(): boolean {
    return this.storageService.getToken() !== null; // Check if token exists
  }

  submitOnboarding(data: OnboardingData) {
    return this.http.post(`${environment.apiBaseUrl}/auth/onboarding/`, data);
  }
  checkOnboardingCompleted(): Observable<boolean> {
    return this.http.get(`${environment.apiBaseUrl}/auth/onboarding/`).pipe(
      map(() => true), // Si la requête réussit, l'onboarding est complété
      catchError((error) => {
        if (error.status === 404) {
          // Si l'API renvoie 404, cela signifie que l'onboarding n'est pas encore complété
          return of(false);
        } else {
          // Pour toute autre erreur, on peut soit la propager, soit retourner false
          console.error('Erreur lors de la vérification de l\'onboarding :', error);
          return of(false);
        }
      })
    );
  }

  loginWithGoogle(idToken: string) {
    return this.http.post(`${environment.apiBaseUrl}/auth/social/google/`, {
      access_token: idToken
    }).pipe(
      catchError((err) => {
        console.error('Erreur Google login:', err);
        return throwError(() => err); // ← on renvoie l'erreur d'origine
      })
    );
  }




}
