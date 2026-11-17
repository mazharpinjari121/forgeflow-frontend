import { create } from 'zustand';
import { forgeflowApi } from '../api/forgeflowApi';
import type { Operator, OperationsTelemetry } from '../types/forgeflow.types';

interface ForgeflowState {
  operator: Operator | null;
  token: string | null;
  isAuthenticated: boolean;
  isEngineOnline: boolean;
  engineLatencyMs: number;
  telemetry: OperationsTelemetry | null;
  isLoadingTelemetry: boolean;

  // Modals & Panels
  isCommandPaletteOpen: boolean;
  isNewWorkOrderOpen: boolean;
  isNewSkuOpen: boolean;
  isNewEntityOpen: boolean;
  isLogMovementOpen: boolean;
  isNewSettlementOpen: boolean;
  isNewQualityRmaOpen: boolean;
  isAiCopilotOpen: boolean;

  // Actions
  setOperator: (operator: Operator | null, token: string | null) => void;
  logout: () => void;
  checkEngineHealth: () => Promise<void>;
  fetchTelemetry: () => Promise<void>;
  setCommandPalette: (open: boolean) => void;
  setNewWorkOrderOpen: (open: boolean) => void;
  setNewSkuOpen: (open: boolean) => void;
  setNewEntityOpen: (open: boolean) => void;
  setLogMovementOpen: (open: boolean) => void;
  setNewSettlementOpen: (open: boolean) => void;
  setNewQualityRmaOpen: (open: boolean) => void;
  setAiCopilotOpen: (open: boolean) => void;
}

// Default initial demo operator
const defaultOperator: Operator = {
  id: 1,
  name: 'Vikram Singhania',
  email: 'admin@forgeflow.io',
  role: 'PLANT_MANAGER',
  department: 'Plant Operations',
  badgeNumber: 'FF-MGR-001',
  status: 'ACTIVE',
};

const savedToken = localStorage.getItem('forgeflow_token');
const savedOperatorStr = localStorage.getItem('forgeflow_operator');
let initialOperator: Operator = defaultOperator;
let initialToken: string = savedToken || 'demo-session-token';
let initialAuth: boolean = true;

if (savedOperatorStr && savedToken) {
  try {
    initialOperator = JSON.parse(savedOperatorStr);
    initialToken = savedToken;
    initialAuth = true;
  } catch {
    initialOperator = defaultOperator;
  }
}

export const useForgeflowStore = create<ForgeflowState>((set, _get) => ({
  operator: initialOperator,
  token: initialToken,
  isAuthenticated: initialAuth,
  isEngineOnline: true,
  engineLatencyMs: 12,
  telemetry: null,
  isLoadingTelemetry: false,

  isCommandPaletteOpen: false,
  isNewWorkOrderOpen: false,
  isNewSkuOpen: false,
  isNewEntityOpen: false,
  isLogMovementOpen: false,
  isNewSettlementOpen: false,
  isNewQualityRmaOpen: false,
  isAiCopilotOpen: false,

  setOperator: (operator, token) => {
    if (operator && token) {
      localStorage.setItem('forgeflow_token', token);
      localStorage.setItem('forgeflow_operator', JSON.stringify(operator));
      set({ operator, token, isAuthenticated: true });
    } else {
      localStorage.removeItem('forgeflow_token');
      localStorage.removeItem('forgeflow_operator');
      set({ operator: null, token: null, isAuthenticated: false });
    }
  },

  logout: () => {
    try {
      forgeflowApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('forgeflow_token');
    localStorage.removeItem('forgeflow_operator');
    set({ operator: null, token: null, isAuthenticated: false });
  },

  checkEngineHealth: async () => {
    const start = performance.now();
    try {
      const data = await forgeflowApi.checkHealth();
      const latency = Math.round(performance.now() - start);
      set({ isEngineOnline: data?.status === 'ONLINE', engineLatencyMs: latency });
    } catch {
      set({ isEngineOnline: false, engineLatencyMs: 0 });
    }
  },

  fetchTelemetry: async () => {
    set({ isLoadingTelemetry: true });
    try {
      const data = await forgeflowApi.getTelemetry();
      set({ telemetry: data, isLoadingTelemetry: false });
    } catch (err) {
      console.error('Failed to load telemetry:', err);
      set({ isLoadingTelemetry: false });
    }
  },

  setCommandPalette: (open) => set({ isCommandPaletteOpen: open }),
  setNewWorkOrderOpen: (open) => set({ isNewWorkOrderOpen: open }),
  setNewSkuOpen: (open) => set({ isNewSkuOpen: open }),
  setNewEntityOpen: (open) => set({ isNewEntityOpen: open }),
  setLogMovementOpen: (open) => set({ isLogMovementOpen: open }),
  setNewSettlementOpen: (open) => set({ isNewSettlementOpen: open }),
  setNewQualityRmaOpen: (open) => set({ isNewQualityRmaOpen: open }),
  setAiCopilotOpen: (open) => set({ isAiCopilotOpen: open }),
}));
