export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;           
  refreshToken?: string;
  user?: {
    id: number;
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