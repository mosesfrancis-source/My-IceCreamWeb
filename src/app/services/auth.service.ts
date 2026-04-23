import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../Models/user';

const SESSION_KEY = 'icecream-current-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): boolean {
    if (!email || !password) {
      return false;
    }

    const role: User['role'] = email.endsWith('@admin.com') ? 'admin' : 'customer';
    const user: User = {
      id: 1,
      name: email.split('@')[0],
      email,
      role,
    };

    this.currentUserSubject.next(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true;
  }

  register(name: string, email: string, password: string): boolean {
    if (!name || !email || !password) {
      return false;
    }

    return this.login(email, password);
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(SESSION_KEY);
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
