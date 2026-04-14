import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { SharedMaterialModules } from '../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserStorageService } from '../../service/auth/BrowserStorageService.service';
import { isPlatformBrowser } from '@angular/common';
import { RegistrationRequest } from '../../../model/loginRequest.model';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [SharedMaterialModules],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  hide = true;
  hideConfirm = true;
  registerForm: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder,
    private storage: BrowserStorageService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      this.isLoading = true;
      const registrationData: RegistrationRequest = {
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
      };

      this.authService.register(registrationData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Registration successful! Please login with your credentials.', 'OK', { duration: 4000 });
            this.router.navigate(['/login']);
          } else {
            this.snackBar.open(response.message || 'Registration failed', 'Close', { duration: 4000 });
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          const errorMsg = err.error?.message || err.message || 'Registration failed';
          this.snackBar.open(errorMsg, 'Close', { duration: 4000 });
        }
      });
    }
  }
}
