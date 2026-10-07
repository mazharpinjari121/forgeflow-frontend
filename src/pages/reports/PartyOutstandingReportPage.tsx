import { useState, useEffect } from "react";
import { ShieldAlert, SlidersHorizontal, FilterX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, FilterDrawer, Loader } from "@/components/common";
import { SearchInput } from "@/components/ui/search-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataTable } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { partyService, reportService } from "@/services";
import { ExportButtons } from "@/components/ui/export-buttons";

export default function PartyOutstandingReportPage() {
  const { user: currentUser } = useAuth();

  // Role Access Guard
  if (currentUser?.role === "Staff") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The Party Outstanding report is restricted to **Administrator** and **Manager** accounts only. Staff members do not have viewing permissions.
        </p>
      </div>
    );
  }

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // API States
  const [parties, setParties] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedPartyId("all");
  };

  const hasActiveFilters = searchTerm !== "" || selectedPartyId !== "all";
  const activeFiltersCount = [selectedPartyId !== "all"].filter(Boolean).length;

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

  // Fetch report data when selectedPartyId changes
  useEffect(() => {
    const fetchBalances = async () => {
      setLoading(true);
      try {
        const partyIdParam = selectedPartyId === "all" ? undefined : parseInt(selectedPartyId);
        const response = await reportService.getPartyReport(partyIdParam);
        if (response.data.responseStatus === "Success" && response.data.data) {
          setBalances(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch balances report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBalances();
  }, [selectedPartyId]);

  // Filter Logic
  const getFilteredData = () => {
    return balances.filter((row) => {
      const matchSearch =
        (row.partyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  };

  const filteredData = getFilteredData();

  // Export Mappers
  const csvHeaders = "Party Name,City & State,Contact Person,Last Payment Date,Last Payment Amount,Outstanding Amount";
  const csvRows = filteredData.map((row) => [
    row.partyName || "",
    `${row.city || ""}, ${row.state || ""}`.trim(),
    row.contactPerson || "",
    row.lastPaymentDate ? row.lastPaymentDate.split("T")[0] : "N/A",
    row.lastPaymentAmount || 0,
    row.outstandingBalance || 0,
  ]);

  const tableHeaders = [
    "Party Name",
    "City & State",
    "Contact Person",
    "Last Payment Date",
    "Last Payment Amount",
    "Outstanding Amount",
  ];
  const tableRows = filteredData.map((row) => [
    row.partyName || "",
    `${row.city || ""}, ${row.state || ""}`.trim(),
    row.contactPerson || "N/A",
    row.lastPaymentDate ? formatDate(row.lastPaymentDate) : "N/A",
    `₹${(row.lastPaymentAmount || 0).toLocaleString("en-IN")}`,
    `₹${(row.outstandingBalance || 0).toLocaleString("en-IN")}`,
  ]);

  const selectedParty = parties.find(p => p.id === selectedPartyId);
  const partyDetails = selectedParty ? `Filtered by Party Name: ${selectedParty.name}` : "All Customer Accounts Included";

  return (
    <div className="space-y-6 text-xs animate-fade-in">
      <PageHeader
        title="Party Outstanding Report"
        description="Monitor customer accounts, invoiced amounts, collection summaries, and overall credit outstanding balances."
        entriesCount={filteredData.length}
        entriesLabel="Outstanding Accounts"
      />

      {/* Top Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 print:hidden">
        <div className="flex items-center gap-2 flex-grow">
          <div className="flex-grow max-w-full lg:max-w-md">
            <SearchInput
              placeholder="Search by Party or Contact..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full"
            />
          </div>

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

          {/* Quick Filters for Desktop (lg and up) */}
          <div className="hidden lg:flex items-center gap-3">
            <SearchableSelect
              value={selectedPartyId}
              onChange={setSelectedPartyId}
              options={[
                { value: "all", label: "All Parties" },
                ...parties.map((p) => ({ value: p.id, label: p.name }))
              ]}
              className="w-56 font-semibold"
            />
          </div>

          {/* Clear Filters Button (Mobile & Desktop) */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              type="button"
              className="h-9 px-2 text-red-655 hover:text-red-755 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              title="Clear all active filters"
            >
              <FilterX className="h-4 w-4" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>

        {/* Reusable Export Buttons (handles both PDF & CSV) */}
        <ExportButtons
          fileName="party_outstanding_report"
          reportTitle="Party Outstanding Report"
          csvHeaders={csvHeaders}
          csvRows={csvRows}
          tableHeaders={tableHeaders}
          tableRows={tableRows}
          selectedPartyDetails={partyDetails}
          disabled={loading}
        />
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Party Outstanding"
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Party Account</label>
            <SearchableSelect
              value={selectedPartyId}
              onChange={setSelectedPartyId}
              options={[
                { value: "all", label: "All Parties" },
                ...parties.map((p) => ({ value: p.id, label: p.name }))
              ]}
              className="w-full text-xs font-semibold"
            />
          </div>
        </div>
      </FilterDrawer>

      {/* Party Outstanding Grid Table */}
      <DataTable
        loading={loading}
        loadingText="Loading party outstanding ledger..."
        headers={[
          "Party Name",
          "City & State",
          "Contact Person",
          "Last Payment Date",
          "Last Payment Amount (₹)",
          "Outstanding Amount (₹)"
        ]}
        headerClassNames={[
          "",
          "",
          "",
          "text-center",
          "text-right",
          "text-right font-bold"
        ]}
        emptyMessage="No party outstanding ledger records matched filters."
      >
        {filteredData.map((row) => (
          <tr key={row.partyId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
            <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{row.partyName}</td>
            <td className="p-3.5 text-slate-500">{row.city || ""}, {row.state || ""}</td>
            <td className="p-3.5 text-slate-600">{row.contactPerson || "N/A"}</td>
            <td className="p-3.5 text-center text-slate-600">{row.lastPaymentDate ? formatDate(row.lastPaymentDate) : "N/A"}</td>
            <td className="p-3.5 text-right font-semibold text-emerald-600">₹{(row.lastPaymentAmount || 0).toLocaleString("en-IN")}</td>
            <td className="p-3.5 text-right font-black text-amber-600 dark:text-amber-400">₹{(row.outstandingBalance || 0).toLocaleString("en-IN")}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
