import api from "./api";
import type { ApiResponse } from "@/types/api.types";

export interface DashboardSummary {
  todayOrderSale: number;
  todayOrderReturn: number;
  activeBookings: number;
  overdueOrder: number;
  outstandingBalance: number;
}

export interface LowStockProduct {
  productId: number;
  productName: string;
  availableQty: number;
  minimumStockAlert: number;
}

export interface ChartDataItem {
  label: string;
  salesAmount: number;
  returnAmount: number;
}

export const dashboardService = {
  getDashboard: async (todayDate?: string) => {
    const params = new URLSearchParams();
    if (todayDate) {
      params.append("todayDate", todayDate);
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return api.get<ApiResponse<DashboardSummary>>(`/dashboard/GetDashboard${queryString}`);
  },

  getProductLowStockAlert: async () => {
    return api.get<ApiResponse<LowStockProduct[]>>("/dashboard/getproductlowstockalert");
  },

  getSalesReturnChart: async (params?: {
    type?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, val.toString());
        }
      });
    }
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return api.get<ApiResponse<ChartDataItem[]>>(`/dashboard/GetSalesReturnChart${queryString}`);
  },
};
