import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  hidePassword = signal(true);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  quickAccounts = [
    { username: 'admin', label: 'Admin (alex)', role: 'ADMIN', color: '#fee2e2' },
    { username: 'hr', label: 'HR (sarah)', role: 'HR', color: '#ede9fe' },
    { username: 'manager', label: 'Manager (marcus)', role: 'MANAGER', color: '#e0f2fe' },
    { username: 'employee', label: 'Employee (elena)', role: 'EMPLOYEE', color: '#dcfce7' },
  ];

  fillAccount(username: string): void {
    this.loginForm.patchValue({
      username,
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

    const { username, password } = this.loginForm.value;
    this.authService.login(username, password).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        if (result.success) {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
          this.router.navigateByUrl(returnUrl);
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

}
