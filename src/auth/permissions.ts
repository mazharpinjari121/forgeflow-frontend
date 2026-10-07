export type OperatorRole = 
  | 'PLANT_MANAGER' 
  | 'OPERATIONS_LEAD' 
  | 'QUALITY_INSPECTOR' 
  | 'DISPATCH_CONTROLLER' 
  | 'ACCOUNTS_EXECUTIVE' 
  | 'STORE_MANAGER';

export type AppModule = 
  | 'dashboard'
  | 'work-orders'
  | 'inventory'
  | 'movements'
  | 'counterparties'
  | 'settlements'
  | 'quality-returns'
  | 'engine-diagnostics';

export interface RoleConfig {
  role: OperatorRole;
  displayName: string;
  department: string;
  badgeNumber: string;
  defaultEmail: string;
  description: string;
  badgeColor: string;
  allowedModules: AppModule[];
  canCreateWorkOrder: boolean;
  canApproveWorkOrder: boolean;
  canLogInwardStock: boolean;
  canCreateSettlement: boolean;
  canInspectRma: boolean;
  canAccessDiagnostics: boolean;
}

export const ROLE_CONFIGS: Record<OperatorRole, RoleConfig> = {
  PLANT_MANAGER: {
    role: 'PLANT_MANAGER',
    displayName: 'Plant Manager',
    department: 'Plant Operations & Executive',
    badgeNumber: 'FF-MGR-001',
    defaultEmail: 'admin@forgeflow.io',
    description: 'Full administrative and executive authority across all plant operations, finances, inventory, and system diagnostics.',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
    allowedModules: [
      'dashboard',
      'work-orders',
      'inventory',
      'movements',
      'counterparties',
      'settlements',
      'quality-returns',
      'engine-diagnostics',
    ],
    canCreateWorkOrder: true,
    canApproveWorkOrder: true,
    canLogInwardStock: true,
    canCreateSettlement: true,
    canInspectRma: true,
    canAccessDiagnostics: true,
  },

  OPERATIONS_LEAD: {
    role: 'OPERATIONS_LEAD',
    displayName: 'Operations Lead',
    department: 'Fabrication Shop 2',
    badgeNumber: 'FF-OPS-042',
    defaultEmail: 'lead@forgeflow.io',
    description: 'Directs shopfloor production runs, cutting schedules, batch staging, and quality rework orders.',
    badgeColor: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30',
    allowedModules: [
      'dashboard',
      'work-orders',
      'inventory',
      'movements',
      'quality-returns',
    ],
    canCreateWorkOrder: true,
    canApproveWorkOrder: true,
    canLogInwardStock: true,
    canCreateSettlement: false,
    canInspectRma: true,
    canAccessDiagnostics: false,
  },

  QUALITY_INSPECTOR: {
    role: 'QUALITY_INSPECTOR',
    displayName: 'Quality Inspector',
    department: 'QA & Metallurgical Lab',
    badgeNumber: 'FF-QC-018',
    defaultEmail: 'qc@forgeflow.io',
    description: 'Conducts ultrasonic/dimension tests, signs inspection certs, logs discrepancy RMAs, and manages scrap directives.',
    badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
    allowedModules: [
      'dashboard',
      'work-orders',
      'quality-returns',
    ],
    canCreateWorkOrder: false,
    canApproveWorkOrder: false,
    canLogInwardStock: false,
    canCreateSettlement: false,
    canInspectRma: true,
    canAccessDiagnostics: false,
  },

  DISPATCH_CONTROLLER: {
    role: 'DISPATCH_CONTROLLER',
    displayName: 'Dispatch Controller',
    department: 'Logistics & Yards',
    badgeNumber: 'FF-LOG-009',
    defaultEmail: 'dispatch@forgeflow.io',
    description: 'Coordinates finished goods staging, vehicle weighbridge dispatches, customer shipping addresses, and movement ledgers.',
    badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
    allowedModules: [
      'dashboard',
      'work-orders',
      'inventory',
      'movements',
      'counterparties',
    ],
    canCreateWorkOrder: false,
    canApproveWorkOrder: true,
    canLogInwardStock: true,
    canCreateSettlement: false,
    canInspectRma: false,
    canAccessDiagnostics: false,
  },

  ACCOUNTS_EXECUTIVE: {
    role: 'ACCOUNTS_EXECUTIVE',
    displayName: 'Accounts Executive',
    department: 'Finance & Commercials',
    badgeNumber: 'FF-FIN-005',
    defaultEmail: 'finance@forgeflow.io',
    description: 'Manages counterparty commercial credit terms, records banking UTR receipts, and processes mill raw material payouts.',
    badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30',
    allowedModules: [
      'dashboard',
      'settlements',
      'counterparties',
    ],
    canCreateWorkOrder: false,
    canApproveWorkOrder: false,
    canLogInwardStock: false,
    canCreateSettlement: true,
    canInspectRma: false,
    canAccessDiagnostics: false,
  },

  STORE_MANAGER: {
    role: 'STORE_MANAGER',
    displayName: 'Store Manager',
    department: 'Raw Materials & Warehouse',
    badgeNumber: 'FF-STR-012',
    defaultEmail: 'store@forgeflow.io',
    description: 'Custodian of raw steel plates, consumables, buffer thresholds, bin locations, and material inward logging.',
    badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30',
    allowedModules: [
      'dashboard',
      'inventory',
      'movements',
      'counterparties',
    ],
    canCreateWorkOrder: false,
    canApproveWorkOrder: false,
    canLogInwardStock: true,
    canCreateSettlement: false,
    canInspectRma: false,
    canAccessDiagnostics: false,
  },
};

