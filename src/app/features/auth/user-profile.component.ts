import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SharedMaterialModules } from '../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../service/tansaction/user.service';
import { AuthService } from '../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserProfile } from '../../../model/user.model';
import { isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-user-profile',
  imports: [SharedMaterialModules],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  userProfile: UserProfile | null = null;
  isLoading = false;
  isPasswordChanging = false;
  showPasswordForm = false;
  isEditingProfile = false;
  profilePicturePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: [''],
      dateOfBirth: [''],
      address: [''],
      city: [''],
      country: [''],
      currency: ['USD']
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserProfile();
    }
  }

  loadUserProfile() {
    const userId = this.authService.getCurrentUserID();
    if (userId) {
      this.isLoading = true;
      this.userService.getUserProfile(userId).subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.applyProfileValues();
          if (profile.profilePicture) {
            this.profilePicturePreview = profile.profilePicture;
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.snackBar.open('Failed to load profile', 'Close', { duration: 4000 });
          this.isLoading = false;
        }
      });
    }
  }

  private applyProfileValues(): void {
    if (!this.userProfile) {
      return;
    }

    this.profileForm.patchValue({
      firstName: this.userProfile.firstName || '',
      lastName: this.userProfile.lastName || '',
      phoneNumber: this.userProfile.phoneNumber || '',
      dateOfBirth: this.userProfile.dateOfBirth || '',
      address: this.userProfile.address || '',
      city: this.userProfile.city || '',
      country: this.userProfile.country || '',
      currency: this.userProfile.currency || 'USD'
    });
    this.profileForm.disable();
    this.isEditingProfile = false;
  }

  startProfileEdit(): void {
    this.profileForm.enable();
    this.isEditingProfile = true;
  }

  cancelProfileEdit(): void {
    this.applyProfileValues();
  }

  onProfilePictureSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicturePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfilePicture() {
    if (!this.selectedFile) {
      this.snackBar.open('Please select a file', 'Close', { duration: 3000 });
      return;
    }

    const userId = this.authService.getCurrentUserID();
    if (!userId) return;

    this.isLoading = true;
    this.userService.uploadProfilePicture(userId, this.selectedFile).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.snackBar.open('Profile picture updated successfully', 'OK', { duration: 3000 });
        this.isLoading = false;
        this.selectedFile = null;
      },
      error: (err) => {
        this.snackBar.open('Failed to upload profile picture', 'Close', { duration: 4000 });
        this.isLoading = false;
      }
    });
  }

  updateProfile() {
    if (this.profileForm.valid) {
      const userId = this.authService.getCurrentUserID();
      if (!userId) return;

      this.isLoading = true;
      this.userService.updateProfile(userId, this.profileForm.getRawValue()).subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.applyProfileValues();
          this.snackBar.open('Profile updated successfully', 'OK', { duration: 3000 });
          this.isLoading = false;
        },
        error: (err) => {
          const errorMsg = err.error?.message || 'Failed to update profile';
          this.snackBar.open(errorMsg, 'Close', { duration: 4000 });
          this.isLoading = false;
        }
      });
    }
  }

  changePassword() {
    if (this.passwordForm.valid) {
      const userId = this.authService.getCurrentUserID();
      if (!userId) return;

      this.isPasswordChanging = true;
      this.userService.changePassword(userId, this.passwordForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Password changed successfully', 'OK', { duration: 3000 });
            this.passwordForm.reset();
            this.showPasswordForm = false;
          } else {
            this.snackBar.open(response.message, 'Close', { duration: 4000 });
          }
          this.isPasswordChanging = false;
        },
        error: (err) => {
          const errorMsg = err.error?.message || 'Failed to change password';
          this.snackBar.open(errorMsg, 'Close', { duration: 4000 });
          this.isPasswordChanging = false;
        }
      });
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }
}
