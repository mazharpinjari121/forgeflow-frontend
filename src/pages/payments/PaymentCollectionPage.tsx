import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { Plus, Search, Calendar, Landmark, FileText, CheckCircle, Clock, X, Printer, Share2, DollarSign, SlidersHorizontal, FilterX, User, Loader2, AlertCircle } from "lucide-react";

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  partyId: string;
  amountReceived: number;
  paymentMode: string;
  referenceNumber: string;
  remarks: string;
  receivedBy: string;
  createdAt: string;
  contactPerson?: string;
}
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, Loader, FilterDrawer } from "@/components/common";
import { SearchInput } from "@/components/ui/search-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { formatDate, numberToWordsINR } from "@/lib/utils";
import { partyService, paymentService } from "@/services";
import { PaymentReceiptPrintDocument } from "@/components/ui/print-templates";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function PaymentCollectionPage() {
  const { user } = useAuth();
  const location = useLocation();

  // Parse initial partyFilter from query params or route state
  const queryParams = new URLSearchParams(location.search);
  const initialPartyFilter = (location.state?.partyId || queryParams.get("partyId") || "all").toString();

  const [searchTerm, setSearchTerm] = useState("");
  const [partyFilter, setPartyFilter] = useState(initialPartyFilter);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // API states
  const [apiParties, setApiParties] = useState<any[]>([]);
  const [apiPayments, setApiPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [partySummary, setPartySummary] = useState<any | null>(null);
  const [filterPartySummary, setFilterPartySummary] = useState<any | null>(null);
  const [fetchingReceiptId, setFetchingReceiptId] = useState<string | null>(null);

  // Modal and collection states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partyId, setPartyId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amountReceived, setAmountReceived] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentReceipt["paymentMode"]>("Bank Transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [viewingReceipt, setViewingReceipt] = useState<PaymentReceipt | null>(null);

  // Fetch callbacks
  const fetchParties = async () => {
    try {
      const response = await partyService.getAllParties();
      if (response.data.responseStatus === "Success" && response.data.data) {
        const mapped = response.data.data.map((p: any) => ({
          ...p,
          id: p.partyId.toString(),
          name: p.partyName,
          city: p.city || "",
          state: p.state || "",
          status: p.isActive ? "Active" : "Inactive",
        }));
        setApiParties(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch parties:", err);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (partyFilter !== "all") {
        filters.PartyId = parseInt(partyFilter);
      }
      if (startDate) {
        filters.FromDate = new Date(startDate + "T00:00:00").toISOString();
      }
      if (endDate) {
        filters.ToDate = new Date(endDate + "T23:59:59").toISOString();
      }
      const response = await paymentService.getAllPaymentCollections(filters);
      if (response.data.responseStatus === "Success" && response.data.data) {
        setApiPayments(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync state if navigation changes
  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const paramPartyId = location.state?.partyId || qParams.get("partyId");
    if (paramPartyId) {
      setPartyFilter(paramPartyId.toString());
    }
  }, [location]);

  // Load parties on mount
  useEffect(() => {
    fetchParties();
  }, []);

  // Reload payments when filters change
  useEffect(() => {
    fetchPayments();
  }, [partyFilter, startDate, endDate]);

  const fetchFilterSummary = async () => {
    if (partyFilter === "all") {
      setFilterPartySummary(null);
      return;
    }
    try {
      const response = await partyService.getPartySummary(parseInt(partyFilter));
      if (response.data.responseStatus === "Success" && response.data.data) {
        setFilterPartySummary(response.data.data);
      } else {
        setFilterPartySummary(null);
      }
    } catch (err) {
      console.error("Failed to fetch filter party summary:", err);
      setFilterPartySummary(null);
    }
  };

  // Fetch filter party summary
  useEffect(() => {
    fetchFilterSummary();
  }, [partyFilter]);

  // Fetch modal party summary when partyId selection changes
  useEffect(() => {
    const fetchSummary = async () => {
      if (!partyId) {
        setPartySummary(null);
        return;
      }
      try {
        const response = await partyService.getPartySummary(parseInt(partyId));
        if (response.data.responseStatus === "Success" && response.data.data) {
          setPartySummary(response.data.data);
        } else {
          setPartySummary(null);
        }
      } catch (err) {
        console.error("Failed to fetch party summary:", err);
        setPartySummary(null);
      }
    };
    fetchSummary();
  }, [partyId]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setPartyFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    partyFilter !== "all" ||
    startDate !== "" ||
    endDate !== "";

  const activeFiltersCount = [
    partyFilter !== "all",
    startDate !== "" || endDate !== ""
  ].filter(Boolean).length;



  const handleOpenAdd = () => {
    setPartyId("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setAmountReceived("");
    setPaymentMode("Bank Transfer");
    setReferenceNumber("");
    setRemarks("");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) return setError("Party selection is required");
    if (!amountReceived || parseFloat(amountReceived) <= 0) return setError("Valid amount received is required");
    setSubmitting(true);
    setError("");

    const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;

    try {
      const payload = {
        paymentCollectionId: 0,
        partyId: parseInt(partyId),
        collectionDate: new Date(paymentDate + "T12:00:00").toISOString(),
        paymentMode,
        amountReceived: parseFloat(amountReceived),
        reference: referenceNumber.trim(),
        remark: remarks.trim(),
        userId: userIdNum,
      };

      const response = await paymentService.savePaymentCollection(payload);
      if (response.data.responseStatus === "Success") {
        toast.success("Payment collection recorded successfully and posted to ledger.");
        setIsModalOpen(false);
        fetchPayments();
        fetchFilterSummary();
      } else {
        setError(response.data.message || "Failed to record payment collection");
      }
    } catch (err: any) {
      setError(err.message || "Failed to record payment collection");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReceipt = async (receiptId: string) => {
    setFetchingReceiptId(receiptId);
    try {
      const response = await paymentService.getPaymentCollectionById(parseInt(receiptId));
      if (response.data.responseStatus === "Success" && response.data.data) {
        const rc = response.data.data;
        const mapped: PaymentReceipt = {
          id: rc.paymentCollectionId.toString(),
          receiptNumber: `RCP-${rc.paymentCollectionId}`,
          partyId: rc.partyId.toString(),
          paymentDate: rc.collectionDate ? rc.collectionDate.split("T")[0] : "",
          amountReceived: rc.amountReceived,
          paymentMode: rc.paymentMode,
          referenceNumber: rc.reference,
          remarks: rc.remark || "",
          receivedBy: rc.partyName || "",
          createdAt: rc.createdOn || "",
          contactPerson: rc.contactPerson || "",
        };
        setViewingReceipt(mapped);
      } else {
        toast.error(response.data.message || "Failed to fetch receipt details");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch receipt details");
    } finally {
      setFetchingReceiptId(null);
    }
  };

  const handlePrintMock = () => {
    if (!viewingReceipt) {
      window.print();
      return;
    }
    const originalTitle = document.title;
    document.title = `Payment_Receipt_${viewingReceipt.receiptNumber || viewingReceipt.id}`;
    window.print();
    document.title = originalTitle;
  };

  const handleWhatsAppShareMock = (rc: PaymentReceipt) => {
    const party = apiParties.find(p => p.id === rc.partyId);
    toast.success(`Mock PDF receipt link generated and sent to ${party?.name} via WhatsApp!`);
  };

  const filteredPayments: PaymentReceipt[] = apiPayments.map((p: any) => ({
    id: p.paymentCollectionId.toString(),
    receiptNumber: `RCP-${p.paymentCollectionId}`,
    partyId: p.partyId.toString(),
    paymentDate: p.collectionDate ? p.collectionDate.split("T")[0] : "",
    amountReceived: p.amountReceived,
    paymentMode: p.paymentMode,
    referenceNumber: p.reference,
    receivedBy: p.partyName || "Staff",
    remarks: p.remark || "",
    createdAt: p.createdOn || "",
    contactPerson: p.contactPerson || "",
  })).filter((p) => {
    const party = apiParties.find((pa) => pa.id === p.partyId);
    const matchesSearch =
      !searchTerm ||
      party?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paymentMode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.remarks.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesParty = partyFilter === "all" || p.partyId === partyFilter;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && p.paymentDate >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && p.paymentDate <= endDate;
    }

    return matchesSearch && matchesParty && matchesDate;
  });

  const partyError = error.toLowerCase().includes("party") ? error : "";
  const amountError = error.toLowerCase().includes("amount") ? error : "";
  const refError = (error.toLowerCase().includes("reference") || error.toLowerCase().includes("ref") || error.toLowerCase().includes("txn")) ? error : "";
  const generalError = error && !partyError && !amountError && !refError ? error : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Collection"
        description="Collect party payments against invoices, update outstanding balances, and print receipt slips."
        entriesCount={filteredPayments.length}
        entriesLabel="Receipts"
      />

      {/* Unified Search, Filters & Action Button */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-2 flex-grow">
          <div className="flex-grow max-w-full lg:max-w-md">
            <SearchInput
              placeholder="Search by party name..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full font-semibold"
            />
          </div>

          {/* Mobile Filter Trigger Button (hidden on desktop lg) */}
          <Button
            onClick={() => setIsFilterDrawerOpen(true)}
            type="button"
            variant="secondary"
            className={`lg:hidden h-9 px-3 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition-all shrink-0 relative ${activeFiltersCount > 0
              ? "border-blue-500/50 bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
              : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-bold text-white leading-none">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Mobile Add Receipt Button (hidden on desktop lg) */}
          {user?.role !== "Staff" && (
            <Button
              onClick={handleOpenAdd}
              className="lg:hidden flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm shadow-primary/20 shrink-0"
              title="Collect Payment Receipt"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          {/* Quick Filters for Desktop (lg and up) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-40">
              <SearchableSelect
                value={partyFilter}
                onChange={setPartyFilter}
                options={[
                  { value: "all", label: "All Parties" },
                  ...apiParties.map((p) => ({ value: p.id, label: p.name })),
                ]}
                placeholder="Filter by Party..."
                className="w-full text-xs font-semibold"
              />
            </div>
          </div>

          {/* Clear Filters Button (Mobile & Desktop) */}
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              type="button"
              variant="ghost"
              className="h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              title="Clear all active filters"
            >
              <FilterX className="h-4 w-4" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          )}
        </div>

        {/* Desktop Filter Drawer Trigger & Add Button (hidden on mobile, visible on lg) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setIsFilterDrawerOpen(true)}
            type="button"
            variant="secondary"
            className={`flex items-center gap-1.5 h-9 px-3.5 relative ${activeFiltersCount > 0
              ? "border-blue-500/50 bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
              : ""
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white leading-none">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {user?.role !== "Staff" && (
            <Button onClick={handleOpenAdd} className="flex items-center justify-center gap-1.5 h-9">
              <Plus className="h-4 w-4" />
              <span>Collect Payment Receipt</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1 animate-fade-in text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1.5">
              Active Filters:
            </span>

            {partyFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-755 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
                <span>Party: {apiParties.find(p => p.id === partyFilter)?.name}</span>
                <button onClick={() => setPartyFilter("all")} className="hover:text-blue-955 dark:hover:text-blue-200 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-755 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
                <span>Date: {startDate ? startDate : "—"} to {endDate ? endDate : "—"}</span>
                <button onClick={() => { setStartDate(""); setEndDate(""); }} className="hover:text-blue-955 dark:hover:text-blue-200 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearFilters}
              className="text-[10px] text-red-500 hover:text-red-750 hover:underline font-bold transition-all ml-1.5"
            >
              Clear All
            </button>
          </div>

          {partyFilter !== "all" && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-95/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-lg h-8 animate-fade-in shrink-0 font-semibold">
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-85">Outstanding Balance:</span>
              <span className="font-extrabold text-[11px] font-mono text-amber-600 dark:text-amber-400">₹{(filterPartySummary ? filterPartySummary.outstandingBalance : 0).toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>
      )}

      {/* Right sliding Filter Drawer Sidebar */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Receipts"
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      >
        {/* Party Filter Selector (Mobile only) */}
        <div className="space-y-1.5 block lg:hidden">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>Filter by Party</span>
          </label>
          <SearchableSelect
            value={partyFilter}
            onChange={setPartyFilter}
            options={[
              { value: "all", label: "All Parties" },
              ...apiParties.map((p) => ({ value: p.id, label: p.name })),
            ]}
            placeholder="Filter by Party..."
            className="w-full text-xs font-semibold"
          />
        </div>

        {/* Date Filter Range */}
        <div className="space-y-3">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Payment Date Range</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 font-semibold"
            />
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 font-semibold"
            />
          </div>
        </div>
      </FilterDrawer>

      {/* Payments Receipts Table */}
      <DataTable
        loading={loading}
        loadingText="Loading payment receipts..."
        headers={[
          "#",
          "Payment Date",
          "Party",
          "Amount Collected",
          "Payment Mode",
          "Reference / Txn ID",
          "Actions",
        ]}
        headerClassNames={["", "", "", "", "", "", "text-right"]}
        emptyMessage="No payment collections recorded."
      >
        {[...filteredPayments].sort((a, b) => parseInt(b.id) - parseInt(a.id)).map((rc) => {
          const customer = apiParties.find((pa) => pa.id === rc.partyId);
          const isFetching = fetchingReceiptId === rc.id;
          return (
            <tr key={rc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{rc.receiptNumber}</td>
              <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDate(rc.paymentDate)}</td>
              <td className="p-3.5 whitespace-nowrap">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">{customer?.name || rc.receivedBy}</span>
                {rc.contactPerson && (
                  <span className="text-[10px] text-slate-450 block mt-0.5 font-normal">
                    {rc.contactPerson}
                  </span>
                )}
              </td>
              <td className="p-3.5 font-extrabold text-emerald-600 whitespace-nowrap">
                ₹{rc.amountReceived.toLocaleString("en-IN")}
              </td>
              <td className="p-3.5 text-slate-500 whitespace-nowrap">
                {rc.paymentMode}
              </td>
              <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">{rc.referenceNumber}</td>
              <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                <button
                  disabled={isFetching}
                  onClick={() => handleViewReceipt(rc.id)}
                  className="p-1 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors inline-flex items-center gap-0.5 disabled:opacity-50"
                  title="Print Receipt slip"
                >
                  {isFetching ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Printer className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[10px] font-semibold">Print</span>
                </button>
                <button
                  onClick={() => handleWhatsAppShareMock(rc)}
                  className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                  title="Share via WhatsApp"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#25D366" d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24z" />
                    <path fill="white" d="M15.782 13.002c-.229-.115-1.353-.667-1.561-.742-.208-.075-.359-.112-.51.115-.15.227-.584.74-.716.89-.13.152-.262.17-.491.056-.23-.114-.969-.357-1.846-1.14-.683-.609-1.144-1.36-1.278-1.587-.133-.227-.013-.35.101-.463.103-.102.228-.266.343-.399.114-.132.15-.227.228-.378.077-.152.039-.285-.02-.399-.058-.114-.51-1.229-.699-1.684-.183-.442-.369-.381-.51-.388-.13-.007-.28-.008-.43-.008-.15 0-.395.056-.602.28-.208.227-.792.775-.792 1.89s.81 2.19.923 2.34c.113.15 1.59 2.429 3.853 3.407.538.232.958.371 1.286.475.54.171 1.03.147 1.418.089.432-.064 1.353-.553 1.542-1.087.19-.533.19-.99.133-1.087-.058-.097-.208-.152-.437-.267z" />
                  </svg>
                </button>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {/* Record Payment Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Collect Payment Receipt
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {generalError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded bg-red-50 dark:bg-red-900/20 text-red-655 dark:text-red-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className={`font-semibold ${partyError ? "text-red-500 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
                    Party *
                  </label>
                  <SearchableSelect
                    value={partyId}
                    onChange={(val) => {
                      setPartyId(val);
                      setError("");
                    }}
                    options={apiParties.filter(p => p.status === "Active").map((p) => ({
                      value: p.id,
                      label: `${p.name} (${p.city}, ${p.state})`
                    }))}
                    placeholder="Search and select party..."
                    className="w-full text-xs font-semibold"
                    hasError={!!partyError}
                  />
                  {partyError && (
                    <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{partyError}</p>
                  )}
                </div>

                <Input
                  type="date"
                  label="Collection Date *"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />

                <Input
                  type="number"
                  label="Amount Received (₹) *"
                  placeholder="e.g. 50000"
                  value={amountReceived}
                  onChange={(e) => {
                    setAmountReceived(e.target.value);
                    setError("");
                  }}
                  error={amountError}
                />
              </div>

              {/* Outstanding Indicators SOW requirements */}
              {partyId && (
                <div className="grid grid-cols-3 gap-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/40 p-3 rounded-lg">
                  <div>
                    <span className="text-[9px] text-blue-700 dark:text-blue-500 font-bold block uppercase">Total Outstanding</span>
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      ₹{(partySummary ? partySummary.outstandingBalance : 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-blue-700 dark:text-blue-500 font-bold block uppercase">Last Paid Amt</span>
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      ₹{(partySummary ? partySummary.lastPaymentAmount : 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-blue-700 dark:text-blue-500 font-bold block uppercase">Last Paid Date</span>
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                      {partySummary && partySummary.lastPaymentDate ? formatDate(partySummary.lastPaymentDate.split("T")[0]) : "No history"}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Payment Mode *"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  options={[
                    { value: "Bank Transfer", label: "Bank Transfer (IMPS/NEFT)" },
                    { value: "UPI", label: "UPI (GPay/PhonePe)" },
                    { value: "Cash", label: "Cash payment" },
                    { value: "Cheque", label: "Cheque clearance" }
                  ]}
                />

                <Input
                  type="text"
                  label="Reference / Txn ID"
                  placeholder="Ref number or check no..."
                  value={referenceNumber}
                  onChange={(e) => {
                    setReferenceNumber(e.target.value);
                    setError("");
                  }}
                  error={refError}
                />
              </div>

              <Textarea
                label="Remarks / Ledger Notes"
                placeholder="e.g. Cleared invoice ORD-002 dues. Regular buyer discount applied..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[60px]"
                rows={2}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting} className="flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  <span>Post Collection Receipt</span>
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Reusable Printable Receipt Slip Modal overlay */}
      {viewingReceipt && (
        <PaymentReceiptPrintDocument
          receipt={viewingReceipt}
          customer={apiParties.find(p => p.id === viewingReceipt.partyId)}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </div>
  );
}
