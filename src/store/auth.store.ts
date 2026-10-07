import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthState, User } from "@/types/auth.types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user: User, token: string, refreshToken?: string) =>
        set({ user, token, refreshToken: refreshToken ?? null, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),

      setUser: (user: User) => set({ user }),
      setRefreshToken: (refreshToken: string | null) => set({ refreshToken }),
    }),
    {
      name: "super-steel-erp-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
