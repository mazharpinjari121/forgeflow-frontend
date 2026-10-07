import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const { user, token, refreshToken, isAuthenticated, login, logout, setUser, setRefreshToken } = useAuthStore();

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.includes(user?.role ?? "");
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    setUser,
    hasPermission,
    hasRole,
    hasAnyRole,
  };
}
