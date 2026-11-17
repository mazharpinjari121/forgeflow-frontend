import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  CheckCircle2, 
  FileCheck, 
  X, 
  ShieldAlert, 
  RotateCcw,
  Sparkles,
  Check,
  Cpu,
  Bot
} from 'lucide-react';
import { forgeflowApi } from '../../api/forgeflowApi';
import type { QualityReturn, SkuItem, TradingEntity, WorkOrder, ReturnReasonCode, QualityActionStatus } from '../../types/forgeflow.types';
import { analyzeQualityDefect, QualityAnalysisResult } from '../../api/forgeAiService';

export const QualityRmaView: React.FC = () => {
  const [returns, setReturns] = useState<QualityReturn[]>([]);
  const [entities, setEntities] = useState<TradingEntity[]>([]);
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [_loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [entityId, setEntityId] = useState<number | ''>('');
  const [skuId, setSkuId] = useState<number | ''>('');
  const [workOrderId, setWorkOrderId] = useState<number | ''>('');
  const [quantityReturned, setQuantityReturned] = useState('');
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>('DIMENSIONAL_OUT_OF_TOLERANCE');
  const [findings, setFindings] = useState('');
  const [creditNoteValue, setCreditNoteValue] = useState('');

  // ForgeAI Root-Cause State in Creation Modal
  const [aiAnalysis, setAiAnalysis] = useState<QualityAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // Existing RMA AI Inspection Modal
  const [inspectModalRma, setInspectModalRma] = useState<QualityReturn | null>(null);
  const [inspectAiAnalysis, setInspectAiAnalysis] = useState<QualityAnalysisResult | null>(null);
  const [inspectIsAnalyzing, setInspectIsAnalyzing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, eData, sData, woData] = await Promise.all([
        forgeflowApi.getQualityReturns(),
        forgeflowApi.getEntities(),
        forgeflowApi.getSkus(),
        forgeflowApi.getWorkOrders(),
      ]);
      setReturns(rData);
      setEntities(eData);
      setSkus(sData);
      setWorkOrders(woData);
    } catch (err) {
      console.error('Failed to load quality returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId || !skuId || !quantityReturned) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const created = await forgeflowApi.createQualityReturn({
        entity_id: Number(entityId),
        sku_id: Number(skuId),
        work_order_id: workOrderId ? Number(workOrderId) : undefined,
        quantity_returned: Number(quantityReturned),
        reason_code: reasonCode,
        inspection_findings: findings,
        credit_note_value: creditNoteValue ? Number(creditNoteValue) : 0,
      });

      setReturns([created, ...returns]);
      setModalOpen(false);
      setQuantityReturned('');
      setFindings('');
      setCreditNoteValue('');
      setAiAnalysis(null);
      setIsApplied(false);
      alert(`Discrepancy RMA ${created.rma_number} recorded.`);
    } catch (err) {
      alert('Error creating RMA.');
    }
  };

  const handleUpdateStatus = async (id: number, status: QualityActionStatus) => {
    try {
      const updated = await forgeflowApi.updateQualityReturnStatus(id, {
        action_status: status,
      });
      setReturns(prev => prev.map(r => r.id === id ? updated : r));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Run ForgeAI Root Cause Analysis on current form
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setIsApplied(false);
    const selectedSku = skus.find(s => s.id === Number(skuId));
    const effectiveDesc = findings.trim() || `Material defect recorded under reason code: ${reasonCode}. Dimensional and metallurgical verification in progress.`;

    try {
      const result = await analyzeQualityDefect(
        effectiveDesc,
        selectedSku?.material_grade || 'IS 2062 Structural Steel',
        reasonCode
      );
      setAiAnalysis(result);
    } catch (err) {
      console.error('AI Defect Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply CAPA to form findings
  const handleApplyCapaToForm = () => {
    if (!aiAnalysis) return;
    const capaBlock = `\n\n[ForgeAI CAPA Directive - ${aiAnalysis.severity} Severity (${aiAnalysis.confidenceScore}% Conf.)]:\n• Root Cause: ${aiAnalysis.rootCause}\n• Directive: ${aiAnalysis.recommendedCapa}`;
    setFindings(prev => prev ? prev + capaBlock : capaBlock.trim());
    setIsApplied(true);
  };

  // Inspect existing RMA with AI
  const handleInspectExistingRma = async (rma: QualityReturn) => {
    setInspectModalRma(rma);
    setInspectIsAnalyzing(true);
    setInspectAiAnalysis(null);

    const desc = rma.inspection_findings || `Observed discrepancy under code: ${rma.reason_code}`;
    const grade = rma.sku?.material_grade || 'IS 2062 E250';

    try {
      const result = await analyzeQualityDefect(desc, grade, rma.reason_code);
      setInspectAiAnalysis(result);
    } catch (err) {
      console.error('Inspect analysis failed:', err);
    } finally {
      setInspectIsAnalyzing(false);
    }
  };

  const filtered = returns.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.action_status === statusFilter;
    const matchesSearch = 
      r.rma_number.toLowerCase().includes(search.toLowerCase()) ||
      (r.entity?.legal_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.sku?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.inspection_findings || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: QualityActionStatus) => {
    switch (status) {
      case 'ACCEPTED_CREDITED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" />CREDITED</span>;
      case 'INSPECTION_PENDING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">INSPECTING</span>;
      case 'REWORK_ORDERED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">REWORK</span>;
      case 'SCRAPPED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">SCRAPPED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">{status}</span>;
    }
  };

  const getSeverityBadgeStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Quality Assurance & Rejection RMA
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log dimensional deviations, metallurgical test rejections, credit notes, and execute ForgeAI root cause CAPA directives.
          </p>
        </div>

        <button
          onClick={() => {
            setAiAnalysis(null);
            setIsApplied(false);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:brightness-110 text-primary-foreground text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Discrepancy RMA</span>
        </button>
      </div>

      {/* Floating Stat Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Total RMA Files</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-foreground">{returns.length} <span className="text-xs font-normal text-muted-foreground">Cases</span></p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Recorded quality deviations
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Under Inspection</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
              {returns.filter(r => r.action_status === 'INSPECTION_PENDING' || r.action_status === 'LOGGED').length} <span className="text-xs font-normal text-muted-foreground">Active</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Quarantine evaluation stage
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Scrapped Lots</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {returns.filter(r => r.action_status === 'SCRAPPED').length} <span className="text-xs font-normal text-muted-foreground">Scrapped</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Irreparable defects
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Credited Value</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{returns.reduce((acc, r) => acc + Number(r.credit_note_value || 0), 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Approved client adjustments
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['ALL', 'LOGGED', 'INSPECTION_PENDING', 'ACCEPTED_CREDITED', 'REWORK_ORDERED', 'SCRAPPED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] whitespace-nowrap transition-colors ${
                statusFilter === s 
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search RMA #, partner, findings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Returns Table (Desktop/Tablet) + Mobile Card View */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-2xs">
        {/* Desktop / Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-mono text-muted-foreground uppercase">
              <tr>
                <th className="py-2.5 px-3">RMA #</th>
                <th className="py-2.5 px-3">Counterparty</th>
                <th className="py-2.5 px-3">Defective Item</th>
                <th className="py-2.5 px-3">Returned Qty</th>
                <th className="py-2.5 px-3">Reason Code</th>
                <th className="py-2.5 px-3">Findings</th>
                <th className="py-2.5 px-3">Credit Note</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Floor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground text-xs font-mono">
                    No quality return / RMA records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40 transition-colors font-mono">
                    <td className="py-2.5 px-3 font-bold text-amber-500">
                      {r.rma_number}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-foreground max-w-[160px] truncate">
                      {r.entity?.legal_name}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-semibold text-foreground block font-mono text-xs">{r.sku?.sku_code}</span>
                      <span className="text-[11px] text-muted-foreground truncate block max-w-[180px]">{r.sku?.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-rose-500">
                      {r.quantity_returned} {r.sku?.unit_of_measure}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-muted-foreground">
                      {r.reason_code.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-muted-foreground max-w-[200px] truncate">
                      {r.inspection_findings || 'Pending lab report'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-400">
                      ₹{Number(r.credit_note_value).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      {getStatusBadge(r.action_status)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleInspectExistingRma(r)}
                          title="Run ForgeAI Root-Cause Diagnosis on this record"
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>AI CAPA</span>
                        </button>

                        {r.action_status === 'LOGGED' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'INSPECTION_PENDING')}
                            className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-mono text-[10px] font-semibold border border-amber-500/30"
                          >
                            Send to Lab
                          </button>
                        )}
                        {r.action_status === 'INSPECTION_PENDING' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'ACCEPTED_CREDITED')}
                            className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/30"
                          >
                            Approve Credit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive RMA Cards (Screen < md) */}
        <div className="block md:hidden divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-mono">
              No quality return / RMA records found.
            </div>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="p-3.5 space-y-2.5 hover:bg-muted/30 transition-colors font-mono">
                {/* Header row: RMA # + Status + Floor Action */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-amber-500 text-sm">{r.rma_number}</span>
                    <p className="font-semibold font-sans text-xs text-foreground mt-0.5">{r.entity?.legal_name}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {getStatusBadge(r.action_status)}
                    <button
                      onClick={() => handleInspectExistingRma(r)}
                      className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>AI CAPA</span>
                    </button>
                    {r.action_status === 'LOGGED' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'INSPECTION_PENDING')}
                        className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30"
                      >
                        Send to Lab
                      </button>
                    )}
                    {r.action_status === 'INSPECTION_PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'ACCEPTED_CREDITED')}
                        className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30"
                      >
                        Approve Credit
                      </button>
                    )}
                  </div>
                </div>

                {/* SKU Details */}
                <div>
                  <span className="font-bold text-primary text-xs">{r.sku?.sku_code}</span>
                  <span className="text-xs font-sans text-muted-foreground ml-1.5">{r.sku?.name}</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-muted/40 border border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-sans">Returned Qty</span>
                    <span className="font-bold text-rose-500">
                      {r.quantity_returned} {r.sku?.unit_of_measure}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-sans">Reason</span>
                    <span className="text-foreground text-[11px] truncate block">
                      {r.reason_code.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-sans">Credit Value</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">
                      ₹{Number(r.credit_note_value).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Findings Snippet */}
                {r.inspection_findings && (
                  <div className="text-[11px] font-sans text-muted-foreground bg-muted/20 p-2 rounded border border-border/40">
                    <span className="font-mono text-[10px] text-primary uppercase font-bold block mb-0.5">Lab Findings:</span>
                    {r.inspection_findings}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Log Discrepancy Modal with ForgeAI Root Cause Analyzer */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-container max-w-2xl animate-fade-in"
          >
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Log Discrepancy / RMA Rejection</h3>
                  <p className="text-[11px] text-muted-foreground">Document metallurgical flaw, off-spec dimensions, or transit damage with ForgeAI</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Counterparty Client <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={entityId}
                    onChange={(e) => setEntityId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Select counterparty...</option>
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>{e.legal_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Defective SKU Item <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={skuId}
                    onChange={(e) => setSkuId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Select SKU...</option>
                    {skus.map(s => (
                      <option key={s.id} value={s.id}>{s.sku_code} - {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Originating Work Order (Optional)
                  </label>
                  <select
                    value={workOrderId}
                    onChange={(e) => setWorkOrderId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">None / General Lot</option>
                    {workOrders.map(wo => (
                      <option key={wo.id} value={wo.id}>{wo.order_number}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Rejection Reason Code
                  </label>
                  <select
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value as ReturnReasonCode)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="DIMENSIONAL_OUT_OF_TOLERANCE">Dimensional Out of Tolerance</option>
                    <option value="MATERIAL_GRADE_DEFECT">Material Grade Defect</option>
                    <option value="SURFACE_FINISH_FAILURE">Surface Finish / Paint Failure</option>
                    <option value="TRANSIT_DAMAGE">Transit / Rigging Damage</option>
                    <option value="SPECIFICATION_MISMATCH">Drawing Specification Mismatch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Rejected Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="2.00"
                    value={quantityReturned}
                    onChange={(e) => setQuantityReturned(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Estimated Credit Note Value (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15000"
                    value={creditNoteValue}
                    onChange={(e) => setCreditNoteValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Findings Section with AI Root Cause Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    QC Metallurgical / Dimensional Findings
                  </label>
                  <button
                    type="button"
                    onClick={handleRunAiAnalysis}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 via-primary/15 to-cyan-500/15 hover:from-amber-500/25 hover:via-primary/25 hover:to-cyan-500/25 text-primary border border-amber-500/30 text-[11px] font-mono font-bold transition-all active:scale-95 group shadow-2xs"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing ? 'Analyzing Defect...' : 'Analyze Root Cause with ForgeAI'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="E.g. Web thickness measured 14.8mm vs specified 16mm (-1.2mm deviation beyond IS tolerance)..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* ForgeAI Diagnostic Card */}
              {aiAnalysis && (
                <div className="p-4 rounded-xl bg-card border border-amber-500/40 shadow-sm space-y-3 animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-cyan-500" />
                  
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-foreground">ForgeAI Diagnostic Card</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${getSeverityBadgeStyle(aiAnalysis.severity)}`}>
                        {aiAnalysis.severity} SEVERITY
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-muted-foreground font-bold">{aiAnalysis.confidenceScore}% Confidence</span>
                      <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {aiAnalysis.meta.mode === 'LIVE_AI' ? 'Gemini 2.5 Flash' : 'Heuristic Engine'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Probable Root Cause:
                      </span>
                      <p className="text-foreground leading-relaxed font-sans bg-muted/40 p-2 rounded-lg border border-border/60">
                        {aiAnalysis.rootCause}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Recommended Corrective & Preventive Action (CAPA):
                      </span>
                      <p className="text-cyan-700 dark:text-cyan-300 leading-relaxed font-sans bg-cyan-500/10 p-2.5 rounded-lg border border-cyan-500/20 font-medium">
                        {aiAnalysis.recommendedCapa}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Latency: {aiAnalysis.meta.latencyMs}ms
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyCapaToForm}
                      disabled={isApplied}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:brightness-110 disabled:bg-emerald-600 text-primary-foreground text-xs font-semibold shadow-xs transition-all active:scale-95"
                    >
                      {isApplied ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isApplied ? 'CAPA Applied to Findings' : 'Apply to RMA Form'}</span>
                    </button>
                  </div>
                </div>
              )}

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
                  Log RMA Discrepancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Existing RMA AI Inspection Modal */}
      {inspectModalRma && (
        <div className="modal-overlay" onClick={() => setInspectModalRma(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-container max-w-xl animate-fade-in"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    ForgeAI Root-Cause Diagnosis
                    <span className="text-amber-500 font-mono text-xs">({inspectModalRma.rma_number})</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{inspectModalRma.sku?.name} • {inspectModalRma.entity?.legal_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setInspectModalRma(null)} 
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 bg-card">
              {inspectIsAnalyzing ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto" />
                  <p className="text-xs font-mono text-muted-foreground">Synthesizing metallurgical root cause & CAPA...</p>
                </div>
              ) : inspectAiAnalysis ? (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${getSeverityBadgeStyle(inspectAiAnalysis.severity)}`}>
                      {inspectAiAnalysis.severity} SEVERITY DEFECT
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Confidence: <strong>{inspectAiAnalysis.confidenceScore}%</strong> • {inspectAiAnalysis.meta.mode === 'LIVE_AI' ? 'Gemini Live' : 'Heuristic Model'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Probable Root Cause:
                    </span>
                    <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded-xl border border-border/60 leading-relaxed font-sans">
                      {inspectAiAnalysis.rootCause}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Recommended CAPA Directive:
                    </span>
                    <p className="text-xs text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 leading-relaxed font-sans font-medium">
                      {inspectAiAnalysis.recommendedCapa}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No analysis available.</p>
              )}

              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectModalRma(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-muted text-foreground border border-border transition-colors"
                >
                  Close Diagnostic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
