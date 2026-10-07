import api from "./api";
import type { OTPRequest, OTPVerify } from "@/types/auth.types";
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "@/types/api.types";

export const authService = {
  login: (data: AuthLoginRequest) => api.post<AuthLoginResponse>('/Auth/Login', data),
  sendOTP: (data: OTPRequest) => api.post("/v1/auth/send-otp", data),
  verifyOTP: (data: OTPVerify) => api.post<{ user: any; token: string }>("/v1/auth/verify-otp", data),
  getProfile: () => api.get("/v1/auth/profile"),
  resetPassword: (data: ResetPasswordRequest) => api.post<ResetPasswordResponse>('/user/resetPassword', data),
};
