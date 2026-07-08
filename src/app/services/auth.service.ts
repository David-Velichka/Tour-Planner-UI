import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

type AuthUser = {
  token: string;
  username: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_user';
  private readonly http = inject(HttpClient);
  private readonly authBaseUrl = 'http://localhost:8080/api/auth';
  // Initialize from localStorage so state survives page reload and tab duplication
  private readonly currentUser = signal<AuthUser | undefined>(this.loadFromStorage());

  private readonly loggedIn = computed(() => this.currentUser() !== undefined);

  constructor() {
    // Sync auth state across tabs: when another tab logs out or in, update this tab's signal
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === this.STORAGE_KEY) {
        this.currentUser.set(event.newValue ? this.parseUser(event.newValue) : undefined);
      }
    });
  }

  async register(username: string, password: string): Promise<string | null> {
    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      return 'Username and password are required.';
    }

    try {
      await firstValueFrom(
        this.http.post<AuthUser>(`${this.authBaseUrl}/register`, {
          username: normalizedUsername,
          password,
        })
      );
      return null;
    } catch (error) {
      return this.readErrorMessage(error) ?? 'Registration failed.';
    }
  }

  async login(username: string, password: string): Promise<string | null> {
    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      return 'Username and password are required.';
    }

    try {
      const response = await firstValueFrom(
        this.http.post<AuthUser>(`${this.authBaseUrl}/login`, {
          username: normalizedUsername,
          password,
        })
      );
      this.currentUser.set(response);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response));
      return null;
    } catch (error) {
      return this.readErrorMessage(error) ?? 'Login failed.';
    }
  }

  logout(): void {
    this.currentUser.set(undefined);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    return this.loggedIn();
  }

  currentUsername(): string | undefined {
    return this.currentUser()?.username;
  }

  currentToken(): string | undefined {
    return this.currentUser()?.token;
  }

  private loadFromStorage(): AuthUser | undefined {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return undefined;

    const user = this.parseUser(stored);
    if (!user) return undefined;

    // Auto-logout if the stored token is already expired
    if (this.isTokenExpired(user.token)) {
      localStorage.removeItem(this.STORAGE_KEY);
      return undefined;
    }

    return user;
  }

  // Validates shape to avoid accepting malformed or tampered storage data
  private parseUser(json: string): AuthUser | undefined {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed.token === 'string' && parsed.token.trim() &&
          typeof parsed.username === 'string') {
        return { token: parsed.token, username: parsed.username };
      }
    } catch {
      // ignore invalid JSON
    }
    return undefined;
  }

  /** Decode JWT payload (base64) and check exp claim vs current time. */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000;
    } catch {
      return true; // treat unreadable token as expired
    }
  }

  private readErrorMessage(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    const body = error.error as { message?: string } | null;
    if (body && typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }

    return null;
  }
}