/**
 * Checks whether an operator role is authorized to access a given module.
 */
export function canAccessModule(role?: OperatorRole | string, module?: AppModule | string): boolean {
  if (!role || !module) return false;
  const config = ROLE_CONFIGS[role as OperatorRole];
  if (!config) return false;
  return config.allowedModules.includes(module as AppModule);
}

/**
 * Demo accounts list for fast role switching and documentation.
 */
export const DEMO_OPERATORS = [
  {
    name: 'Vikram Singhania',
    email: 'admin@forgeflow.io',
    role: 'PLANT_MANAGER' as OperatorRole,
    title: 'Plant Manager',
    department: 'Plant Operations',
    badgeNumber: 'FF-MGR-001',
    scope: 'All 8 Modules (Full Executive)',
  },
  {
    name: 'Aarav Sharma',
    email: 'lead@forgeflow.io',
    role: 'OPERATIONS_LEAD' as OperatorRole,
    title: 'Operations Lead',
    department: 'Fabrication Shop 2',
    badgeNumber: 'FF-OPS-042',
    scope: 'Floor Runs, Stock & Quality',
  },
  {
    name: 'Pooja Mehta',
    email: 'qc@forgeflow.io',
    role: 'QUALITY_INSPECTOR' as OperatorRole,
    title: 'QC Inspector',
    department: 'QA & Metallurgical Lab',
    badgeNumber: 'FF-QC-018',
    scope: 'Quality RMA & Discrepancies',
  },
  {
    name: 'Karan Patel',
    email: 'dispatch@forgeflow.io',
    role: 'DISPATCH_CONTROLLER' as OperatorRole,
    title: 'Dispatch Controller',
    department: 'Logistics & Yards',
    badgeNumber: 'FF-LOG-009',
    scope: 'Logistics, Dispatches & Yard',
  },
  {
    name: 'Sneha Kulkarni',
    email: 'finance@forgeflow.io',
    role: 'ACCOUNTS_EXECUTIVE' as OperatorRole,
    title: 'Accounts Executive',
    department: 'Finance & Commercials',
    badgeNumber: 'FF-FIN-005',
    scope: 'Settlements & Counterparties',
  },
  {
    name: 'Rajesh Kumar',
    email: 'store@forgeflow.io',
    role: 'STORE_MANAGER' as OperatorRole,
    title: 'Store Manager',
    department: 'Raw Materials & Warehouse',
    badgeNumber: 'FF-STR-012',
    scope: 'Warehouse SKU Inventory & Inwards',
  },
];
