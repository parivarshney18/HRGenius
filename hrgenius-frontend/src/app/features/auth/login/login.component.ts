import { Component, inject, signal, OnInit, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { environment } from '../../../../environments/environment';

function emailOrUsernameValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const val = String(control.value).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9._-]{2,}$/;
  if (emailRegex.test(val) || usernameRegex.test(val)) {
    return null;
  }
  return { invalidIdentifier: true };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  public readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  hidePassword = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isLoading = signal(false);
  googleButtonRendered = signal(false);

  loginForm: FormGroup = this.fb.group({
    emailOrUsername: ['', [Validators.required, emailOrUsernameValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  quickAccounts = [
    { username: 'admin', label: 'Admin (alex)', role: 'ADMIN' },
    { username: 'hr', label: 'HR (sarah)', role: 'HR' },
    { username: 'manager', label: 'Manager (marcus)', role: 'MANAGER' },
    { username: 'employee', label: 'Employee (elena)', role: 'EMPLOYEE' },
  ];

  constructor() {
    // Re-render Google button whenever light/dark theme switches
    effect(() => {
      const isDark = this.themeService.isDark();
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        this.renderGoogleButton();
      }
    });
  }

  ngOnInit(): void {
    const resetStatus = this.route.snapshot.queryParamMap.get('reset');
    if (resetStatus === 'success') {
      this.successMessage.set('Password reset successfully! Please sign in with your new password.');
    }
  }

  ngAfterViewInit(): void {
    this.initGoogleIdentity();
  }

  private initGoogleIdentity(): void {
    let retries = 0;
    const maxRetries = 25; // 5 seconds polling
    const poll = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        this.renderGoogleButton();
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(poll, 200);
      }
    };
    poll();
  }

  private renderGoogleButton(): void {
    try {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.handleGoogleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const container = document.getElementById('googleBtn');
      if (container) {
        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: this.themeService.isDark() ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 370
        });
        this.googleButtonRendered.set(true);
      }
    } catch (err) {
      console.warn('GIS render notice:', err);
    }
  }

  triggerGoogleSignIn(): void {
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          this.errorMessage.set('Google sign-in popup was dismissed or blocked. Please check browser popups or client ID configuration.');
        }
      });
    } else {
      this.errorMessage.set('Google Identity Services SDK is initializing. Please wait a moment.');
    }
  }

  handleGoogleCredentialResponse(response: any): void {
    if (!response || !response.credential) {
      this.errorMessage.set('Google sign-in did not return a valid credential.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        if (result.success) {
          this.redirectAfterLogin();
        } else {
          this.errorMessage.set(result.message || 'Google sign-in failed. Please contact HR.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Google sign-in failed. No linked HRGenius account found.';
        this.errorMessage.set(msg);
      }
    });
  }

  fillAccount(username: string): void {
    this.loginForm.patchValue({
      emailOrUsername: username,
      password: '123456'
    });
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { emailOrUsername, password } = this.loginForm.value;
    this.authService.login(emailOrUsername, password).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        if (result.success) {
          this.redirectAfterLogin();
        } else {
          this.errorMessage.set(result.message || 'Login failed. Please verify your credentials.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Login failed. Please verify your credentials.');
      }
    });
  }

  private redirectAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl !== '/login') {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    const user = this.authService.currentUser();
    const role = user?.role;
    switch (role) {
      case 'ADMIN':
      case 'HR':
      case 'MANAGER':
      case 'EMPLOYEE':
      default:
        this.router.navigate(['/dashboard']);
        break;
    }
  }
}
