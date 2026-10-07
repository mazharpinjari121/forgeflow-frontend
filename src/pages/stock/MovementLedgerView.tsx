import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers, 
  RefreshCw,
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { forgeflowApi } from '../../api/forgeflowApi';
import type { InventoryMovement } from '../../types/forgeflow.types';

export const MovementLedgerView: React.FC = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await forgeflowApi.getMovements();
      setMovements(data);
    } catch (err) {
      console.error('Failed to load ledger movements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const filtered = movements.filter(m => {
    const matchesType = typeFilter === 'ALL' || m.movement_type === typeFilter;
    const matchesSearch = 
      (m.sku?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.sku?.sku_code || '').toLowerCase().includes(search.toLowerCase()) ||
      m.reference_document.toLowerCase().includes(search.toLowerCase()) ||
      (m.batch_number || '').toLowerCase().includes(search.toLowerCase()) ||
      m.performed_by.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'INWARD_RECEIPT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="w-3 h-3" /> INWARD
          </span>
        );
      case 'OUTWARD_DISPATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
            <ArrowUpRight className="w-3 h-3" /> DISPATCH
          </span>
        );
      case 'PRODUCTION_CONSUME':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            CONSUMED
          </span>
        );
      case 'PRODUCTION_YIELD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
            YIELD
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-muted text-muted-foreground">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Material Movement Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable floor traceability log for raw material receipts, cutting consumptions, yields, and dispatches.
          </p>
        </div>

        <button
          onClick={loadMovements}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-mono transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Floating Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Ledger Transactions</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-foreground">{movements.length} <span className="text-xs font-normal text-muted-foreground">Entries</span></p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Immutable chain logs
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Inward Receipts</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
              {movements.filter(m => m.movement_type === 'INWARD_RECEIPT').length} <span className="text-xs font-normal text-muted-foreground">Batches</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Mill deliveries accepted
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Shop Consumptions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-amber-700 dark:text-amber-400">
              {movements.filter(m => m.movement_type === 'PRODUCTION_CONSUME').length} <span className="text-xs font-normal text-muted-foreground">Issues</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Issued to cutting & CNC
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Outward Dispatches</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
              {movements.filter(m => m.movement_type === 'OUTWARD_DISPATCH').length} <span className="text-xs font-normal text-muted-foreground">Loads</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Consigned to buyers
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['ALL', 'INWARD_RECEIPT', 'PRODUCTION_CONSUME', 'PRODUCTION_YIELD', 'OUTWARD_DISPATCH'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] whitespace-nowrap transition-colors ${
                typeFilter === t 
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ref #, SKU, batch, operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* High Density Ledger Table (Desktop/Tablet) + Mobile Card View */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-2xs">
        {/* Desktop / Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-mono text-muted-foreground uppercase">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">SKU Code & Item</th>
                <th className="py-2.5 px-3">Movement Qty</th>
                <th className="py-2.5 px-3">Previous</th>
                <th className="py-2.5 px-3">New Balance</th>
                <th className="py-2.5 px-3">Reference Document</th>
                <th className="py-2.5 px-3">Batch / Heat</th>
                <th className="py-2.5 px-3 text-right">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground text-xs font-mono">
                    No movement records found.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/40 transition-colors font-mono">
                    <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                      {new Date(m.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      {getMovementBadge(m.movement_type)}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-bold text-foreground block font-mono text-xs">{m.sku?.sku_code}</span>
                      <span className="text-[11px] text-muted-foreground truncate block max-w-[200px]">{m.sku?.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      {['INWARD_RECEIPT', 'PRODUCTION_YIELD'].includes(m.movement_type) ? (
                        <span className="text-emerald-500">+{m.quantity} {m.sku?.unit_of_measure}</span>
                      ) : (
                        <span className="text-rose-500">-{m.quantity} {m.sku?.unit_of_measure}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {m.previous_balance}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-700 dark:text-cyan-400">
                      {m.new_balance} {m.sku?.unit_of_measure}
                    </td>
                    <td className="py-2.5 px-3 text-foreground font-semibold">
                      {m.reference_document}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {m.batch_number || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">
                      {m.performed_by}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Movement Cards (Screen < md) */}
        <div className="block md:hidden divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-mono">
              No movement records found.
            </div>
          ) : (
            filtered.map((m) => {
              const isInflow = ['INWARD_RECEIPT', 'PRODUCTION_YIELD'].includes(m.movement_type);
              return (
                <div key={m.id} className="p-3.5 space-y-2.5 hover:bg-muted/30 transition-colors font-mono">
                  {/* Top row: Type badge + Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <div>{getMovementBadge(m.movement_type)}</div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </span>
                  </div>

                  {/* SKU Code & Item */}
                  <div>
                    <span className="font-bold text-primary text-xs block">{m.sku?.sku_code}</span>
                    <span className="text-xs font-sans font-semibold text-foreground">{m.sku?.name}</span>
                  </div>

                  {/* Qty change & Stock progression */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-sans">Delta</span>
                      <span className={`font-bold ${isInflow ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isInflow ? '+' : '-'}{m.quantity} {m.sku?.unit_of_measure}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block font-sans">Stock Progression</span>
                      <span className="text-muted-foreground">{m.previous_balance}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{m.new_balance} {m.sku?.unit_of_measure}</span>
                    </div>
                  </div>

                  {/* Details row: Ref doc, batch, operator */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <span className="truncate max-w-[140px] text-foreground font-semibold">Ref: {m.reference_document}</span>
                    <span>Batch: {m.batch_number || '—'}</span>
                    <span className="truncate max-w-[90px]">{m.performed_by}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
