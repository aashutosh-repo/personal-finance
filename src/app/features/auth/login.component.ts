import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SharedMaterialModules } from '../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { AuthService } from '../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserStorageService } from '../../service/auth/BrowserStorageService.service';
import { isPlatformBrowser } from '@angular/common';

class LoginErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.touched || control.dirty));
  }
}

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [SharedMaterialModules,RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  hide = true;
  isLoading = false;
  loginForm: FormGroup;
  emailErrorMatcher: LoginErrorStateMatcher;
  passwordErrorMatcher: LoginErrorStateMatcher;

  constructor(private fb: FormBuilder,
    private storage: BrowserStorageService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object,

  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });

    this.emailErrorMatcher = new LoginErrorStateMatcher();
    this.passwordErrorMatcher = new LoginErrorStateMatcher();
  }

  focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.loginForm.controls).find((controlName) => this.loginForm.get(controlName)?.invalid);

    if (!firstInvalidControl) {
      return;
    }

    const elementId = `login-${firstInvalidControl}`;
    const field = document.getElementById(elementId) as HTMLInputElement | null;
    if (field) {
      field.focus();
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.authService.setSessionItem('user', JSON.stringify(response.user));
        this.snackBar.open('Login successful!', 'OK', { duration: 3000 });
        this.router.navigate(['/v1/dashboard']); // redirect to home page
      },
      error: (err) => {
        // Show a friendly message for authentication failures and avoid exposing raw HTTP errors
        this.isLoading = false;
        if (err && err.status === 401) {
          this.snackBar.open('Wrong email or password. Please try again.', 'Close', { duration: 5000 });
        } else if (err && err.error && err.error.message) {
          this.snackBar.open(err.error.message, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open('Login failed. Please try again later.', 'Close', { duration: 5000 });
        }
      }
    });
  }
}
