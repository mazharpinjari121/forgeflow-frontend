import api from "./api";
import type { ApiResponse } from "@/types/api.types";

export interface StockProductionRecord {
  productionId: number;
  productId: number;
  productName: string;
  productionDate: string;
  qty: number;
  remark: string;
  isActive: boolean;
}

export interface AddStockProductionRequest {
  productionId: number;
  productId: number;
  productionDate: string;
  qty: number;
  remark: string;
  userId: number;
}

export const stockService = {
  addStockProduction: (data: AddStockProductionRequest) =>
    api.post<ApiResponse<any>>("/stockproduction/add", data),

  getStockProductionById: (id: number) =>
    api.get<ApiResponse<StockProductionRecord>>(`/stockproduction/${id}`),

  getAllStockProductions: (filters?: {
    categoryId?: number;
    productId?: number;
    fromDate?: string;
    toDate?: string;
    isActive?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.categoryId !== undefined) params.append("categoryId", filters.categoryId.toString());
      if (filters.productId !== undefined) params.append("productId", filters.productId.toString());
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      if (filters.isActive !== undefined) params.append("isActive", filters.isActive.toString());
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return api.get<ApiResponse<StockProductionRecord[]>>(`/stockproduction/all${queryString}`);
  },

  deleteStockProduction: (id: number, userId?: number) => {
    const param = userId !== undefined ? `?userId=${userId}` : "";
    return api.post<ApiResponse<any>>(`/stockproduction/delete/${id}${param}`);
  },
};
