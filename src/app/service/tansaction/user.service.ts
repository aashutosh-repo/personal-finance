import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest, ChangePasswordResponse } from '../../../model/user.model';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly BASE_URL = environment.apiUrl + '/api/v1/users';
  private http = inject(HttpClient);

  /**
   * Get user profile by ID
   */
  getUserProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE_URL}/${userId}`, {withCredentials: true});
  }

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE_URL}/profile`, {withCredentials: true});
  }

  /**
   * Update user profile
   */
  updateProfile(userId: number, profileData: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.BASE_URL}/${userId}`, profileData, {withCredentials: true});
  }

  /**
   * Change password
   */
  changePassword(userId: number, changePasswordData: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.BASE_URL}/${userId}/change-password`, changePasswordData, {withCredentials: true});
  }

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor(userId: number): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/${userId}/enable-2fa`, {}, {withCredentials: true});
  }

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor(userId: number): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/${userId}/disable-2fa`, {}, {withCredentials: true});
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(userId: number, file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserProfile>(`${this.BASE_URL}/${userId}/profile-picture`, formData, {withCredentials: true});
  }
}
