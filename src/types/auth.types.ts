export interface User {
  id: string;
  name: string;
  username: string;
  phone?: string;
  email?: string;
  role: string;
  department?: string;
  avatar?: string;
  permissions: string[];
  sidebarPermissions?: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setRefreshToken: (refreshToken: string | null) => void;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerify {
  phone: string;
  otp: string;
}
