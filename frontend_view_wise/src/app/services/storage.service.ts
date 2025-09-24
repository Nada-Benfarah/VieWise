import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';

const TOKEN_KEY = 'access_token';

interface StorageUsageRes {
  bytes_used: number;
  human: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private base = `${environment.apiBaseUrl.replace(/\/+$/, '')}/api/agents`;
  private _used$ = new BehaviorSubject<{ bytes: number; human: string }>({ bytes: 0, human: '0 B' });

  used$ = this._used$.asObservable();
  constructor(private http: HttpClient) {}

  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to set token in local storage', error);
    }
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token from local storage', error);
      return null;
    }
  }

  removeToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token from local storage', error);
    }
  }

  hasToken(): boolean {
    return localStorage.getItem(TOKEN_KEY) !== null;
  }

  clearStorage() {
    localStorage.clear();
  }

  refresh(): Observable<StorageUsageRes> {
    return this.http.get<StorageUsageRes>(`${this.base}/storage-usage/`).pipe(
      tap((res) => this._used$.next({ bytes: res.bytes_used, human: res.human }))
    );
  }

  get human(): string {
    return this._used$.value.human;
  }
  get bytes(): number {
    return this._used$.value.bytes;
  }
}
