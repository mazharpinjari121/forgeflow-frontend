import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Layers, 
  Package, 
  Building2, 
  ArrowLeftRight, 
  AlertTriangle, 
  CreditCard, 
  Plus, 
  X,
  Gauge,
  Cpu
} from 'lucide-react';
import { useForgeflowStore } from '../../store/useForgeflowStore';

import { canAccessModule, AppModule } from '../../auth/permissions';

export const ForgeFlowCommandPalette: React.FC = () => {
  const { 
    operator,
    isCommandPaletteOpen, 
    setCommandPalette,
    setNewWorkOrderOpen,
    setLogMovementOpen,
    setNewSkuOpen,
    setNewEntityOpen
  } = useForgeflowStore();

  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPalette(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPalette]);

  if (!isCommandPaletteOpen) return null;

  const allActions = [
    { title: 'Operations Telemetry Dashboard', path: '/dashboard', module: 'dashboard' as AppModule, icon: Gauge, category: 'Navigation' },
    { title: 'Work Orders & Batch Runs', path: '/work-orders', module: 'work-orders' as AppModule, icon: Layers, category: 'Navigation' },
    { title: 'Catalog & SKU Stock', path: '/inventory', module: 'inventory' as AppModule, icon: Package, category: 'Navigation' },
    { title: 'Stock Movement Ledger', path: '/movements', module: 'movements' as AppModule, icon: ArrowLeftRight, category: 'Navigation' },
    { title: 'Trading Counterparties & Mills', path: '/counterparties', module: 'counterparties' as AppModule, icon: Building2, category: 'Navigation' },
    { title: 'Settlements & Flow Ledger', path: '/settlements', module: 'settlements' as AppModule, icon: CreditCard, category: 'Navigation' },
    { title: 'Discrepancy & Quality RMA', path: '/quality-returns', module: 'quality-returns' as AppModule, icon: AlertTriangle, category: 'Navigation' },
    { title: 'Platform Engine & API Contracts', path: '/engine-diagnostics', module: 'engine-diagnostics' as AppModule, icon: Cpu, category: 'Navigation' },
    
    // Quick Actions
    { 
      title: 'Create New Work Order', 
      module: 'work-orders' as AppModule,
      action: () => { setCommandPalette(false); setNewWorkOrderOpen(true); navigate('/work-orders'); }, 
      icon: Plus, 
      category: 'Operations Action' 
    },
    { 
      title: 'Log Material Inward / Movement', 
      module: 'inventory' as AppModule,
      action: () => { setCommandPalette(false); setLogMovementOpen(true); navigate('/inventory'); }, 
      icon: ArrowLeftRight, 
      category: 'Operations Action' 
    },
    { 
      title: 'Register New SKU Item', 
      module: 'inventory' as AppModule,
      action: () => { setCommandPalette(false); setNewSkuOpen(true); navigate('/inventory'); }, 
      icon: Package, 
      category: 'Operations Action' 
    },
    { 
      title: 'Onboard New Trading Counterparty', 
      module: 'counterparties' as AppModule,
      action: () => { setCommandPalette(false); setNewEntityOpen(true); navigate('/counterparties'); }, 
      icon: Building2, 
      category: 'Operations Action' 
    },
  ];

  const roleFilteredActions = allActions.filter(a => canAccessModule(operator?.role, a.module));

  const filtered = roleFilteredActions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div 
      className="modal-overlay items-start pt-6 sm:pt-20 px-3 sm:px-4"
      onClick={() => setCommandPalette(false)}
    >
      <div 
        className="modal-container max-w-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-border bg-muted/60">
          <Search className="w-4 h-4 text-primary mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, jump to SKU, Work Order, or Counterparty... (ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button 
            onClick={() => setCommandPalette(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2.5 space-y-1 bg-card">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground font-mono">
              No actions or pages found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.path) {
                      navigate(item.path);
                      setCommandPalette(false);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs hover:bg-muted/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/80">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
