/**
 * 인증 관련 타입 정의
 */

export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  candidateProfile?: CandidateProfile;
  recruiterProfile?: RecruiterProfile;
}

export interface CandidateProfile {
  id: string;
  skills: string[];
  experience?: number;
  desiredPosition?: string;
}

export interface RecruiterProfile {
  id: string;
  companyName: string;
  position: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

