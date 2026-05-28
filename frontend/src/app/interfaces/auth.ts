export type UserRole = 'ADMIN' | 'KITCHEN' | 'FLOOR';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
  timestamp: string;
}

export interface MeResponse {
  user: AuthUser;
  timestamp: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
