import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X, 
  ChevronRight, 
  FileText, 
  Truck,
  ShieldAlert,
  Calendar,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { forgeflowApi } from '../../api/forgeflowApi';
import type { WorkOrder, SkuItem, TradingEntity, WorkOrderStatus, WorkOrderPriority } from '../../types/forgeflow.types';
import { useForgeflowStore } from '../../store/useForgeflowStore';

export const WorkOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [entities, setEntities] = useState<TradingEntity[]>([]);
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Slide-over drawer
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  
  // Create modal state
  const { isNewWorkOrderOpen, setNewWorkOrderOpen } = useForgeflowStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (isNewWorkOrderOpen) {
      setCreateModalOpen(true);
    }
  }, [isNewWorkOrderOpen]);

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setNewWorkOrderOpen(false);
  };
  const [newEntityId, setNewEntityId] = useState<number | ''>('');
  const [newOrderType, setNewOrderType] = useState('SALES_DISPATCH');
  const [newPriority, setNewPriority] = useState<WorkOrderPriority>('STANDARD');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [lineItems, setLineItems] = useState<{ sku_id: number; quantity_ordered: number; unit_rate: number }[]>([]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await forgeflowApi.getWorkOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuxData = async () => {
    try {
      const [eData, sData] = await Promise.all([
        forgeflowApi.getEntities(),
        forgeflowApi.getSkus(),
      ]);
      setEntities(eData);
      setSkus(sData);
      if (sData.length > 0 && lineItems.length === 0) {
        setLineItems([{ sku_id: sData[0].id, quantity_ordered: 1, unit_rate: sData[0].unit_price }]);
      }
    } catch (err) {
      console.error('Failed to load auxiliary data:', err);
    }
  };

  useEffect(() => {
    loadOrders();
    loadAuxData();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const updated = await forgeflowApi.updateWorkOrderStatus(orderId, {
        status: newStatus,
        notes: `Advanced to ${newStatus} on floor control console.`
      });
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleAddLineItem = () => {
    if (skus.length > 0) {
      setLineItems([...lineItems, { sku_id: skus[0].id, quantity_ordered: 1, unit_rate: skus[0].unit_price }]);
    }
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityId || !newTargetDate || lineItems.length === 0) {
      alert('Please fill all required fields and at least one item line.');
      return;
    }

    try {
      const created = await forgeflowApi.createWorkOrder({
        entity_id: Number(newEntityId),
        order_type: newOrderType,
        priority: newPriority,
        target_fulfillment_date: newTargetDate,
        operator_notes: newNotes,
        items: lineItems,
      });
      setOrders([created, ...orders]);
      setCreateModalOpen(false);
      setNewNotes('');
      alert(`Work Order ${created.order_number} initiated successfully.`);
    } catch (err) {
      alert('Error creating work order. Check inputs.');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch = 
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.entity?.legal_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'IN_PRODUCTION':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />IN PRODUCTION</span>;
      case 'STAGED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">STAGED</span>;
      case 'QUEUED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">QUEUED</span>;
      case 'DISPATCH_READY':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">DISPATCH READY</span>;
      case 'FULFILLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" />FULFILLED</span>;
      case 'QUALITY_HOLD':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">QUALITY HOLD</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-muted text-muted-foreground">{status}</span>;
    }
  };

  const getPriorityBadge = (p: WorkOrderPriority) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1"><ShieldAlert className="w-3 h-3 animate-pulse" />CRITICAL</span>;
      case 'EXPEDITED':
        return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">EXPEDITED</span>;
      default:
        return <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-md bg-muted border border-border">STANDARD</span>;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in relative pb-8">
      {/* View Header Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Work Orders & Batch Runs
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sequencing, fabrication runs, priority scheduling, and customer dispatch verification.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            loadAuxData();
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border shadow-md">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['ALL', 'QUEUED', 'STAGED', 'IN_PRODUCTION', 'DISPATCH_READY', 'FULFILLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
                statusFilter === st 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search order # or counterparty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg bg-muted/60 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* High-Density Solid Table (Desktop & Tablet) + Mobile Responsive Card View */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
        {/* Desktop & Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/70 border-b border-border text-[11px] font-mono text-muted-foreground uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Counterparty Client</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Completion</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Floor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-xs font-mono">
                    No work orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      <span className="text-primary group-hover:underline">{order.order_number}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground max-w-[200px] truncate">
                      {order.entity?.legal_name || 'Counterparty'}
                    </td>
                    <td className="py-3 px-4">
                      {getPriorityBadge(order.priority)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {order.order_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {order.target_fulfillment_date}
                    </td>
                    <td className="py-3 px-4 w-36">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              order.completion_percent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                            }`}
                            style={{ width: `${order.completion_percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-muted-foreground">{order.completion_percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      ₹{Number(order.grand_total).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {order.status === 'QUEUED' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'STAGED')}
                          className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-bold border border-amber-500/30 transition-colors"
                        >
                          Stage Lot
                        </button>
                      )}
                      {order.status === 'STAGED' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'IN_PRODUCTION')}
                          className="px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-400 font-mono text-[11px] font-bold border border-cyan-500/30 transition-colors"
                        >
                          Start Floor Run
                        </button>
                      )}
                      {order.status === 'IN_PRODUCTION' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'DISPATCH_READY')}
                          className="px-2.5 py-1 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-500/30 transition-colors"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'DISPATCH_READY' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'FULFILLED')}
                          className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/30 transition-colors inline-flex items-center gap-1"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Dispatch</span>
                        </button>
                      )}
                      {order.status === 'FULFILLED' && (
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Card View (Screen < md) */}
        <div className="block md:hidden divide-y divide-border/60">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs font-mono">
              No work orders found matching the filter criteria.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div 
                key={order.id}
                className="p-4 hover:bg-muted/40 transition-colors cursor-pointer space-y-3"
                onClick={() => setSelectedOrder(order)}
              >
                {/* Header row: Order # + Status + Priority */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-primary">{order.order_number}</span>
                      {getPriorityBadge(order.priority)}
                    </div>
                    <p className="font-semibold text-xs text-foreground mt-0.5">
                      {order.entity?.legal_name || 'Counterparty'}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block font-sans">Order Type</span>
                    <span className="font-medium text-foreground text-[11px]">{order.order_type.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block font-sans">Target Due Date</span>
                    <span className="font-medium text-foreground text-[11px]">{order.target_fulfillment_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block font-sans">Grand Total</span>
                    <span className="font-bold text-foreground text-[11px]">₹{Number(order.grand_total).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block font-sans">Progress</span>
                    <span className="font-bold text-foreground text-[11px]">{order.completion_percent}% Done</span>
                  </div>
                </div>

                {/* Completion progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      order.completion_percent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                    }`}
                    style={{ width: `${order.completion_percent}%` }}
                  />
                </div>

                {/* Action button row */}
                <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] font-mono text-muted-foreground">Tap card for details</span>
                  <div>
                    {order.status === 'QUEUED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'STAGED')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/30 transition-colors"
                      >
                        Stage Lot
                      </button>
                    )}
                    {order.status === 'STAGED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'IN_PRODUCTION')}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30 transition-colors"
                      >
                        Start Floor Run
                      </button>
                    )}
                    {order.status === 'IN_PRODUCTION' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'DISPATCH_READY')}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30 transition-colors"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'DISPATCH_READY' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'FULFILLED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch</span>
                      </button>
                    )}
                    {order.status === 'FULFILLED' && (
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">Fulfilled</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Slide-over Inspection Drawer with Solid Background */}
      {selectedOrder && (
        <div 
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 dark:bg-black/40 backdrop-blur-md animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-full sm:max-w-xl slideover-panel relative z-10 animate-slide-in"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground font-mono">{selectedOrder.order_number}</h3>
                  <p className="text-xs text-muted-foreground">{selectedOrder.entity?.legal_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-card">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-xl text-xs font-mono border border-border">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Priority</span>
                  <div className="mt-1">{getPriorityBadge(selectedOrder.priority)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Target Due Date</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedOrder.target_fulfillment_date}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Total Order Value</span>
                  <p className="font-bold text-cyan-700 dark:text-cyan-400 mt-0.5 text-sm">₹{Number(selectedOrder.grand_total).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-2.5">
                  Scheduled Line Items
                </h4>
                <div className="border border-border rounded-xl overflow-x-auto bg-card shadow-sm">
                  <table className="w-full text-left text-xs min-w-[340px]">
                    <thead className="bg-muted text-[10px] font-mono text-muted-foreground uppercase font-bold">
                      <tr>
                        <th className="p-3">SKU Item</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Rate</th>
                        <th className="p-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id} className="font-mono hover:bg-muted/30">
                          <td className="p-3">
                            <p className="font-bold text-foreground font-sans">{item.sku?.name || `SKU #${item.sku_id}`}</p>
                            <span className="text-[10px] text-primary">{item.sku?.sku_code}</span>
                          </td>
                          <td className="p-3 font-bold text-foreground">
                            {item.quantity_ordered} {item.sku?.unit_of_measure}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            ₹{Number(item.unit_rate).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-bold text-foreground">
                            ₹{Number(item.line_total).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Operator Notes */}
              {selectedOrder.operator_notes && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-2">
                    Engineering & Quality Floor Notes
                  </h4>
                  <div className="p-3.5 bg-muted/50 rounded-xl text-xs font-mono text-foreground border border-border whitespace-pre-line">
                    {selectedOrder.operator_notes}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-border bg-muted/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Floor Controls:</span>
              <div className="flex items-center gap-2">
                {selectedOrder.status !== 'FULFILLED' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'FULFILLED')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete & Dispatch</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-semibold border border-border"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Work Order Modal */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-container max-w-3xl animate-fade-in"
          >
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Initiate Floor Work Order</h3>
                  <p className="text-[11px] text-muted-foreground">Queue production batch runs or customer dispatch lots</p>
                </div>
              </div>
              <button 
                onClick={closeCreateModal}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Counterparty */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Client / Counterparty <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newEntityId}
                    onChange={(e) => setNewEntityId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Select Trading Partner...</option>
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>{e.legal_name} ({e.entity_type})</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as WorkOrderPriority)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono font-semibold"
                  >
                    <option value="STANDARD">STANDARD</option>
                    <option value="EXPEDITED">EXPEDITED</option>
                    <option value="CRITICAL">CRITICAL (EXPEDITE)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Order Classification
                  </label>
                  <select
                    value={newOrderType}
                    onChange={(e) => setNewOrderType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="SALES_DISPATCH">Sales Dispatch Order</option>
                    <option value="PRODUCTION_BATCH">Internal Production Batch</option>
                    <option value="SUBCONTRACT_RUN">Subcontract Run</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Target Fulfillment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-foreground">
                    Required SKU Items & Quantity <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div className="space-y-2 border border-border p-3 rounded-xl bg-muted/30">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-card p-2.5 rounded-lg border border-border shadow-xs">
                      <select
                        value={item.sku_id}
                        onChange={(e) => {
                          const skuId = Number(e.target.value);
                          const sel = skus.find(s => s.id === skuId);
                          const updated = [...lineItems];
                          updated[idx].sku_id = skuId;
                          if (sel) updated[idx].unit_rate = sel.unit_price;
                          setLineItems(updated);
                        }}
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-muted/60 border border-input rounded-lg text-foreground"
                      >
                        {skus.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.sku_code} - {s.name} ({s.unit_of_measure})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 sm:w-24">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Qty"
                            value={item.quantity_ordered}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              updated[idx].quantity_ordered = Number(e.target.value);
                              setLineItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-muted/60 border border-input rounded-lg text-foreground font-mono font-bold"
                          />
                        </div>

                        <div className="flex-1 sm:w-28">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Rate ₹"
                            value={item.unit_rate}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              updated[idx].unit_rate = Number(e.target.value);
                              setLineItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-muted/60 border border-input rounded-lg text-foreground font-mono font-bold"
                          />
                        </div>

                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="p-1.5 text-muted-foreground hover:text-rose-500 rounded hover:bg-muted shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Operator Notes / Heat Specification
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="E.g., Ultrasonic testing mandated, heat number tagging..."
                  className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-muted text-foreground border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-md shadow-primary/25"
                >
                  Create & Sequence Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
