import { Injectable, computed, signal } from '@angular/core';

type UserRecord = {
  username: string;
  password: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Saved only in memory for now. (intermediate hand-in)
  private readonly users = signal<UserRecord[]>([
    { username: 'asdf', password: 'asdf' },
  ]);
  private readonly currentUser = signal<string | undefined>(undefined);

  private readonly loggedIn = computed(() => this.currentUser() !== undefined);

  register(username: string, password: string): boolean {
    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      return false;
    }

    const userExists = this.users().some((user) => user.username === normalizedUsername);
    if (userExists) {
      return false;
    }

    this.users.update((currentUsers) => [
      ...currentUsers,
      { username: normalizedUsername, password },
    ]);
    return true;
  }

  login(username: string, password: string): boolean {
    const normalizedUsername = username.trim();
    const user = this.users().find(
      (existingUser) =>
        existingUser.username === normalizedUsername && existingUser.password === password
    );

    if (!user) {
      return false;
    }

    this.currentUser.set(user.username);
    return true;
  }

  logout(): void {
    this.currentUser.set(undefined);
  }

  isLoggedIn(): boolean {
    return this.loggedIn();
  }

  currentUsername(): string | undefined {
    return this.currentUser();
  }
}
