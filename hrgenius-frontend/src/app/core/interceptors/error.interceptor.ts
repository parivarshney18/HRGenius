import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error.error instanceof ErrorEvent) {
        // Client-side network or DOM error
        errorMessage = `Network Error: ${error.error.message}`;
      } else {
        // Server response with backend "message" field priority
        const backendMessage = error.error?.message || (typeof error.error === 'string' ? error.error : null);

        if (backendMessage) {
          errorMessage = backendMessage;
        } else {
          switch (error.status) {
            case 400:
              errorMessage = 'Invalid request. Please verify the submitted data.';
              break;
            case 401:
              errorMessage = 'Authentication expired or invalid credentials. Please log in.';
              break;
            case 403:
              errorMessage = 'Access denied. You do not have permission for this resource.';
              break;
            case 404:
              errorMessage = 'Requested resource could not be found.';
              break;
            case 409:
              errorMessage = 'Conflict detected with existing record.';
              break;
            case 500:
              errorMessage = 'Internal server error. Please try again later.';
              break;
            default:
              errorMessage = `HTTP Error ${error.status}: ${error.statusText || 'Unknown error'}`;
          }
        }

        // On 401 unauthorized, redirect to /login (unless already on login request)
        if (error.status === 401 && !req.url.includes('/api/auth/login')) {
          localStorage.removeItem('hrgenius_jwt_token');
          localStorage.removeItem('token');
          localStorage.removeItem('hrgenius_auth_user');
          router.navigate(['/login']);
        }
      }

      snackBar.open(errorMessage, 'Dismiss', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });

      return throwError(() => error);
    })
  );
};

