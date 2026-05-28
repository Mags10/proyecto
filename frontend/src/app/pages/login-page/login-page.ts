import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardInputDirective } from '../../shared/components/input';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, ZardCardComponent, ZardButtonComponent, ZardInputDirective],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authService = inject(AuthService);
  readonly submitAttempted = signal(false);

  readonly loginForm = this.formBuilder.group({
    email: ['admin@kitchenflow.local', [Validators.required, Validators.email]],
    password: ['Admin123!', [Validators.required, Validators.minLength(6)]]
  });

  readonly demoAccounts = computed(() => [
    { label: 'Admin', email: 'admin@kitchenflow.local', password: 'Admin123!' },
    { label: 'Cocina', email: 'cocina@kitchenflow.local', password: 'Cocina123!' },
    { label: 'Piso', email: 'piso@kitchenflow.local', password: 'Piso123!' }
  ]);

  async submit(): Promise<void> {
    this.submitAttempted.set(true);
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const success = await this.authService.login(this.loginForm.getRawValue());
    if (!success) {
      return;
    }

    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    await this.router.navigateByUrl(redirect || this.authService.getDefaultRoute());
  }

  useDemoAccount(email: string, password: string): void {
    this.loginForm.setValue({ email, password });
  }
}
