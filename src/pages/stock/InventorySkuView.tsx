import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  ArrowLeftRight, 
  X, 
  Check, 
  ArrowDownLeft, 
  ArrowUpRight,
  Boxes,
  MapPin,
  Tag
} from 'lucide-react';
import { forgeflowApi } from '../../api/forgeflowApi';
import type { SkuItem, CommodityCategory, MaterialClassification } from '../../types/forgeflow.types';
import { useForgeflowStore } from '../../store/useForgeflowStore';

export const InventorySkuView: React.FC = () => {
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [categories, setCategories] = useState<CommodityCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');

  // Global store triggers
  const { isLogMovementOpen, setLogMovementOpen, isNewSkuOpen, setNewSkuOpen } = useForgeflowStore();

  // Modals
  const [createSkuModalOpen, setCreateSkuModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedSkuForMove, setSelectedSkuForMove] = useState<SkuItem | null>(null);

  useEffect(() => {
    if (isLogMovementOpen && skus.length > 0) {
      setSelectedSkuForMove(skus[0]);
      setMovementModalOpen(true);
    }
  }, [isLogMovementOpen, skus]);

  useEffect(() => {
    if (isNewSkuOpen) {
      setCreateSkuModalOpen(true);
    }
  }, [isNewSkuOpen]);

  const closeCreateSku = () => {
    setCreateSkuModalOpen(false);
    setNewSkuOpen(false);
  };

  const closeMovementModal = () => {
    setMovementModalOpen(false);
    setLogMovementOpen(false);
  };

  // New SKU form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [classification, setClassification] = useState<MaterialClassification>('RAW_MATERIAL');
  const [unitOfMeasure, setUnitOfMeasure] = useState('METRIC_TON');
  const [unitPrice, setUnitPrice] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [materialGrade, setMaterialGrade] = useState('');
  const [locationBin, setLocationBin] = useState('');

  // Movement Form state
  const [moveType, setMoveType] = useState('INWARD_RECEIPT');
  const [moveQty, setMoveQty] = useState('');
  const [moveRef, setMoveRef] = useState('');
  const [moveNotes, setMoveNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, cData] = await Promise.all([
        forgeflowApi.getSkus(),
        forgeflowApi.getCategories(),
      ]);
      setSkus(sData);
      setCategories(cData);
      if (cData.length > 0 && categoryId === '') {
        setCategoryId(cData[0].id);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !unitPrice || !minThreshold) {
      alert('Please fill all mandatory fields.');
      return;
    }

    try {
      const created = await forgeflowApi.createSku({
        name,
        category_id: Number(categoryId),
        classification,
        unit_of_measure: unitOfMeasure,
        unit_price: Number(unitPrice),
        min_threshold_alert: Number(minThreshold),
        initial_stock: Number(initialStock || 0),
        material_grade: materialGrade,
        location_bin: locationBin,
      });

      setSkus([created, ...skus]);
      setCreateSkuModalOpen(false);
      setName('');
      setUnitPrice('');
      setMinThreshold('');
      setInitialStock('0');
      alert(`SKU ${created.sku_code} registered successfully.`);
    } catch (err) {
      alert('Error registering SKU.');
    }
  };

  const handleLogMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkuForMove || !moveQty || !moveRef) {
      alert('Please fill required movement details.');
      return;
    }

    try {
      await forgeflowApi.logMovement({
        sku_id: selectedSkuForMove.id,
        movement_type: moveType,
        quantity: Number(moveQty),
        reference_document: moveRef,
        reason_notes: moveNotes,
      });

      setMovementModalOpen(false);
      setMoveQty('');
      setMoveRef('');
      setMoveNotes('');
      loadData();
      alert('Stock movement registered successfully in ledger.');
    } catch (err) {
      alert('Error recording stock movement.');
    }
  };

  const filteredSkus = skus.filter(s => {
    const matchesClass = classificationFilter === 'ALL' || s.classification === classificationFilter;
    const matchesLowStock = !lowStockOnly || Number(s.current_stock) <= Number(s.min_threshold_alert);
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.sku_code.toLowerCase().includes(search.toLowerCase()) ||
      (s.material_grade || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.location_bin || '').toLowerCase().includes(search.toLowerCase());
    return matchesClass && matchesLowStock && matchesSearch;
  });

  const totalStockValuation = skus.reduce((acc, item) => acc + (Number(item.current_stock) * Number(item.unit_price)), 0);
  const stockoutRiskCount = skus.filter(s => Number(s.current_stock) <= Number(s.min_threshold_alert)).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Catalog & SKU Inventory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor raw sections, alloy plates, fabrication WIP, finished goods, and threshold stock alerts.
          </p>
        </div>

        <button
          onClick={() => setCreateSkuModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:brightness-110 text-primary-foreground text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register New SKU</span>
        </button>
      </div>

      {/* Floating Stat Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Total SKUs</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-foreground">{skus.length} <span className="text-xs font-normal text-muted-foreground">Items</span></p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Active in plant catalog
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Stockout Risk</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-extrabold font-mono ${stockoutRiskCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {stockoutRiskCount} <span className="text-xs font-normal text-muted-foreground">Alerts</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Below safety buffer
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Stock Valuation</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-cyan-700 dark:text-cyan-400">₹{(totalStockValuation / 100000).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">Lakhs</span></p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Weighted physical stock
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Commodity Classes</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-foreground">{categories.length} <span className="text-xs font-normal text-muted-foreground">Categories</span></p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Plates, beams, consumables
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        {/* Classification Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['ALL', 'RAW_MATERIAL', 'SEMI_FINISHED_WIP', 'FINISHED_PRODUCT', 'CONSUMABLE_HARDWARE'].map((cl) => (
            <button
              key={cl}
              onClick={() => setClassificationFilter(cl)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] whitespace-nowrap transition-colors ${
                classificationFilter === cl 
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {cl.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary"
            />
            <span className="font-mono text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Low Stock Only</span>
          </label>

          <div className="relative w-full md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search code, grade, bin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* High-Density SKU Inventory Table (Desktop/Tablet) + Mobile Card View */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-2xs">
        {/* Desktop / Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-mono text-muted-foreground uppercase">
              <tr>
                <th className="py-2.5 px-3">SKU Code</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Grade / Specs</th>
                <th className="py-2.5 px-3">Location Bin</th>
                <th className="py-2.5 px-3">Stock Level</th>
                <th className="py-2.5 px-3">Available</th>
                <th className="py-2.5 px-3">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground text-xs font-mono">
                    No SKU items found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSkus.map((sku) => {
                  const isLowStock = Number(sku.current_stock) <= Number(sku.min_threshold_alert);
                  return (
                    <tr key={sku.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">
                        {sku.sku_code}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground max-w-[240px]">
                        <p className="truncate font-semibold">{sku.name}</p>
                        <span className="text-[10px] text-muted-foreground font-mono">{sku.category?.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {sku.classification}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                        {sku.material_grade || 'Standard'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span className="flex items-center gap-1 text-foreground">
                          <MapPin className="w-3 h-3 text-cyan-500" />
                          {sku.location_bin || 'FLOOR-YARD'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                            {sku.current_stock} {sku.unit_of_measure}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] font-mono px-1 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-0.5 font-bold">
                              <AlertTriangle className="w-2.5 h-2.5" /> LOW
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">Min Alert: {sku.min_threshold_alert}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-500 font-semibold">
                        {sku.available_stock} {sku.unit_of_measure}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        ₹{Number(sku.unit_price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedSkuForMove(sku);
                            setMovementModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground font-mono text-[11px] border border-border transition-colors flex items-center gap-1 ml-auto"
                        >
                          <ArrowLeftRight className="w-3 h-3 text-cyan-500" />
                          <span>Movement</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive SKU Cards (Screen < md) */}
        <div className="block md:hidden divide-y divide-border/60">
          {filteredSkus.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-mono">
              No SKU items found matching the filter criteria.
            </div>
          ) : (
            filteredSkus.map((sku) => {
              const isLowStock = Number(sku.current_stock) <= Number(sku.min_threshold_alert);
              return (
                <div key={sku.id} className="p-3.5 space-y-2.5 hover:bg-muted/30 transition-colors">
                  {/* Top row: Code + Classification + Low Stock alert */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-sm text-primary">{sku.sku_code}</span>
                        <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono text-[10px]">
                          {sku.classification}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3 h-3" /> LOW STOCK
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-xs text-foreground mt-0.5">{sku.name}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">{sku.category?.name}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSkuForMove(sku);
                        setMovementModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-muted text-secondary-foreground font-mono text-xs border border-border transition-all flex items-center gap-1 shrink-0 active:scale-95 shadow-xs"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Move</span>
                    </button>
                  </div>

                  {/* Location & Grade */}
                  <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1 text-foreground">
                      <MapPin className="w-3 h-3 text-cyan-500" />
                      Bin: <strong className="text-foreground">{sku.location_bin || 'FLOOR-YARD'}</strong>
                    </span>
                    <span>•</span>
                    <span>Grade: {sku.material_grade || 'Standard'}</span>
                  </div>

                  {/* Stock Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-muted/40 border border-border/60 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-sans">Physical Stock</span>
                      <span className={`font-bold ${isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                        {sku.current_stock} {sku.unit_of_measure}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-sans">Available</span>
                      <span className="font-bold text-emerald-500">
                        {sku.available_stock} {sku.unit_of_measure}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-sans">Unit Price</span>
                      <span className="font-bold text-foreground">
                        ₹{Number(sku.unit_price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Register New SKU Modal */}
      {createSkuModalOpen && (
        <div className="modal-overlay" onClick={closeCreateSku}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-container max-w-2xl animate-fade-in"
          >
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Register New Material SKU</h3>
                  <p className="text-[11px] text-muted-foreground">Add raw steel plates, profiles, or fabricated parts to catalog</p>
                </div>
              </div>
              <button 
                onClick={closeCreateSku} 
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSku} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-card">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  SKU Item Name / Specification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. ASTM A516 Gr 70 Heavy Boiler Plate 20mm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Commodity Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code_prefix})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Material Classification
                  </label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value as MaterialClassification)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="SEMI_FINISHED_WIP">Semi-Finished WIP</option>
                    <option value="FINISHED_PRODUCT">Finished Product</option>
                    <option value="CONSUMABLE_HARDWARE">Consumable Hardware</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Unit of Measure
                  </label>
                  <select
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="METRIC_TON">METRIC_TON</option>
                    <option value="KG">KG</option>
                    <option value="PCS">PCS</option>
                    <option value="METER">METER</option>
                    <option value="SET">SET</option>
                    <option value="BUNDLE">BUNDLE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Unit Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="65000"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Min Alert Buffer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="15"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Material Grade
                  </label>
                  <input
                    type="text"
                    placeholder="IS 2062 E250"
                    value={materialGrade}
                    onChange={(e) => setMaterialGrade(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Location Bin
                  </label>
                  <input
                    type="text"
                    placeholder="BAY-A / RACK-03"
                    value={locationBin}
                    onChange={(e) => setLocationBin(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeCreateSku}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-muted text-foreground border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-md shadow-primary/25 transition-all active:scale-95"
                >
                  Save & Register SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Movement Modal */}
      {movementModalOpen && selectedSkuForMove && (
        <div className="modal-overlay" onClick={closeMovementModal}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-container max-w-xl animate-fade-in"
          >
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Log Material Movement</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">{selectedSkuForMove.sku_code} • {selectedSkuForMove.name}</p>
                </div>
              </div>
              <button 
                onClick={closeMovementModal} 
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogMovement} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-card">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Movement Classification
                </label>
                <select
                  value={moveType}
                  onChange={(e) => setMoveType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="INWARD_RECEIPT">INWARD RECEIPT (Supplier GRN / Mill intake)</option>
                  <option value="PRODUCTION_CONSUME">PRODUCTION CONSUMPTION (Issued to CNC/Shop)</option>
                  <option value="PRODUCTION_YIELD">PRODUCTION YIELD (Finished lot output)</option>
                  <option value="OUTWARD_DISPATCH">OUTWARD DISPATCH (Customer consignment)</option>
                  <option value="INVENTORY_RECONCILE">INVENTORY RECONCILIATION (Audit adjustment)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Quantity ({selectedSkuForMove.unit_of_measure}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="10.00"
                    value={moveQty}
                    onChange={(e) => setMoveQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Reference Document <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="GRN-8841 / REQ-102"
                    value={moveRef}
                    onChange={(e) => setMoveRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Floor Reason / Remarks
                </label>
                <input
                  type="text"
                  placeholder="E.g. Consumed for Bridge Girder assembly"
                  value={moveNotes}
                  onChange={(e) => setMoveNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeMovementModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-muted text-foreground border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-md shadow-primary/25 transition-all active:scale-95"
                >
                  Commit Ledger Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
