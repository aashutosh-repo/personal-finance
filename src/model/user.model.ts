export interface UserProfile {
  id?: number | string;
  userId?: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  userName?: string;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface RegistrationRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  countryCode: string;
  currency?: string;
  dateOfBirth?: string;
  bio?: string;

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
