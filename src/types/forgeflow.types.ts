/**
 * ForgeFlow Operations Management SaaS Frontend Types
 * Strictly decoupled - reflects specs/contracts.ts
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}

export interface Operator {
  id: number;
  name: string;
  email: string;
  role: 'PLANT_MANAGER' | 'OPERATIONS_LEAD' | 'QUALITY_INSPECTOR' | 'DISPATCH_CONTROLLER' | 'ACCOUNTS_EXECUTIVE' | 'STORE_MANAGER';
  department: string;
  badgeNumber: string;
  phone?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  permissions?: {
    roleName: string;
    department: string;
    allowedModules: string[];
    canCreateWorkOrder: boolean;
    canApproveWorkOrder: boolean;
    canLogInwardStock: boolean;
    canCreateSettlement: boolean;
    canInspectRma: boolean;
    canAccessDiagnostics: boolean;
  };
}

export type EntityType = 'CLIENT' | 'SUPPLIER' | 'FABRICATOR_PARTNER' | 'DISTRIBUTOR';
export type EntityStatus = 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';

export interface TradingEntity {
  id: number;
  entity_code: string;
  legal_name: string;
  trade_name?: string;
  entity_type: EntityType;
  primary_contact: string;
  phone: string;
  whatsapp?: string;
  email: string;
  tax_identifier: string;
  pan_number?: string;
  credit_limit: number;
  payment_terms_days: number;
  billing_address: string;
  shipping_address?: string;
  city: string;
  state: string;
  postal_code: string;
  status: EntityStatus;
  notes?: string;
  outstanding_balance: number;
  created_at: string;
  updated_at: string;
}

export type MaterialClassification = 
  | 'RAW_MATERIAL' 
  | 'SEMI_FINISHED_WIP' 
  | 'FINISHED_PRODUCT' 
  | 'CONSUMABLE_HARDWARE';

export interface CommodityCategory {
  id: number;
  name: string;
  classification: MaterialClassification;
  code_prefix: string;
  description?: string;
  sku_items_count?: number;
  is_active: boolean;
}

export interface SkuItem {
  id: number;
  sku_code: string;
  name: string;
  category_id: number;
  category?: CommodityCategory;
  classification: MaterialClassification;
  unit_of_measure: 'KG' | 'METRIC_TON' | 'PCS' | 'METER' | 'SET' | 'BUNDLE';
  unit_price: number;
  standard_cost: number;
  tax_rate_percent: number;
  hsn_code: string;
  min_threshold_alert: number;
  current_stock: number;
  allocated_stock: number;
  available_stock: number;
  material_grade?: string;
  dimensions_spec?: string;
  surface_finish?: string;
  location_bin?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type WorkOrderType = 'SALES_DISPATCH' | 'PRODUCTION_BATCH' | 'SUBCONTRACT_RUN';
export type WorkOrderStatus = 
  | 'QUEUED' 
  | 'STAGED' 
  | 'IN_PRODUCTION' 
  | 'QUALITY_HOLD' 
  | 'DISPATCH_READY' 
  | 'FULFILLED' 
  | 'CANCELLED';

export type WorkOrderPriority = 'STANDARD' | 'EXPEDITED' | 'CRITICAL';

export interface WorkOrderItem {
  id: number;
  work_order_id: number;
  sku_id: number;
  sku?: SkuItem;
  quantity_ordered: number;
  quantity_produced: number;
  unit_rate: number;
  tax_amount: number;
  line_total: number;
}

export interface WorkOrder {
  id: number;
  order_number: string;
  entity_id: number;
  entity?: TradingEntity;
  order_type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  scheduled_start_date?: string;
  target_fulfillment_date: string;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  completion_percent: number;
  operator_notes?: string;
  items?: WorkOrderItem[];
  created_at: string;
  updated_at: string;
}

export type MovementType = 
  | 'INWARD_RECEIPT' 
  | 'OUTWARD_DISPATCH' 
  | 'PRODUCTION_CONSUME' 
  | 'PRODUCTION_YIELD' 
  | 'INVENTORY_RECONCILE';

export interface InventoryMovement {
  id: number;
  sku_id: number;
  sku?: SkuItem;
  movement_type: MovementType;
  quantity: number;
  previous_balance: number;
  new_balance: number;
  reference_document: string;
  batch_number?: string;
  reason_notes?: string;
  performed_by: string;
  created_at: string;
}

export type SettlementType = 'RECEIVABLE_INFLOW' | 'SUPPLIER_PAYOUT';
export type PaymentInstrument = 'NEFT_RTGS' | 'UPI_QR' | 'COMMERCIAL_CHEQUE' | 'CASH';

export interface Settlement {
  id: number;
  voucher_number: string;
  entity_id: number;
  entity?: TradingEntity;
  settlement_type: SettlementType;
  instrument: PaymentInstrument;
  amount: number;
  settlement_date: string;
  reference_number: string;
  allocated_work_order_id?: number;
  allocated_work_order?: WorkOrder;
  status: 'CLEARED' | 'PENDING' | 'RECONCILED';
  notes?: string;
  created_at: string;
}

export type ReturnReasonCode = 
  | 'DIMENSIONAL_OUT_OF_TOLERANCE' 
  | 'MATERIAL_GRADE_DEFECT' 
  | 'SURFACE_FINISH_FAILURE' 
  | 'TRANSIT_DAMAGE' 
  | 'SPECIFICATION_MISMATCH';

export type QualityActionStatus = 
  | 'LOGGED' 
  | 'INSPECTION_PENDING' 
  | 'ACCEPTED_CREDITED' 
  | 'REWORK_ORDERED' 
  | 'SCRAPPED';

export interface QualityReturn {
  id: number;
  rma_number: string;
  work_order_id?: number;
  work_order?: WorkOrder;
  entity_id: number;
  entity?: TradingEntity;
  sku_id: number;
  sku?: SkuItem;
  quantity_returned: number;
  reason_code: ReturnReasonCode;
  action_status: QualityActionStatus;
  credit_note_value: number;
  inspection_findings?: string;
  created_at: string;
}

export interface OperationsTelemetry {
  activeWorkOrders: {
    total: number;
    inProduction: number;
    staged: number;
    criticalPriority: number;
  };
  fulfillmentVelocityPercent: number;
  inventoryHealth: {
    totalSkus: number;
    stockoutRiskCount: number;
    healthyStockCount: number;
    totalStockValuation: number;
  };
  financialFlow: {
    monthlyReceivablesTotal: number;
    pendingReceiptsCount: number;
    outstandingReceivablesSum: number;
  };
  monthlyProductionThroughput: {
    period: string;
    producedTonnage: number;
    targetTonnage: number;
  }[];
  recentActivity: {
    id: string;
    type: 'WORK_ORDER' | 'STOCK' | 'SETTLEMENT' | 'QUALITY';
    summary: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'SUCCESS';
  }[];
}
