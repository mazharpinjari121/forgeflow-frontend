import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  ExternalLink, 
  MessageSquare, 
  X, 
  MapPin, 
  ShieldCheck,
  CreditCard,
  Layers
} from 'lucide-react';
import { forgeflowApi } from '../../api/forgeflowApi';
import type { TradingEntity, EntityType } from '../../types/forgeflow.types';

export const CounterpartiesView: React.FC = () => {
  const [entities, setEntities] = useState<TradingEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Modal & Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<TradingEntity | null>(null);

  // Form State
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('CLIENT');
  const [primaryContact, setPrimaryContact] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [taxIdentifier, setTaxIdentifier] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  const loadEntities = async () => {
    setLoading(true);
    try {
      const data = await forgeflowApi.getEntities();
      setEntities(data);
    } catch (err) {
      console.error('Failed to load counterparties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntities();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName || !primaryContact || !phone || !email || !taxIdentifier || !billingAddress || !city || !state || !postalCode) {
      alert('Please fill all mandatory fields.');
      return;
    }

    try {
      const created = await forgeflowApi.createEntity({
        legal_name: legalName,
        trade_name: tradeName || legalName,
        entity_type: entityType,
        primary_contact: primaryContact,
        phone,
        whatsapp: whatsapp || phone,
        email,
        tax_identifier: taxIdentifier,
        pan_number: panNumber,
        credit_limit: Number(creditLimit || 0),
        payment_terms_days: Number(paymentTermsDays || 30),
        billing_address: billingAddress,
        city,
        state,
        postal_code: postalCode,
        notes,
      });

      setEntities([created, ...entities]);
      setCreateModalOpen(false);
      // Reset form
      setLegalName('');
      setPrimaryContact('');
      setPhone('');
      setEmail('');
      setTaxIdentifier('');
      setBillingAddress('');
      setCity('');
      setState('');
      setPostalCode('');
      alert(`Counterparty ${created.entity_code} onboarded successfully.`);
    } catch (err) {
      alert('Error creating counterparty.');
    }
  };

  const filtered = entities.filter(e => {
    const matchesType = typeFilter === 'ALL' || e.entity_type === typeFilter;
    const matchesSearch = 
      e.legal_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.trade_name || '').toLowerCase().includes(search.toLowerCase()) ||
      e.entity_code.toLowerCase().includes(search.toLowerCase()) ||
      e.primary_contact.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeBadge = (type: EntityType) => {
    switch (type) {
      case 'CLIENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">CLIENT</span>;
      case 'SUPPLIER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">SUPPLIER</span>;
      case 'FABRICATOR_PARTNER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">FABRICATOR</span>;
      case 'DISTRIBUTOR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">DISTRIBUTOR</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">{type}</span>;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Trading Counterparties & Mills
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Maintain OEM clients, steel rolling mills, external fabricators, credit terms, and GSTIN accounts.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:brightness-110 text-primary-foreground text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Onboard Counterparty</span>
        </button>
      </div>

      {/* Floating Stat Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Total Partners</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-foreground">{entities.length} <span className="text-xs font-normal text-muted-foreground">Entities</span></p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Active trading counterparties
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">OEM Buyers</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
              {entities.filter(e => e.entity_type === 'CLIENT').length} <span className="text-xs font-normal text-muted-foreground">Clients</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Direct sales accounts
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Steel Rolling Mills</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {entities.filter(e => e.entity_type === 'SUPPLIER').length} <span className="text-xs font-normal text-muted-foreground">Mills</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Primary raw plate suppliers
          </div>
        </div>

        <div className="floating-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Total Ledger Balance</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold font-mono text-foreground">
              ₹{(entities.reduce((acc, e) => acc + Number(e.outstanding_balance), 0) / 100000).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">Lakhs</span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            Net outstanding exposure
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['ALL', 'CLIENT', 'SUPPLIER', 'FABRICATOR_PARTNER', 'DISTRIBUTOR'].map(t => (
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
            placeholder="Search legal name, GSTIN, city, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Counterparties Table (Desktop/Tablet) + Mobile Card View */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-2xs">
        {/* Desktop / Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-mono text-muted-foreground uppercase">
              <tr>
                <th className="py-2.5 px-3">Entity Code</th>
                <th className="py-2.5 px-3">Legal Name / Trading Entity</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Key Contact</th>
                <th className="py-2.5 px-3">Tax ID (GSTIN)</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Credit Terms</th>
                <th className="py-2.5 px-3">Outstanding Balance</th>
                <th className="py-2.5 px-3 text-right">Quick Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground text-xs font-mono">
                    No counterparty entities found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr 
                    key={e.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedEntity(e)}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">
                      {e.entity_code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground max-w-[220px]">
                      <p className="font-semibold text-foreground truncate">{e.legal_name}</p>
                      {e.trade_name && e.trade_name !== e.legal_name && (
                        <span className="text-[10px] text-muted-foreground truncate block">{e.trade_name}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {getTypeBadge(e.entity_type)}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-foreground">{e.primary_contact}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">{e.phone}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-foreground">
                      {e.tax_identifier}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {e.city}, {e.state}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                      {e.payment_terms_days} Days (Lim: ₹{(Number(e.credit_limit) / 100000).toFixed(1)}L)
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      ₹{Number(e.outstanding_balance).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a 
                          href={`tel:${e.phone}`}
                          title="Call Counterparty"
                          className="p-1 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a 
                          href={`https://wa.me/${e.whatsapp ? e.whatsapp.replace(/[^0-9]/g, '') : e.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp Dispatch Update"
                          className="p-1 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Counterparty Cards (Screen < md) */}
        <div className="block md:hidden divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-mono">
              No counterparty entities found.
            </div>
          ) : (
            filtered.map((e) => (
              <div 
                key={e.id}
                onClick={() => setSelectedEntity(e)}
                className="p-3.5 space-y-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                {/* Header row: Code + Type badge + Quick contact icons */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-primary">{e.entity_code}</span>
                      {getTypeBadge(e.entity_type)}
                    </div>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{e.legal_name}</p>
                    {e.trade_name && e.trade_name !== e.legal_name && (
                      <span className="text-[10px] text-muted-foreground">{e.trade_name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(ev) => ev.stopPropagation()}>
                    <a 
                      href={`tel:${e.phone}`}
                      title="Call Counterparty"
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a 
                      href={`https://wa.me/${e.whatsapp ? e.whatsapp.replace(/[^0-9]/g, '') : e.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp Dispatch Update"
                      className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Contact person & Location */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Contact: <strong className="text-foreground">{e.primary_contact}</strong></span>
                  <span>{e.city}, {e.state}</span>
                </div>

                {/* Financial and GSTIN info grid */}
                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/40 border border-border/60 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block font-sans">GSTIN / Tax ID</span>
                    <span className="font-bold text-foreground text-[11px]">{e.tax_identifier}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block font-sans">Outstanding Exposure</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">
                      ₹{Number(e.outstanding_balance).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                  <span>Terms: {e.payment_terms_days} Days Credit</span>
                  <span>Credit Limit: ₹{(Number(e.credit_limit) / 100000).toFixed(1)}L</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Onboard Counterparty Modal */}
      {createModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-container max-w-2xl animate-fade-in"
          >
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Onboard Trading Counterparty</h3>
                  <p className="text-[11px] text-muted-foreground">Register customer account, steel rolling mill, or fabrication subcontractor</p>
                </div>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)} 
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Legal Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Larsen Heavy Engineering Ltd"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Entity Classification
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as EntityType)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="CLIENT">Client / OEM Buyer</option>
                    <option value="SUPPLIER">Steel Rolling Mill / Raw Stockist</option>
                    <option value="FABRICATOR_PARTNER">Fabrication Subcontractor</option>
                    <option value="DISTRIBUTOR">Distributor / Stockist</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Contact Person <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rajesh V."
                    value={primaryContact}
                    onChange={(e) => setPrimaryContact(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98200..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="orders@partner.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Tax ID / GSTIN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="27AAACA..."
                    value={taxIdentifier}
                    onChange={(e) => setTaxIdentifier(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="2000000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Billing Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Plot 44, MIDC Industrial Area"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Pune"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Postal Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="410501"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted/60 border border-input rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-muted text-foreground border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-md shadow-primary/25 transition-all active:scale-95"
                >
                  Onboard Counterparty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counterparty Inspection Slide-over Drawer */}
      {selectedEntity && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            onClick={() => setSelectedEntity(null)}
            className="slideover-backdrop"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-full sm:max-w-md slideover-panel flex flex-col relative z-50 animate-slide-in">
              {/* Drawer Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-mono font-bold">
                    {selectedEntity.entity_code.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground truncate max-w-[240px]">{selectedEntity.legal_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{selectedEntity.entity_code}</span>
                      {getTypeBadge(selectedEntity.entity_type)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEntity(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                {/* Financial Ledger Exposure */}
                <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-muted-foreground font-bold">Outstanding Balance</span>
                    <span className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400">
                      ₹{Number(selectedEntity.outstanding_balance).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Approved Credit Limit:</span>
                    <span className="font-mono text-foreground font-bold">₹{Number(selectedEntity.credit_limit).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Payment Term Cycle:</span>
                    <span className="font-mono text-foreground font-bold">{selectedEntity.payment_terms_days} Calendar Days</span>
                  </div>
                </div>

                {/* Primary Contacts Card */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Commercial Representative</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="text-foreground font-bold">{selectedEntity.primary_contact}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-muted-foreground">Direct Line:</span>
                      <a href={`tel:${selectedEntity.phone}`} className="text-primary hover:underline">{selectedEntity.phone}</a>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-muted-foreground">Email:</span>
                      <a href={`mailto:${selectedEntity.email}`} className="text-primary hover:underline">{selectedEntity.email}</a>
                    </div>
                    {selectedEntity.whatsapp && (
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-muted-foreground">WhatsApp:</span>
                        <a 
                          href={`https://wa.me/${selectedEntity.whatsapp.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{selectedEntity.whatsapp}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statutory & Taxation */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Statutory Identifiers</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-muted-foreground">GSTIN / Tax ID:</span>
                      <span className="text-foreground font-bold px-2 py-0.5 rounded bg-muted/60 border border-border">{selectedEntity.tax_identifier}</span>
                    </div>
                    {selectedEntity.pan_number && (
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-muted-foreground">Income Tax PAN:</span>
                        <span className="text-foreground font-bold">{selectedEntity.pan_number}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border/60">
                      <span className="text-muted-foreground block text-[11px]">Billing Address:</span>
                      <p className="text-foreground text-xs mt-0.5">{selectedEntity.billing_address}</p>
                      <p className="text-muted-foreground text-xs font-mono">{selectedEntity.city}, {selectedEntity.state} - {selectedEntity.postal_code}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border flex justify-end bg-muted/30">
                <button
                  type="button"
                  onClick={() => setSelectedEntity(null)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-semibold border border-border transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
