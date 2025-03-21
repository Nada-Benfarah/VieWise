import { Injectable } from '@angular/core';

const TOKEN_KEY = 'access_token';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {}

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
}
