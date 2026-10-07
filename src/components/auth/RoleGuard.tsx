import React from 'react';
import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';
import { useForgeflowStore } from '../../store/useForgeflowStore';
import { canAccessModule, ROLE_CONFIGS, AppModule, OperatorRole } from '../../auth/permissions';

interface RoleGuardProps {
  module: AppModule;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ module, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, operator, logout } = useForgeflowStore();

  if (!isAuthenticated || !operator) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAllowed = canAccessModule(operator.role, module);

  if (isAllowed) {
    return <>{children}</>;
  }

  // Unauthorized view
  const roleConfig = ROLE_CONFIGS[operator.role as OperatorRole] || {
    displayName: operator.role,
    department: operator.department,
    description: 'Standard shopfloor operator account.',
    allowedModules: ['dashboard'],
  };

  const moduleNames: Record<AppModule, string> = {
    'dashboard': 'Operations Telemetry & Metrics',
    'work-orders': 'Work Orders & Production Runs',
    'inventory': 'Catalog & SKU Stock',
    'movements': 'Material Movement Ledger',
    'counterparties': 'Trading Counterparties & Mills',
    'settlements': 'Financial Settlements & Cash Flow',
    'quality-returns': 'Discrepancy & Quality RMA',
    'engine-diagnostics': 'Platform Engine Diagnostics',
  };

  const handleSwitchAccount = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="max-w-xl w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Header with warning icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30">
                Access Restricted
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                RBAC Security Policy
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Module Authorization Required
            </h2>
            <p className="text-xs text-muted-foreground">
              Your operator role does not have authorization to view or edit <strong className="text-foreground">{moduleNames[module] || module}</strong>.
            </p>
          </div>
        </div>

        {/* Current Operator Badge Card */}
        <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground font-semibold">Active Session Profile:</span>
            <span className="font-bold text-foreground">{operator.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Assigned Role:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              {roleConfig.displayName} ({operator.role})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Department:</span>
            <span className="text-foreground font-medium">{roleConfig.department}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Security Badge ID:</span>
            <span className="text-foreground font-semibold">{operator.badgeNumber || 'FF-USR'}</span>
          </div>
        </div>

        {/* Authorized Modules for this role */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground block">
            Authorized Modules for Your Profile:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roleConfig.allowedModules.map((m) => (
              <Link
                key={m}
                to={`/${m === 'dashboard' ? 'dashboard' : m}`}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-primary/40 transition-colors group text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {moduleNames[m]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Telemetry</span>
          </Link>

          <button
            type="button"
            onClick={handleSwitchAccount}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border text-xs font-semibold transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Switch Operator Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
