import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error.error instanceof ErrorEvent) {
        // Client-side network or DOM error
        errorMessage = `Network Error: ${error.error.message}`;
      } else {
        // Server response code
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Invalid request. Please verify the submitted data.';
            break;
          case 401:
            errorMessage = 'Authentication expired or invalid credentials. Please log in.';
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission for this resource.';
            break;
          case 404:
            errorMessage = error.error?.message || 'Requested resource could not be found.';
            break;
          case 409:
            errorMessage = error.error?.message || 'Conflict detected with existing record.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || `HTTP Error ${error.status}: ${error.statusText || 'Unknown error'}`;
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
