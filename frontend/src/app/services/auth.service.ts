import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { apiClient } from '../api/client';
import { AuthUser, LoginPayload, LoginResponse, MeResponse, UserRole } from '../interfaces/auth';

const TOKEN_STORAGE_KEY = 'kitchenflow_access_token';

type NavigationItem = {
  label: string;
  path: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(null);
  readonly loading = signal(false);
  readonly initialized = signal(false);
  readonly error = signal('');

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly role = computed(() => this.currentUser()?.role ?? null);
  readonly displayRole = computed(() => this.getRoleLabel(this.role()));
  readonly navigation = computed<NavigationItem[]>(() => {
    const role = this.role();

    if (role === 'ADMIN') {
      return [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Recetas', path: '/recetas' },
        { label: 'Producción', path: '/produccion' },
        { label: 'Abastecimiento', path: '/abastecimiento' },
        { label: 'Ventas', path: '/ventas' },
      ];
    }

    if (role === 'KITCHEN') {
      return [
        { label: 'Recetas', path: '/recetas' },
        { label: 'Producción', path: '/produccion' },
      ];
    }

    if (role === 'FLOOR') {
      return [{ label: 'Ventas', path: '/ventas' }];
    }

    return [];
  });

  private initializePromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized()) {
      return;
    }

    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = this.restoreSession()
      .catch(() => undefined)
      .finally(() => {
        this.initialized.set(true);
        this.initializePromise = null;
      });

    return this.initializePromise;
  }

  async login(payload: LoginPayload): Promise<boolean> {
    this.loading.set(true);
    this.error.set('');

    const { data, error } = await apiClient.POST('/api/auth/login', {
      body: payload,
    });

    if (error || !data) {
      this.error.set('No se pudo iniciar sesión con esas credenciales.');
      this.loading.set(false);
      return false;
    }

    const response = data as LoginResponse;
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    this.currentUser.set(response.user);
    this.initialized.set(true);
    this.loading.set(false);
    return true;
  }

  async restoreSession(): Promise<void> {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      this.currentUser.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { data, error } = await apiClient.GET('/api/auth/me');

    if (error || !data) {
      this.clearSession();
      this.loading.set(false);
      return;
    }

    const response = data as MeResponse;
    this.currentUser.set(response.user);
    this.loading.set(false);
  }

  logout(router?: Router): void {
    this.clearSession();
    if (router) {
      void router.navigateByUrl('/login');
    }
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.currentUser.set(null);
    this.error.set('');
  }

  canAccess(roles: UserRole[]): boolean {
    const role = this.role();
    return !!role && roles.includes(role);
  }

  getDefaultRoute(role = this.role()): string {
    switch (role) {
      case 'ADMIN':
        return '/dashboard';
      case 'KITCHEN':
        return '/produccion';
      case 'FLOOR':
        return '/ventas';
      default:
        return '/login';
    }
  }

  getRoleLabel(role: UserRole | null): string {
    switch (role) {
      case 'ADMIN':
        return 'ADMIN';
      case 'KITCHEN':
        return 'COCINA';
      case 'FLOOR':
        return 'PISO';
      default:
        return 'SIN SESIÓN';
    }
  }
}
