import api from "./api";
import type { ApiResponse } from "@/types/api.types";

export const paymentService = {
  savePaymentCollection: (data: {
    paymentCollectionId: number;
    partyId: number;
    collectionDate: string;
    paymentMode: string;
    amountReceived: number;
    reference: string;
    remark: string;
    userId: number;
  }) => api.post<ApiResponse<any>>("/paymentcollection/save", data),

  getPaymentCollectionById: (id: number) =>
    api.get<ApiResponse<any>>(`/paymentcollection/${id}`),

  getAllPaymentCollections: (filters?: {
    PartyId?: number;
    PaymentMode?: string;
    FromDate?: string;
    ToDate?: string;
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
    return api.get<ApiResponse<any[]>>(`/paymentcollection/all${queryString}`);
  },

  deletePaymentCollection: (data: {
    paymentCollectionId: number;
    userId: number;
  }) => api.post<ApiResponse<any>>("/paymentcollection/delete", data),
};
