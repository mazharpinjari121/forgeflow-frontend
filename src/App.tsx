import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ForgeFlowLayout } from "./components/layout/ForgeFlowLayout";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { RoleGuard } from "./components/auth/RoleGuard";
import { Toaster } from "sonner";
import { RefreshCw } from "lucide-react";

// Lazy-loaded ForgeFlow Views
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then(m => ({ default: m.LoginPage })));
const OperationsTelemetryView = lazy(() => import("./pages/dashboard/OperationsTelemetryView").then(m => ({ default: m.OperationsTelemetryView })));
const WorkOrdersView = lazy(() => import("./pages/orders/WorkOrdersView").then(m => ({ default: m.WorkOrdersView })));
const InventorySkuView = lazy(() => import("./pages/stock/InventorySkuView").then(m => ({ default: m.InventorySkuView })));
const MovementLedgerView = lazy(() => import("./pages/stock/MovementLedgerView").then(m => ({ default: m.MovementLedgerView })));
const CounterpartiesView = lazy(() => import("./pages/masters/CounterpartiesView").then(m => ({ default: m.CounterpartiesView })));
const SettlementVouchersView = lazy(() => import("./pages/payments/SettlementVouchersView").then(m => ({ default: m.SettlementVouchersView })));
const QualityRmaView = lazy(() => import("./pages/returns/QualityRmaView").then(m => ({ default: m.QualityRmaView })));
const EngineDiagnosticsView = lazy(() => import("./pages/diagnostics/EngineDiagnosticsView").then(m => ({ default: m.EngineDiagnosticsView })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-muted-foreground gap-2">
      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
      <span>Loading ForgeFlow console...</span>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="forgeflow-theme">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Operator Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected ForgeFlow SaaS Shell */}
            <Route element={<ForgeFlowLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<RoleGuard module="dashboard"><OperationsTelemetryView /></RoleGuard>} />
              <Route path="/work-orders" element={<RoleGuard module="work-orders"><WorkOrdersView /></RoleGuard>} />
              <Route path="/inventory" element={<RoleGuard module="inventory"><InventorySkuView /></RoleGuard>} />
              <Route path="/movements" element={<RoleGuard module="movements"><MovementLedgerView /></RoleGuard>} />
              <Route path="/counterparties" element={<RoleGuard module="counterparties"><CounterpartiesView /></RoleGuard>} />
              <Route path="/settlements" element={<RoleGuard module="settlements"><SettlementVouchersView /></RoleGuard>} />
              <Route path="/quality-returns" element={<RoleGuard module="quality-returns"><QualityRmaView /></RoleGuard>} />
              <Route path="/engine-diagnostics" element={<RoleGuard module="engine-diagnostics"><EngineDiagnosticsView /></RoleGuard>} />

              {/* Backwards-compatible legacy route redirects */}
              <Route path="/orders" element={<Navigate to="/work-orders" replace />} />
              <Route path="/stock" element={<Navigate to="/inventory" replace />} />
              <Route path="/payments" element={<Navigate to="/settlements" replace />} />
              <Route path="/returns" element={<Navigate to="/quality-returns" replace />} />
              <Route path="/masters/*" element={<Navigate to="/counterparties" replace />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
