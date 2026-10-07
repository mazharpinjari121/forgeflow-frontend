import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, SlidersHorizontal, FilterX, ExternalLink, User, TrendingUp, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, FilterDrawer, Loader } from "@/components/common";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataTable } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { partyService, paymentService } from "@/services";
import { ExportButtons } from "@/components/ui/export-buttons";

export default function PartyPaymentsReportPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Role Access Guard
  if (currentUser?.role === "Staff") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The Party Payments report is restricted to **Administrator** and **Manager** accounts only. Staff members do not have viewing permissions.
        </p>
      </div>
    );
  }

  // Filters State
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // API States
  const [parties, setParties] = useState<any[]>([]);
  const [partySummary, setPartySummary] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const handleClearFilters = () => {
    setSelectedPartyId("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = selectedPartyId !== "" || startDate !== "" || endDate !== "";

  const activeFiltersCount = [
    selectedPartyId !== "",
    startDate !== "" || endDate !== ""
  ].filter(Boolean).length;

  // Load parties on mount
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const response = await partyService.getAllParties();
        if (response.data.responseStatus === "Success" && response.data.data) {
          const mapped = response.data.data.map((p: any) => ({
            id: p.partyId.toString(),
            name: p.partyName,
          }));
          setParties(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch parties:", err);
      }
    };
    fetchParties();
  }, []);

  // Fetch summary and payments when selected party changes
  useEffect(() => {
    if (!selectedPartyId) {
      setPartySummary(null);
      setPayments([]);
      return;
    }

    const fetchPartySummaryAndPayments = async () => {
      setLoadingSummary(true);
      setLoadingPayments(true);
      try {
        const summaryResponse = await partyService.getPartySummary(parseInt(selectedPartyId));
        if (summaryResponse.data.responseStatus === "Success" && summaryResponse.data.data) {
          setPartySummary(summaryResponse.data.data);
        }

        const paymentsResponse = await paymentService.getAllPaymentCollections({ PartyId: parseInt(selectedPartyId) });
        if (paymentsResponse.data.responseStatus === "Success" && paymentsResponse.data.data) {
          const mappedPayments = paymentsResponse.data.data.map((p: any) => ({
            receiptNo: `RCP-${p.paymentCollectionId}`,
            date: p.collectionDate ? p.collectionDate.split("T")[0] : "",
            partyName: p.partyName || "",
            amountCollected: p.amountReceived || 0,
            mode: p.paymentMode || "",
            reference: p.reference || "",
          }));
          setPayments(mappedPayments);
        }
      } catch (err) {
        console.error("Failed to load party payments report:", err);
      } finally {
        setLoadingSummary(false);
        setLoadingPayments(false);
      }
    };

    fetchPartySummaryAndPayments();
  }, [selectedPartyId]);

  // Client-side Filter Logic for Date Ranges
  const getFilteredPayments = () => {
    if (!selectedPartyId) return [];
    return payments.filter((row) => {
      const matchDate = (!startDate || row.date >= startDate) && (!endDate || row.date <= endDate);
      return matchDate;
    });
  };

  const filteredPayments = getFilteredPayments();

  // Export Config Mapping
  const csvHeaders = "Payment Rec Number,Payment Date,Amount Collected,Payment Mode,Reference";
  const csvRows = filteredPayments.map((row) => [
    row.receiptNo || "",
    row.date || "",
    row.amountCollected || 0,
    row.mode || "",
    row.reference || "",
  ]);

  const tableHeaders = ["Payment Rec Number", "Payment Date", "Amount Collected", "Payment Mode", "Reference Transaction"];
  const tableRows = filteredPayments.map((row) => [
    row.receiptNo || "",
    row.date ? formatDate(row.date) : "N/A",
    `₹${(row.amountCollected || 0).toLocaleString("en-IN")}`,
    row.mode || "",
    row.reference || "N/A",
  ]);

  const kpiItems = partySummary ? [
    { 
      label: "Last Payment", 
      value: partySummary.lastPaymentAmount 
        ? `₹${partySummary.lastPaymentAmount.toLocaleString("en-IN")} (${formatDate(partySummary.lastPaymentDate)})` 
        : "₹0" 
    },
    { 
      label: "Total Outstanding", 
      value: `₹${(partySummary.outstandingBalance || 0).toLocaleString("en-IN")}` 
    }
  ] : [];

  const partyDetails = partySummary 
    ? `Customer Name: ${partySummary.partyName} | Contact: ${partySummary.contactPerson} (${partySummary.primaryMobile}) | Location: ${partySummary.city}, ${partySummary.state}`
    : "No Customer Selected";

  return (
    <div className="space-y-6 text-xs animate-fade-in">
      <PageHeader
        title="Party Payments Report"
        description="Monitor collection clearances, receipt vouchers, and payment transaction details per customer account."
        entriesCount={selectedPartyId ? filteredPayments.length : undefined}
        entriesLabel="Receipts"
      />

      {/* Filter and Actions Bar */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 print:hidden">
        {/* Left Side: Filters */}
        <div className="flex items-center gap-2 flex-grow max-w-2xl min-w-0">
          {/* Party Dropdown Filter */}
          <div className="flex-grow max-w-md min-w-0">
            <SearchableSelect
              value={selectedPartyId}
              onChange={setSelectedPartyId}
              options={[
                { value: "", label: "Select Party..." },
                ...parties.map((p) => ({ value: p.id, label: p.name }))
              ]}
              placeholder="Search party..."
              className="w-full text-xs font-semibold bg-white dark:bg-slate-900"
            />
          </div>

          {/* Date range filters for Desktop */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <span className="font-bold text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base h-9 px-2 text-slate-700"
            />
            <span className="font-bold text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base h-9 px-2 text-slate-700"
            />
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Filter Trigger Button (hidden on desktop lg) */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            type="button"
            className={`lg:hidden h-9 px-3 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${activeFiltersCount > 0
              ? "border-blue-500/50 bg-blue-50/50 text-blue-700 dark:bg-blue-955/20"
              : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-bold text-white leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              type="button"
              className="h-9 px-2 text-red-655 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
            >
              <FilterX className="h-4 w-4" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}

          {/* Reusable Export Buttons (handles PDF & CSV) */}
          <ExportButtons
            fileName="party_payments_report"
            reportTitle="Party Payments Report"
            csvHeaders={csvHeaders}
            csvRows={csvRows}
            tableHeaders={tableHeaders}
            tableRows={tableRows}
            kpis={kpiItems}
            selectedPartyDetails={partyDetails}
            disabled={loadingPayments || !selectedPartyId}
          />
        </div>
      </div>

      {/* Filter Drawer for Mobile */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Payments"
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-750">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base w-full h-9 px-2.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-750">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base w-full h-9 px-2.5"
            />
          </div>
        </div>
      </FilterDrawer>

      {selectedPartyId ? (
        loadingSummary || loadingPayments ? (
          <Loader fullScreen={false} className="py-12" text="Loading payments report..." />
        ) : partySummary ? (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              {/* Card 1: Party Details */}
              <div
                onClick={() => navigate(`/masters/parties/${partySummary.partyId}`)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-3 cursor-pointer hover:border-blue-500/50 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
              >
                <div className="absolute top-1.5 right-3 text-[8px] font-bold text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  <span>View Profile</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </div>
                <div className="h-9 w-9 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Party Details</span>
                  <span className="font-extrabold text-sm block truncate text-slate-850 dark:text-slate-100 mt-0.5">
                    {partySummary.partyName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    Contact: {partySummary.contactPerson} ({partySummary.primaryMobile}) | {partySummary.city}, {partySummary.state}
                  </span>
                </div>
              </div>

              {/* Card 2: Last Payment */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-3">
                <div className="h-9 w-9 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Last Payment</span>
                  <span className="font-extrabold text-base block text-emerald-600 mt-0.5">
                    {partySummary.lastPaymentAmount ? `₹${partySummary.lastPaymentAmount.toLocaleString("en-IN")}` : "₹0"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    Date: {partySummary.lastPaymentDate ? formatDate(partySummary.lastPaymentDate) : "N/A"}
                  </span>
                </div>
              </div>

              {/* Card 3: Outstanding */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-3">
                <div className="h-9 w-9 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center shrink-0">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Outstanding</span>
                  <span className="font-extrabold text-base block text-red-500 mt-0.5">₹{(partySummary.outstandingBalance || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Payments Data Grid */}
            <DataTable
              headers={["Payment Rec Number", "Payment Date", "Amount Collected (₹)", "Payment Mode", "Reference Transaction"]}
              headerClassNames={["", "", "text-right", "", ""]}
              emptyMessage="No payments matched selection filters."
            >
              {filteredPayments.map((row) => (
                <tr key={row.receiptNo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/60">
                  <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">{row.receiptNo}</td>
                  <td className="p-3.5 text-slate-500">{formatDate(row.date)}</td>
                  <td className="p-3.5 text-right font-extrabold text-emerald-600">₹{row.amountCollected.toLocaleString("en-IN")}</td>
                  <td className="p-3.5 font-bold">
                    <span className="inline-flex px-2 py-0.5 rounded text-[9.5px] bg-purple-50 text-purple-700 dark:bg-purple-955/20">
                      {row.mode}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-650">{row.reference}</td>
                </tr>
              ))}
            </DataTable>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center border border-dashed border-slate-200 rounded-lg bg-white dark:bg-slate-900">
            <ShieldAlert className="h-10 w-10 text-slate-300 mb-2" />
            <p className="font-bold text-xs text-slate-700 dark:text-slate-300">No Data Available</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Could not retrieve details for the selected party.</p>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center border border-dashed border-slate-200 rounded-lg bg-white dark:bg-slate-900">
          <ShieldAlert className="h-10 w-10 text-slate-300 mb-2" />
          <p className="font-bold text-xs text-slate-700 dark:text-slate-300">Select Party for Report</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Please search and select a customer party from the dropdown above to generate the payments report.</p>
        </div>
      )}
    </div>
  );
}
