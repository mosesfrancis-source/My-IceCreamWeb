import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseApp, FirebaseError, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { User } from '../Models/user';
import { firebaseConfig } from './firebase.config';
import { ownerAdminEmail } from './admin.config';

const SESSION_KEY = 'icecream-current-user';
const AUTH_TIMEOUT_MS = 12000;
const TOKEN_TIMEOUT_MS = 8000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly app: FirebaseApp =
    getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  private readonly auth: Auth = getAuth(this.app);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  private readonly authReady = new Promise<void>((resolve) => {
    this.resolveAuthReady = resolve;
  });
  private resolveAuthReady: (() => void) | null = null;
  private authReadyResolved = false;
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      void this.syncCurrentUser(firebaseUser);

      if (!this.authReadyResolved) {
        this.authReadyResolved = true;
        this.resolveAuthReady?.();
      }
    });
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async login(email: string, password: string): Promise<AuthOutcome> {
    if (!email || !password) {
      return {
        ok: false,
        errorCode: 'auth/missing-credentials',
        errorMessage: 'Please enter both email and password.',
      };
    }

    try {
      const credential = await this.withTimeout(
        signInWithEmailAndPassword(this.auth, email, password),
        AUTH_TIMEOUT_MS,
        'auth/timeout',
      );
      const user = await this.syncCurrentUser(credential.user);
      return { ok: true, user: user ?? this.mapFirebaseUser(credential.user, {}) };
    } catch (error) {
      return {
        ok: false,
        errorCode: this.getAuthErrorCode(error),
        errorMessage: this.toFriendlyAuthMessage(error),
      };
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthOutcome> {
    if (!name || !email || !password) {
      return {
        ok: false,
        errorCode: 'auth/missing-fields',
        errorMessage: 'Please complete all required fields.',
      };
    }

    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await credential.user.reload();
      const user = await this.syncCurrentUser(this.auth.currentUser ?? credential.user);
      return { ok: true, user: user ?? this.mapFirebaseUser(credential.user, {}) };
    } catch (error) {
      return {
        ok: false,
        errorCode: this.getAuthErrorCode(error),
        errorMessage: this.toFriendlyAuthMessage(error),
      };
    }
  }

  async sendPasswordResetEmail(email: string): Promise<boolean> {
    if (!email) {
      return false;
    }

    try {
      await sendPasswordResetEmail(this.auth, email);
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } finally {
      this.clearStoredUser();
    }
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    await this.waitForAuthReady();

    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    try {
      return await firebaseUser.getIdToken(forceRefresh);
    } catch {
      return null;
    }
  }

  private async syncCurrentUser(firebaseUser: FirebaseUser | null): Promise<User | null> {
    if (!firebaseUser) {
      this.clearStoredUser();
      return null;
    }

    let claims: Record<string, unknown> = {};

    try {
      const tokenResult = await this.withTimeout(
        firebaseUser.getIdTokenResult(),
        TOKEN_TIMEOUT_MS,
        'auth/token-timeout',
      );
      claims = tokenResult.claims as Record<string, unknown>;
    } catch {
      claims = {};
    }

    const user = this.mapFirebaseUser(firebaseUser, claims);
    this.persistUser(user);
    return user;
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser, claims: Record<string, unknown>): User {
    const displayName = firebaseUser.displayName?.trim();
    const emailName = firebaseUser.email?.split('@')[0]?.trim();
    const normalizedEmail = (firebaseUser.email ?? '').toLowerCase();
    const isOwner = normalizedEmail === ownerAdminEmail.toLowerCase();

    return {
      id: firebaseUser.uid,
      name: displayName || emailName || 'User',
      email: firebaseUser.email ?? '',
      role: claims['admin'] === true || isOwner ? 'admin' : 'customer',
    };
  }

  private persistUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  private clearStoredUser(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<User>;

      return {
        id: String(parsed.id ?? ''),
        name: typeof parsed.name === 'string' ? parsed.name : 'User',
        email: typeof parsed.email === 'string' ? parsed.email : '',
        role: parsed.role === 'admin' ? 'admin' : 'customer',
      };
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  private toFriendlyAuthMessage(error: unknown): string {
    if (!this.isFirebaseError(error)) {
      return 'Unable to sign in right now. Please try again.';
    }

    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email or password is incorrect.';
      case 'auth/invalid-email':
        return 'That email address is not valid.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is disabled in Firebase. Enable it in Authentication.';
      case 'auth/popup-blocked':
        return 'A sign-in popup was blocked by the browser.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      case 'auth/timeout':
      case 'auth/token-timeout':
        return 'Sign-in timed out. Please check your connection and try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a bit and try again.';
      default:
        return error.message || 'Unable to sign in right now. Please try again.';
    }
  }

  private isFirebaseError(error: unknown): error is FirebaseError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  private getAuthErrorCode(error: unknown): string {
    if (!this.isFirebaseError(error)) {
      return 'unknown';
    }

    return error.code;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject({ code, message: 'Operation timed out.' });
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async waitForAuthReady(): Promise<void> {
    try {
      await this.withTimeout(this.authReady, TOKEN_TIMEOUT_MS, 'auth/init-timeout');
    } catch {
      // If init times out, callers continue and handle missing token gracefully.
    }
  }
}

interface AuthOutcome {
  ok: boolean;
  user?: User;
  errorCode?: string;
  errorMessage?: string;
}
