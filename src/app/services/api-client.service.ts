import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBase = 'http://127.0.0.1:8000/api';

  async get<T>(path: string, useAuth = false): Promise<T> {
    return await firstValueFrom(
      this.http.get<T>(this.buildUrl(path), {
        headers: await this.buildHeaders(useAuth),
      }),
    );
  }

  async post<T>(path: string, body: unknown, useAuth = false): Promise<T> {
    return await firstValueFrom(
      this.http.post<T>(this.buildUrl(path), body, {
        headers: await this.buildHeaders(useAuth),
      }),
    );
  }

  async patch<T>(path: string, body: unknown, useAuth = false): Promise<T> {
    return await firstValueFrom(
      this.http.patch<T>(this.buildUrl(path), body, {
        headers: await this.buildHeaders(useAuth),
      }),
    );
  }

  async put<T>(path: string, body: unknown, useAuth = false): Promise<T> {
    return await firstValueFrom(
      this.http.put<T>(this.buildUrl(path), body, {
        headers: await this.buildHeaders(useAuth),
      }),
    );
  }

  async delete(path: string, useAuth = false): Promise<void> {
    await firstValueFrom(
      this.http.delete(this.buildUrl(path), {
        headers: await this.buildHeaders(useAuth),
      }),
    );
  }

  private buildUrl(path: string): string {
    if (path.startsWith('/')) {
      return `${this.apiBase}${path}`;
    }

    return `${this.apiBase}/${path}`;
  }

  private async buildHeaders(useAuth: boolean): Promise<HttpHeaders> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (!useAuth) {
      return headers;
    }

    const token = await this.authService.getIdToken();
    if (!token) {
      return headers;
    }

    headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }
}
