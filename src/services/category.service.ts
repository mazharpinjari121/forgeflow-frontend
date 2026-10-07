import api from "./api";
import type { ApiResponse, CategoryRecord, AddCategoryRequest, UpdateCategoryRequest } from "@/types/api.types";

export const categoryService = {
  // Get all categories with optional search
  getAllCategories: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return api.get<ApiResponse<CategoryRecord[]>>(`/category/allCategory${params}`);
  },

  // Get category by ID
  getCategoryById: (id: number) => api.get<ApiResponse<CategoryRecord>>(`/category/${id}`),

  // Add new category
  addCategory: (data: AddCategoryRequest) => api.post<ApiResponse<any>>('/category/addCategory', data),

  // Update existing category
  updateCategory: (data: UpdateCategoryRequest) => api.post<ApiResponse<any>>('/category/updateCategory', data),

  // Delete category
  updateCategoryStatus: (id: number, userId: number, isActive: boolean) => api.post<ApiResponse<any>>(`/category/updateCategoryStatus/${id}/${userId}/${isActive}`),
};
