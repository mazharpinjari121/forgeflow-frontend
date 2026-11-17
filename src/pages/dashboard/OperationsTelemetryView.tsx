import React, { useEffect, useState } from 'react';
import { 
  Gauge, 
  Layers, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  RefreshCw,
  Plus, 
  ArrowRight, 
  ShieldAlert, 
  Flame, 
  Zap, 
  Activity, 
  ChevronRight, 
  Sparkles,
  Cpu,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { forgeflowApi } from '../../api/forgeflowApi';
import type { OperationsTelemetry, WorkOrder } from '../../types/forgeflow.types';
import { useForgeflowStore } from '../../store/useForgeflowStore';
import { generateShiftInsights, ShiftInsightsResult } from '../../api/forgeAiService';

export const OperationsTelemetryView: React.FC = () => {
  const [telemetry, setTelemetry] = useState<OperationsTelemetry | null>(null);
  const [criticalOrders, setCriticalOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ForgeAI Predictive Shift Insights State
  const [insightsResult, setInsightsResult] = useState<ShiftInsightsResult | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const navigate = useNavigate();
  const { setNewWorkOrderOpen } = useForgeflowStore();

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [tData, woData] = await Promise.all([
        forgeflowApi.getTelemetry(),
        forgeflowApi.getWorkOrders({ priority: 'CRITICAL' })
      ]);
      setTelemetry(tData);
      setCriticalOrders(woData.filter(o => o.status !== 'FULFILLED' && o.status !== 'CANCELLED'));

      // Automatically generate ForgeAI shift insights using the live telemetry
      loadAiInsights(tData);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadAiInsights = async (tData?: OperationsTelemetry | null) => {
    setIsGeneratingInsights(true);
    try {
      const res = await generateShiftInsights(tData || telemetry || undefined);
      setInsightsResult(res);
    } catch (err) {
      console.error('Failed to generate shift insights:', err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !telemetry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3 text-muted-foreground font-mono">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Flame className="w-5 h-5 text-amber-400 absolute inset-0 m-auto" />
        </div>
        <span className="text-xs tracking-wider">CONNECTING TO PLANT TELEMETRY STREAM...</span>
      </div>
    );
  }

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          border: 'border-rose-500/40 hover:border-rose-500/60',
          badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500'
        };
      case 'WARN':
        return {
          border: 'border-amber-500/40 hover:border-amber-500/60',
          badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500'
        };
      default:
        return {
          border: 'border-cyan-500/40 hover:border-cyan-500/60',
          badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
          dot: 'bg-cyan-500'
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top Operations Banner */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        {/* Subtle accent glow gradient behind */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-primary/10 via-cyan-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary via-cyan-400 to-amber-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                  Operations Telemetry
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE TELEMETRY
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connected manufacturing execution console • Shift A Floor sequencing • Batch run telemetry
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                setNewWorkOrderOpen(true);
                navigate('/work-orders');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Work Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Floating Elevated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Work Orders */}
        <div 
          onClick={() => navigate('/work-orders')}
          className="group cursor-pointer bg-card border border-border hover:border-cyan-500/50 rounded-2xl p-4 shadow-sm hover:shadow-cyan-500/10 transition-all duration-200 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                Active Batch Orders
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold font-mono text-foreground tracking-tight">
                {telemetry?.activeWorkOrders.total ?? 0}
              </span>
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                {telemetry?.activeWorkOrders.inProduction ?? 0} In Floor Run
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Staged in Queue: <strong className="text-foreground">{telemetry?.activeWorkOrders.staged ?? 0}</strong></span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {telemetry?.activeWorkOrders.criticalPriority ?? 0} Critical
            </span>
          </div>
        </div>

        {/* Card 2: Fulfillment Velocity */}
        <div className="bg-card border border-border hover:border-emerald-500/50 rounded-2xl p-4 shadow-sm transition-all duration-200 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                Fulfillment Velocity
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold font-mono text-foreground tracking-tight">
                {telemetry?.fulfillmentVelocityPercent ?? 85}%
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> On Target
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Production Dispatch SLA</span>
            <span className="font-mono text-foreground font-bold">98.4% On Time</span>
          </div>
        </div>

        {/* Card 3: SKU Inventory Health */}
        <div 
          onClick={() => navigate('/inventory')}
          className="group cursor-pointer bg-card border border-border hover:border-primary/50 rounded-2xl p-4 shadow-sm hover:shadow-primary/10 transition-all duration-200 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                Catalog & Stock Health
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-foreground tracking-tight">
                {telemetry?.inventoryHealth.healthyStockCount ?? 0}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                / {telemetry?.inventoryHealth.totalSkus ?? 0} SKUs Healthy
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Val: <strong className="text-foreground font-mono">₹{(Number(telemetry?.inventoryHealth.totalStockValuation || 0) / 100000).toFixed(1)}L</strong></span>
            {(telemetry?.inventoryHealth.stockoutRiskCount ?? 0) > 0 ? (
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {telemetry?.inventoryHealth.stockoutRiskCount} Reorder Alerts
              </span>
            ) : (
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Stock Balanced</span>
            )}
          </div>
        </div>

        {/* Card 4: Month Receivables Flow */}
        <div 
          onClick={() => navigate('/settlements')}
          className="group cursor-pointer bg-card border border-border hover:border-amber-500/50 rounded-2xl p-4 shadow-sm hover:shadow-amber-500/10 transition-all duration-200 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                Receivables & Cash Flow
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-foreground tracking-tight">
                ₹{(Number(telemetry?.financialFlow.monthlyReceivablesTotal || 0) / 100000).toFixed(1)}L
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">Cleared</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Outstanding Balance:</span>
            <span className="font-mono font-bold text-foreground">
              ₹{(Number(telemetry?.financialFlow.outstandingReceivablesSum || 0) / 100000).toFixed(1)}L
            </span>
          </div>
        </div>
      </div>

      {/* FEATURE 3: ForgeAI Shift Intelligence Widget */}
      <div className="bg-card border border-border/90 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-cyan-500" />
        
        {/* Widget Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/70 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 via-primary/20 to-cyan-500/20 border border-border text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-foreground tracking-tight flex items-center gap-1.5 font-mono">
                  FORGE<span className="text-primary font-sans font-bold">AI</span> SHIFT INTELLIGENCE
                </h2>
                {insightsResult?.meta.mode === 'LIVE_AI' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Gemini Live
                  </span>
                ) : (
                  <span 
                    title="Running local heuristic engine (zero external downtime)"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                  >
                    <Cpu className="w-3 h-3" />
                    Deterministic Heuristic Engine
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Autonomous shopfloor risk assessment, inventory buffer monitoring, and throughput guidance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {insightsResult?.meta && (
              <span className="text-[10px] font-mono text-muted-foreground hidden lg:inline">
                Analyzed in {insightsResult.meta.latencyMs}ms
              </span>
            )}
            <button
              onClick={() => loadAiInsights()}
              disabled={isGeneratingInsights}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingInsights ? 'animate-spin text-primary' : ''}`} />
              <span>{isGeneratingInsights ? 'Analyzing...' : 'Refresh Analysis'}</span>
            </button>
          </div>
        </div>

        {/* 3 Prioritized Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {insightsResult?.insights.map((insight) => {
            const style = getSeverityStyle(insight.severity);
            return (
              <div
                key={insight.id}
                className={`p-4 rounded-xl bg-muted/30 border ${style.border} transition-all duration-200 flex flex-col justify-between space-y-3 group hover:bg-muted/50`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      {insight.category.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${style.badge}`}>
                      {insight.severity}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-foreground leading-snug font-sans group-hover:text-primary transition-colors">
                    {insight.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                    {insight.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-border/50">
                  <div className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300 mb-2">
                    Action: <span className="font-sans font-medium text-foreground/90">{insight.actionableStep}</span>
                  </div>
                  {insight.targetPath && (
                    <button
                      onClick={() => navigate(insight.targetPath!)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-card hover:bg-muted border border-border/80 text-[11px] font-mono text-primary font-semibold transition-colors active:scale-98"
                    >
                      <span>Take Operational Action</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Operational Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Production Throughput (Tonnage comparison) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Monthly Production Throughput Velocity
                </h2>
                <p className="text-[11px] text-muted-foreground">Fabricated tonnage output vs engineering capacity targets (Metric Tonnes)</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-foreground border border-border font-bold">
                CAPACITY: 350 MT/MO
              </span>
            </div>

            <div className="space-y-4">
              {telemetry?.monthlyProductionThroughput.map((item, idx) => {
                const pct = Math.min(100, Math.round((item.producedTonnage / item.targetTonnage) * 100));
                return (
                  <div key={idx} className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/70 hover:bg-muted/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono">
                      <span className="font-bold text-foreground">{item.period}</span>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-cyan-700 dark:text-cyan-400 font-bold">{item.producedTonnage} MT Produced</span>
                        <span className="text-muted-foreground text-[11px]">/ {item.targetTonnage} MT</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          pct >= 90 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                          pct >= 50 ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30' :
                          'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          {pct}% TARGET
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex border border-border/40">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          pct >= 90 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-xs shadow-emerald-500/50' : 
                          pct >= 50 ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-xs shadow-cyan-500/50' : 
                          'bg-gradient-to-r from-amber-600 to-amber-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Real-time load from Floor CNCs & Fabrication Bay Lines
            </span>
            <button 
              onClick={() => navigate('/work-orders')}
              className="text-primary hover:text-primary/80 flex items-center gap-1 font-bold text-xs"
            >
              <span>Inspect batch sequencing</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Critical Priority Board */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Critical Priority Queue</h2>
                  <p className="text-[10px] text-muted-foreground">Expedited client requirements</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30">
                {criticalOrders.length} ORDERS
              </span>
            </div>

            <div className="space-y-2.5">
              {criticalOrders.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No critical work orders requiring immediate attention.
                </div>
              ) : (
                criticalOrders.map((wo) => (
                  <div 
                    key={wo.id}
                    onClick={() => navigate('/work-orders')}
                    className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border hover:border-amber-500/40 cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary group-hover:underline">
                        {wo.order_number}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 font-bold">
                        {wo.status}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-semibold truncate">
                      {wo.entity?.legal_name || 'Counterparty'}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40 font-mono">
                      <span>Due: {wo.target_fulfillment_date}</span>
                      <span className="font-bold text-foreground">₹{Number(wo.grand_total).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <button
              onClick={() => navigate('/work-orders')}
              className="w-full py-2.5 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-semibold text-center border border-border shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Manage Full Floor Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Floor Activity Stream */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Live Operations Audit Stream</h2>
              <p className="text-[11px] text-muted-foreground">Real-time floor dispatches, receipts, and settlement vouchers</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            AUTO-SYNCED
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {telemetry?.recentActivity.map((act) => (
            <div key={act.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs hover:bg-muted/30 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  act.level === 'WARN' ? 'bg-amber-500 animate-pulse' : 
                  act.level === 'SUCCESS' ? 'bg-emerald-500' : 'bg-cyan-500'
                }`} />
                <span className="font-mono text-[9px] font-bold text-muted-foreground px-1.5 py-0.2 rounded bg-muted border border-border shrink-0">
                  {act.type}
                </span>
                <span className="text-foreground font-medium truncate">{act.summary}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 sm:ml-4 pl-4 sm:pl-0">
                {act.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
