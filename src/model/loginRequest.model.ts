export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;           
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface UserResponse {
    token: string;
    userName: string;
    firstName: string|null;
    lastName: string|null;
    lastLogin?: string;
    expiryTime?: string;
}

export interface RegistrationRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}