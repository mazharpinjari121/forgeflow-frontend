import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, ShieldAlert, SlidersHorizontal, FilterX, X, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, Loader, FilterDrawer } from "@/components/common";
import { SearchInput } from "@/components/ui/search-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PartyFormModal } from "./PartyFormModal";
import { partyService } from "@/services/party.service";
import type { PartyRecord } from "@/types/api.types";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";

export default function PartyMasterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Role Access Guard: SOW states Admin only has access to Party Master!
  if (user?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The Party Master module is restricted to **Administrator** accounts only. Managers and Staff do not have viewing or modification permissions.
        </p>
      </div>
    );
  }

  const [parties, setParties] = useState<PartyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyRecord | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    return [
      typeFilter !== "all",
      statusFilter !== "all"
    ].filter(Boolean).length;
  }, [typeFilter, statusFilter]);

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" || typeFilter !== "all" || statusFilter !== "all";
  }, [searchTerm, typeFilter, statusFilter]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
  }, []);

  const fetchParties = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = typeFilter === "all" ? undefined : typeFilter;
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const response = await partyService.getAllParties(typeParam, statusParam);
      if (response.data.responseStatus === "Success" && response.data.data) {
        setParties(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load parties");
      }
    } catch (error: any) {
      console.error("Error fetching parties:", error);
      toast.error("Failed to load parties. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    if (user?.role === "Admin") {
      fetchParties();
    }
  }, [fetchParties, user?.role]);

  const handleOpenAdd = () => {
    setEditingParty(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (party: PartyRecord) => {
    setEditingParty(party);
    setIsModalOpen(true);
  };

  const handleDelete = async (party: PartyRecord) => {
    Swal.fire({
      title: "Delete Party?",
      text: `Are you sure you want to delete "${party.partyName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "hsl(var(--destructive))",
      cancelButtonColor: "hsl(var(--muted-foreground))",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await partyService.deleteParty(party.partyId, 1);
          if (response.data.responseStatus === "Success") {
            toast.success("Party deleted successfully");
            fetchParties();
          } else {
            toast.error(response.data.message || "Failed to delete party");
          }
        } catch (error: any) {
          console.error("Error deleting party:", error);
          toast.error("Failed to delete party. Please try again.");
        }
      }
    });
  };


  const filteredParties = parties.filter((p) => {
    const matchesType = typeFilter === "all" || p.partyType === typeFilter;
    const isActiveStr = p.isActive ? "Active" : "Inactive";
    const matchesStatus = statusFilter === "all" || isActiveStr === statusFilter;

    const matchesSearch = !searchTerm ||
      p.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.primaryMobile?.includes(searchTerm);

    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-grow flex flex-col gap-4">
      <PageHeader
        title="Party Master"
        description="Manage retailers, wholesalers, direct customers, and access ledger accounts."
        entriesCount={filteredParties.length}
        entriesLabel="Parties"
      />

      {/* Filter and Actions Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-2 flex-grow">
          <div className="flex-grow max-w-full lg:max-w-md">
            <SearchInput
              placeholder="Search party, contact, city..."
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
          </button>

          {/* Mobile Add Party Button (hidden on desktop lg) */}
          <button
            onClick={handleOpenAdd}
            className="lg:hidden flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm shadow-primary/20 shrink-0 cursor-pointer active:scale-95"
            title="Add Party"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Quick Filters for Desktop (lg and up) */}
          <div className="hidden lg:flex items-center gap-3">
            <SearchableSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All Party Types" },
                { value: "Wholesaler", label: "Wholesalers" },
                { value: "Retailer", label: "Retailers" },
                { value: "Direct Customer", label: "Direct Parties" },
              ]}
              className="w-40 font-semibold"
            />
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              className="w-36 font-semibold"
            />
          </div>

          {/* Clear Filters Button (Mobile & Desktop) */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              type="button"
              className="h-9 px-2 text-red-655 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              title="Clear all active filters"
            >
              <FilterX className="h-4 w-4" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>

        {/* Add Party Button (hidden on mobile, visible on lg) */}
        <button
          onClick={handleOpenAdd}
          className="hidden lg:flex h-9 px-3 gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold transition-all shadow-sm shadow-primary/20 shrink-0 cursor-pointer active:scale-95 items-center justify-center"
          title="Add Party"
        >
          <Plus className="h-4 w-4" />
          <span>Add Party</span>
        </button>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs px-1 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1.5">
            Active Filters:
          </span>

          {typeFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-755 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>Type: {typeFilter}</span>
              <button onClick={() => setTypeFilter("all")} className="hover:text-blue-955 dark:hover:text-blue-200 transition-colors cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-755 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>Status: {statusFilter}</span>
              <button onClick={() => setStatusFilter("all")} className="hover:text-blue-955 dark:hover:text-blue-200 transition-colors cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearFilters}
            className="text-[10px] text-red-500 hover:text-red-750 hover:underline font-bold transition-all ml-1.5 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Right sliding Filter Drawer Sidebar */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Parties"
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      >
        {/* Type Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>Party Type</span>
          </label>
          <SearchableSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All Party Types" },
              { value: "Wholesaler", label: "Wholesalers" },
              { value: "Retailer", label: "Retailers" },
              { value: "Direct Customer", label: "Direct Parties" },
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>

        {/* Status Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
            <span>Status</span>
          </label>
          <SearchableSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>
      </FilterDrawer>

      {/* Party Table */}
      <DataTable
        loading={loading}
        loadingText="Loading parties..."
        headers={[
          "#",
          "Party Name",
          "Type",
          "Contact Person",
          "Primary Mobile",
          "WhatsApp Mobile",
          "City / State",
          "Status",
          "Actions",
        ]}
        headerClassNames={[
          "",
          "min-w-[200px]",
          "",
          "min-w-[150px]",
          "",
          "",
          "",
          "",
          "text-right",
        ]}
        emptyMessage="No parties found."
      >
        {filteredParties.map((p, index) => {
          return (
            <tr
              key={p.partyId}
              onClick={() => navigate(`/masters/parties/${p.partyId}`)}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
            >
              <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{p.partyId}</td>
              <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/masters/parties/${p.partyId}`);
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline text-left cursor-pointer"
                >
                  {p.partyName}
                </button>
              </td>
              <td className="p-3.5 text-slate-500 whitespace-nowrap">{p.partyType || "—"}</td>
              <td className="p-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {p.contactPerson}
              </td>
              <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono">
                {p.primaryMobile}
              </td>
              <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono">
                {p.whatsAppMobile || "—"}
              </td>
              <td className="p-3.5 text-slate-500 whitespace-nowrap">
                {p.city}, {p.state}
              </td>
              <td className="p-3.5 whitespace-nowrap">
                <Badge variant={p.isActive ? "success" : "danger"}>
                  {p.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="p-1 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {/* Add/Edit Modal */}
      <PartyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingParty={editingParty}
        onSuccess={() => fetchParties()}
      />
    </div>
  );
}
