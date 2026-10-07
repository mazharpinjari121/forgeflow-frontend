import api from "./api";
import type { ApiResponse, OrderRecord, AddOrderRequest } from "@/types/api.types";

export const orderService = {
  getAllOrders: async (filters?: {
    PartyId?: number;
    Status?: string;
    ProductId?: number;
    OrderDateFrom?: string;
    OrderDateTo?: string;
    ExpectedDateFrom?: string;
    ExpectedDateTo?: string;
    OverdueBeforeDate?: string;
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
    const response = await api.get<ApiResponse<any[]>>(`/order/all${queryString}`);
    
    // Normalize casing for orderID, whatsAppMobile, and orderDetailID
    if (response.data.responseStatus === "Success" && response.data.data) {
      response.data.data = response.data.data.map((ord: any) => ({
        ...ord,
        orderId: ord.orderID !== undefined ? ord.orderID : ord.orderId,
        whatsappMobile: ord.whatsAppMobile !== undefined ? ord.whatsAppMobile : ord.whatsappMobile,
        orderDetails: (ord.orderDetails || []).map((detail: any) => ({
          ...detail,
          orderDetailId: detail.orderDetailID !== undefined ? detail.orderDetailID : detail.orderDetailId,
          orderId: detail.orderID !== undefined ? detail.orderID : detail.orderId,
        })),
      }));
    }
    return response as any;
  },

  getOrderById: async (orderId: number) => {
    const response = await api.get<ApiResponse<any>>(`/order/${orderId}`);
    // Normalize single order casing
    if (response.data.responseStatus === "Success" && response.data.data) {
      const ord = response.data.data;
      response.data.data = {
        ...ord,
        orderId: ord.orderId !== undefined ? ord.orderId : ord.orderID,
        whatsappMobile: ord.whatsappMobile !== undefined ? ord.whatsappMobile : ord.whatsAppMobile,
        orderDetails: (ord.orderDetails || []).map((detail: any) => ({
          ...detail,
          orderDetailId: detail.orderDetailId !== undefined ? detail.orderDetailId : detail.orderDetailID,
          orderId: detail.orderId !== undefined ? detail.orderId : detail.orderID,
        })),
      };
    }
    return response as any;
  },

  addOrder: (data: AddOrderRequest) =>
    api.post<ApiResponse<any>>("/order/add", data),

  updateOrderStatus: (orderId: number, status: string, userId: number) =>
    api.post<ApiResponse<any>>("/order/updateOrderStatus", {
      orderId,
      userId,
      status,
    }),

  saveDeliveryChallan: (data: any) =>
    api.post<ApiResponse<any>>("/deliverychallan/save", data),

  getDeliveryChallanById: (id: number) =>
    api.get<ApiResponse<any>>(`/deliverychallan/${id}`),

  getAllDeliveryChallans: (orderId?: number) => {
    const params = new URLSearchParams();
    if (orderId !== undefined) {
      params.append("OrderID", orderId.toString());
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return api.get<ApiResponse<any[]>>(`/deliverychallan/all${queryString}`);
  },

  updateOrderDetail: (data: {
    orderDetailId: number;
    orderId: number;
    productId: number;
    qty: number;
    rate: number;
    amount: number;
    userId: number;
  }) =>
    api.post<ApiResponse<any>>("/orderdetail/update", data),

  deleteOrderDetail: (data: {
    orderDetailID: number;
    orderID: number;
    userId: number;
  }) =>
    api.post<ApiResponse<any>>("/orderdetail/delete", data),
};
