import api from "./api";
import type {
  ApiResponse,
  AddOrderReturnRequest,
  UpdateOrderReturnRequest,
  OrderReturnRecord
} from "@/types/api.types";

export const orderReturnService = {
  // Get all order returns with optional filters
  getAllOrderReturns: async (filters?: {
    ReturnId?: number;
    OrderId?: number;
    PartyId?: number;
    FromDate?: string;
    ToDate?: string;
    IsActive?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          params.append(key, val.toString());
        }
      });
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return api.get<ApiResponse<OrderReturnRecord[]>>(`/orderreturn/all${queryString}`);
  },

  // Get order return by ID
  getOrderReturnById: (id: number) =>
    api.get<ApiResponse<OrderReturnRecord>>(`/orderreturn/${id}`),

  // Add new order return
  addOrderReturn: (data: AddOrderReturnRequest) =>
    api.post<ApiResponse<string>>("/orderreturn/add", data),

  // Update existing order return
  updateOrderReturn: (data: UpdateOrderReturnRequest) =>
    api.post<ApiResponse<string>>("/orderreturn/update", data),

  // Delete order return
  deleteOrderReturn: (id: number, userId?: number) => {
    const queryString = userId !== undefined ? `?userId=${userId}` : "";
    return api.post<ApiResponse<string>>(`/orderreturn/${id}${queryString}`);
  },
};
