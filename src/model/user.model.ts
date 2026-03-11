export interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  profilePicture?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}
