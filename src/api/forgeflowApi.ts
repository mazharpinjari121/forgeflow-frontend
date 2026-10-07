import axios from 'axios';
import type {
  ApiResponse,
  CommodityCategory,
  InventoryMovement,
  OperationsTelemetry,
  QualityReturn,
  Settlement,
  SkuItem,
  TradingEntity,
  WorkOrder
} from '../types/forgeflow.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Attach token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('forgeflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized API calls
export const forgeflowApi = {
  // Telemetry & Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },
  getTelemetry: async (): Promise<OperationsTelemetry> => {
    const res = await apiClient.get<ApiResponse<OperationsTelemetry>>('/telemetry/metrics');
    return res.data.data;
  },

  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post('/auth/login', credentials);
    if (res.data.data?.token) {
      localStorage.setItem('forgeflow_token', res.data.data.token);
      localStorage.setItem('forgeflow_operator', JSON.stringify(res.data.data.operator));
    }
    return res.data;
  },
  logout: async () => {
    localStorage.removeItem('forgeflow_token');
    localStorage.removeItem('forgeflow_operator');
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    }
  },
  getCurrentOperator: () => {
    const str = localStorage.getItem('forgeflow_operator');
    return str ? JSON.parse(str) : null;
  },

  // Counterparties (Trading Entities)
  getEntities: async (params?: { type?: string; status?: string; search?: string }): Promise<TradingEntity[]> => {
    const res = await apiClient.get<ApiResponse<TradingEntity[]>>('/entities', { params });
    return res.data.data;
  },
  getEntity: async (id: number): Promise<TradingEntity> => {
    const res = await apiClient.get<ApiResponse<TradingEntity>>(`/entities/${id}`);
    return res.data.data;
  },
  createEntity: async (data: Partial<TradingEntity>): Promise<TradingEntity> => {
    const res = await apiClient.post<ApiResponse<TradingEntity>>('/entities', data);
    return res.data.data;
  },
  updateEntity: async (id: number, data: Partial<TradingEntity>): Promise<TradingEntity> => {
    const res = await apiClient.put<ApiResponse<TradingEntity>>(`/entities/${id}`, data);
    return res.data.data;
  },
  deleteEntity: async (id: number) => {
    const res = await apiClient.delete(`/entities/${id}`);
    return res.data;
  },

  // Categories
  getCategories: async (): Promise<CommodityCategory[]> => {
    const res = await apiClient.get<ApiResponse<CommodityCategory[]>>('/categories');
    return res.data.data;
  },
  createCategory: async (data: Partial<CommodityCategory>): Promise<CommodityCategory> => {
    const res = await apiClient.post<ApiResponse<CommodityCategory>>('/categories', data);
    return res.data.data;
  },

  // SKU Items & Inventory
  getSkus: async (params?: { category_id?: number; classification?: string; low_stock_only?: boolean; search?: string }): Promise<SkuItem[]> => {
    const res = await apiClient.get<ApiResponse<SkuItem[]>>('/skus', { params });
    return res.data.data;
  },
  getSku: async (id: number): Promise<SkuItem> => {
    const res = await apiClient.get<ApiResponse<SkuItem>>(`/skus/${id}`);
    return res.data.data;
  },
  createSku: async (data: any): Promise<SkuItem> => {
    const res = await apiClient.post<ApiResponse<SkuItem>>('/skus', data);
    return res.data.data;
  },
  updateSku: async (id: number, data: any): Promise<SkuItem> => {
    const res = await apiClient.put<ApiResponse<SkuItem>>(`/skus/${id}`, data);
    return res.data.data;
  },
  deleteSku: async (id: number) => {
    const res = await apiClient.delete(`/skus/${id}`);
    return res.data;
  },

  // Work Orders & Production Runs
  getWorkOrders: async (params?: { status?: string; priority?: string; order_type?: string; search?: string }): Promise<WorkOrder[]> => {
    const res = await apiClient.get<ApiResponse<WorkOrder[]>>('/work-orders', { params });
    return res.data.data;
  },
  getWorkOrder: async (id: number): Promise<WorkOrder> => {
    const res = await apiClient.get<ApiResponse<WorkOrder>>(`/work-orders/${id}`);
    return res.data.data;
  },
  createWorkOrder: async (data: any): Promise<WorkOrder> => {
    const res = await apiClient.post<ApiResponse<WorkOrder>>('/work-orders', data);
    return res.data.data;
  },
  updateWorkOrderStatus: async (id: number, payload: { status: string; completion_percent?: number; notes?: string }): Promise<WorkOrder> => {
    const res = await apiClient.patch<ApiResponse<WorkOrder>>(`/work-orders/${id}/status`, payload);
    return res.data.data;
  },
  deleteWorkOrder: async (id: number) => {
    const res = await apiClient.delete(`/work-orders/${id}`);
    return res.data;
  },

  // Inventory Movements Ledger
  getMovements: async (params?: { sku_id?: number; movement_type?: string }): Promise<InventoryMovement[]> => {
    const res = await apiClient.get<ApiResponse<InventoryMovement[]>>('/movements', { params });
    return res.data.data;
  },
  logMovement: async (data: any): Promise<InventoryMovement> => {
    const res = await apiClient.post<ApiResponse<InventoryMovement>>('/movements', data);
    return res.data.data;
  },

  // Settlements & Cash Flow
  getSettlements: async (params?: { settlement_type?: string; entity_id?: number; status?: string }): Promise<Settlement[]> => {
    const res = await apiClient.get<ApiResponse<Settlement[]>>('/settlements', { params });
    return res.data.data;
  },
  createSettlement: async (data: any): Promise<Settlement> => {
    const res = await apiClient.post<ApiResponse<Settlement>>('/settlements', data);
    return res.data.data;
  },
  deleteSettlement: async (id: number) => {
    const res = await apiClient.delete(`/settlements/${id}`);
    return res.data;
  },

  // Quality & RMA Returns
  getQualityReturns: async (params?: { action_status?: string; reason_code?: string }): Promise<QualityReturn[]> => {
    const res = await apiClient.get<ApiResponse<QualityReturn[]>>('/quality-returns', { params });
    return res.data.data;
  },
  createQualityReturn: async (data: any): Promise<QualityReturn> => {
    const res = await apiClient.post<ApiResponse<QualityReturn>>('/quality-returns', data);
    return res.data.data;
  },
  updateQualityReturnStatus: async (id: number, payload: { action_status: string; inspection_findings?: string; credit_note_value?: number }): Promise<QualityReturn> => {
    const res = await apiClient.patch<ApiResponse<QualityReturn>>(`/quality-returns/${id}/status`, payload);
    return res.data.data;
  },
};
