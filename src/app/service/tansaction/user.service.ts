import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest, ChangePasswordResponse } from '../../../model/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly BASE_URL = 'http://localhost:8080/api/v1/users';
  private http = inject(HttpClient);

  /**
   * Get user profile by ID
   */
  getUserProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE_URL}/${userId}`);
  }

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE_URL}/profile`);
  }

  /**
   * Update user profile
   */
  updateProfile(userId: number, profileData: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.BASE_URL}/${userId}`, profileData);
  }

  /**
   * Change password
   */
  changePassword(userId: number, changePasswordData: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.BASE_URL}/${userId}/change-password`, changePasswordData);
  }

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor(userId: number): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/${userId}/enable-2fa`, {});
  }

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor(userId: number): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/${userId}/disable-2fa`, {});
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(userId: number, file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserProfile>(`${this.BASE_URL}/${userId}/profile-picture`, formData);
  }
}
