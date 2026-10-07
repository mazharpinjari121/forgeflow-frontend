import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  X, 
  Building2, 
  DollarSign,
  FileCheck
} from 'lucide-react';
import { forgeflowApi } from '../../api/forgeflowApi';
import type { Settlement, TradingEntity, WorkOrder, SettlementType, PaymentInstrument } from '../../types/forgeflow.types';

export const SettlementVouchersView: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [entities, setEntities] = useState<TradingEntity[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [entityId, setEntityId] = useState<number | ''>('');
  const [settlementType, setSettlementType] = useState<SettlementType>('RECEIVABLE_INFLOW');
  const [instrument, setInstrument] = useState<PaymentInstrument>('NEFT_RTGS');
  const [amount, setAmount] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [allocatedWoId, setAllocatedWoId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, eData, woData] = await Promise.all([
        forgeflowApi.getSettlements(),
        forgeflowApi.getEntities(),
        forgeflowApi.getWorkOrders(),
      ]);
      setSettlements(sData);
      setEntities(eData);
      setWorkOrders(woData);
    } catch (err) {
      console.error('Failed to load settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId || !amount || !referenceNumber || !settlementDate) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const created = await forgeflowApi.createSettlement({
        entity_id: Number(entityId),
        settlement_type: settlementType,
        instrument,
        amount: Number(amount),
        settlement_date: settlementDate,
        reference_number: referenceNumber,
        allocated_work_order_id: allocatedWoId ? Number(allocatedWoId) : undefined,
        notes,
      });

      setSettlements([created, ...settlements]);
      setModalOpen(false);
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      alert(`Settlement voucher ${created.voucher_number} logged successfully.`);
    } catch (err) {
      alert('Error recording settlement.');
    }
  };

  const filtered = settlements.filter(s => {
    const matchesType = typeFilter === 'ALL' || s.settlement_type === typeFilter;
    const matchesSearch = 
      s.voucher_number.toLowerCase().includes(search.toLowerCase()) ||
      (s.entity?.legal_name || '').toLowerCase().includes(search.toLowerCase()) ||
      s.reference_number.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalInflow = settlements
    .filter(s => s.settlement_type === 'RECEIVABLE_INFLOW')
    .reduce((acc, s) => acc + Number(s.amount), 0);

  const totalPayout = settlements
    .filter(s => s.settlement_type === 'SUPPLIER_PAYOUT')
    .reduce((acc, s) => acc + Number(s.amount), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Financial Settlements & Cash Flow
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit banking UTR receipts, supplier payout vouchers, and order milestone allocations.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:brightness-110 text-primary-foreground text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Settlement Voucher</span>
        </button>
      </div>

      {/* Floating Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Customer Inflows (Receipts)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">₹{totalInflow.toLocaleString('en-IN')}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Direct client collections
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Supplier & Mill Payouts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">₹{totalPayout.toLocaleString('en-IN')}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Settled raw plate disbursements
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Net Cash Delta</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-foreground">₹{(totalInflow - totalPayout).toLocaleString('en-IN')}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Operating net bank liquidity
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['ALL', 'RECEIVABLE_INFLOW', 'SUPPLIER_PAYOUT'].map(t => (
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
            placeholder="Search voucher #, counterparty, UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Settlements Table (Desktop/Tablet) + Mobile Card View */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-2xs">
        {/* Desktop / Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-mono text-muted-foreground uppercase">
              <tr>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Trading Counterparty</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference / UTR</th>
                <th className="py-2.5 px-3">Allocated Work Order</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground text-xs font-mono">
                    No settlement vouchers logged.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/40 transition-colors font-mono">
                    <td className="py-2.5 px-3 font-bold text-primary">
                      {s.voucher_number}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-foreground max-w-[200px] truncate">
                      {s.entity?.legal_name}
                    </td>
                    <td className="py-2.5 px-3">
                      {s.settlement_type === 'RECEIVABLE_INFLOW' ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          INFLOW
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          PAYOUT
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-muted-foreground">
                      {s.instrument.replace('_', '/')}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {s.settlement_date}
                    </td>
                    <td className="py-2.5 px-3 text-foreground font-semibold truncate max-w-[150px]">
                      {s.reference_number}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {s.allocated_work_order ? s.allocated_work_order.order_number : 'General Account'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      ₹{Number(s.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Settlement Cards (Screen < md) */}
        <div className="block md:hidden divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-mono">
              No settlement vouchers logged.
            </div>
          ) : (
            filtered.map((s) => {
              const isInflow = s.settlement_type === 'RECEIVABLE_INFLOW';
              return (
                <div key={s.id} className="p-3.5 space-y-2.5 hover:bg-muted/30 transition-colors font-mono">
                  {/* Top row: Voucher # + Inflow/Payout + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-primary text-sm">{s.voucher_number}</span>
                        {isInflow ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                            INFLOW
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold">
                            PAYOUT
                          </span>
                        )}
                      </div>
                      <p className="font-semibold font-sans text-xs text-foreground mt-0.5">{s.entity?.legal_name}</p>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> {s.status}
                    </span>
                  </div>

                  {/* Amount Highlight */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block font-sans">Payment Amount</span>
                      <span className={`text-sm font-bold ${isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {isInflow ? '+' : '-'}₹{Number(s.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground uppercase block font-sans">Instrument</span>
                      <span className="font-bold text-foreground text-[11px]">{s.instrument.replace('_', '/')}</span>
                    </div>
                  </div>

                  {/* Ref & Date grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <div>
                      <span className="text-[10px] block font-sans">UTR / Reference</span>
                      <span className="font-semibold text-foreground truncate block">{s.reference_number}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] block font-sans">Voucher Date</span>
                      <span className="font-semibold text-foreground">{s.settlement_date}</span>
                    </div>
                  </div>

                  {s.allocated_work_order && (
                    <div className="text-[10px] text-muted-foreground">
                      Linked Order: <strong className="text-foreground">{s.allocated_work_order.order_number}</strong>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Record Settlement Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-container max-w-2xl animate-fade-in"
          >
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Record Settlement Voucher</h3>
                  <p className="text-[11px] text-muted-foreground">Post banking remittance, customer receipt, or mill payout</p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-card">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Counterparty Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={entityId}
                  onChange={(e) => setEntityId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select counterparty...</option>
                  {entities.map(e => (
                    <option key={e.id} value={e.id}>{e.legal_name} (Outstanding: ₹{Number(e.outstanding_balance).toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Settlement Type
                  </label>
                  <select
                    value={settlementType}
                    onChange={(e) => setSettlementType(e.target.value as SettlementType)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="RECEIVABLE_INFLOW">Receivable Inflow (Customer Payment)</option>
                    <option value="SUPPLIER_PAYOUT">Supplier Payout (Mill Payment)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Payment Instrument
                  </label>
                  <select
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value as PaymentInstrument)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="NEFT_RTGS">NEFT / RTGS Bank Transfer</option>
                    <option value="UPI_QR">UPI / QR Transfer</option>
                    <option value="COMMERCIAL_CHEQUE">Commercial Cheque</option>
                    <option value="CASH">Cash Deposit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Settlement Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="250000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Settlement Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Bank Reference / UTR # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="HDFCR52026..."
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Allocated Work Order (Optional)
                  </label>
                  <select
                    value={allocatedWoId}
                    onChange={(e) => setAllocatedWoId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">General On-Account</option>
                    {workOrders.map(wo => (
                      <option key={wo.id} value={wo.id}>{wo.order_number} ({wo.entity?.trade_name || wo.entity?.legal_name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Accounting Notes / Reconciliation Remarks
                </label>
                <input
                  type="text"
                  placeholder="E.g. Advance payment against purchase order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-muted text-foreground border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-md shadow-primary/25 transition-all active:scale-95"
                >
                  Confirm & Post Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
