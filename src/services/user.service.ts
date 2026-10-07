import api from "./api";
import type { ApiResponse, UserRecord, UserRequest, UserUpdateRequest } from "@/types/api.types";

export const userService = {
  // Get all users with optional search
  getAllUsers: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return api.get<ApiResponse<UserRecord[]>>(`/user/all${params}`);
  },

  // Get user by ID
  getUserById: (id: number) => api.get<ApiResponse<UserRecord>>(`/user/${id}`),

  // Add new user
  addUser: (data: UserRequest) => api.post<ApiResponse<any>>('/user/add', data),

  // Update existing user
  updateUser: (data: UserUpdateRequest) => api.post<ApiResponse<any>>('/user/update', data),

  // Delete user
  deleteUser: (id: number, userId: number) => api.post<ApiResponse<any>>(`/user/delete/${id}/${userId}`),
};
