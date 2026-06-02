import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

type AuthResponse = {
  userId: number;
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
  private readonly currentUser = signal<AuthResponse | undefined>(this.loadFromStorage());

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
        this.http.post<AuthResponse>(`${this.authBaseUrl}/register`, {
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
        this.http.post<AuthResponse>(`${this.authBaseUrl}/login`, {
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

  currentUserId(): number | undefined {
    return this.currentUser()?.userId;
  }

  private loadFromStorage(): AuthResponse | undefined {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? this.parseUser(stored) : undefined;
  }

  // Validates shape to avoid accepting malformed or tampered storage data
  private parseUser(json: string): AuthResponse | undefined {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed.userId === 'number' && typeof parsed.username === 'string') {
        return { userId: parsed.userId, username: parsed.username };
      }
    } catch {
      // ignore invalid JSON
    }
    return undefined;
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
