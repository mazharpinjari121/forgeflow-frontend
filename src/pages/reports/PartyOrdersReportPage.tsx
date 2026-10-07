import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, SlidersHorizontal, FilterX, ExternalLink, User, CreditCard, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, FilterDrawer, Loader } from "@/components/common";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataTable } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { partyService, orderService, productService } from "@/services";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "@/components/ui/export-buttons";

export default function PartyOrdersReportPage() {
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
          The Party Orders report is restricted to **Administrator** and **Manager** accounts only. Staff members do not have viewing permissions.
        </p>
      </div>
    );
  }

  // Filters State
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // API States
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [partySummary, setPartySummary] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const handleClearFilters = () => {
    setSelectedPartyId("");
    setOrderTypeFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = selectedPartyId !== "" || orderTypeFilter !== "all" || statusFilter !== "all" || startDate !== "" || endDate !== "";

  const activeFiltersCount = [
    orderTypeFilter !== "all",
    statusFilter !== "all",
    startDate !== "" || endDate !== ""
  ].filter(Boolean).length;

  // Load parties and products on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const partiesResponse = await partyService.getAllParties();
        if (partiesResponse.data.responseStatus === "Success" && partiesResponse.data.data) {
          const mapped = partiesResponse.data.data.map((p: any) => ({
            id: p.partyId.toString(),
            name: p.partyName,
          }));
          setParties(mapped);
        }

        const productsResponse = await productService.getAllProducts();
        if (productsResponse.data.responseStatus === "Success" && productsResponse.data.data) {
          const mappedProds = productsResponse.data.data.map((p: any) => ({
            ...p,
            id: p.productId.toString(),
          }));
          setProducts(mappedProds);
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch summary and orders when selected party changes
  useEffect(() => {
    if (!selectedPartyId) {
      setPartySummary(null);
      setOrders([]);
      return;
    }

    const fetchPartyDetailsAndOrders = async () => {
      setLoadingSummary(true);
      setLoadingOrders(true);
      try {
        const summaryResponse = await partyService.getPartySummary(parseInt(selectedPartyId));
        if (summaryResponse.data.responseStatus === "Success" && summaryResponse.data.data) {
          setPartySummary(summaryResponse.data.data);
        }

        const ordersResponse = await orderService.getAllOrders({ PartyId: parseInt(selectedPartyId) });
        if (ordersResponse.data.responseStatus === "Success" && ordersResponse.data.data) {
          const mappedOrders = ordersResponse.data.data.map((o: any) => {
            const items = (o.orderDetails || []).map((d: any) => ({
              id: d.orderDetailId.toString(),
              productId: d.productId.toString(),
              qtyOrdered: d.qty,
              qtyDelivered: d.deliveryQty !== undefined ? d.deliveryQty : (d.deliveredQty ?? 0),
              unitPrice: d.rate,
            }));

            let derivedStatus = o.status;
            if (o.status !== "Cancelled") {
              const allDelivered = items.length > 0 && items.every((item: any) => item.qtyDelivered >= item.qtyOrdered);
              if (allDelivered) {
                derivedStatus = "Delivered";
              } else {
                const someDelivered = items.some((item: any) => item.qtyDelivered > 0);
                derivedStatus = someDelivered ? "Partially Delivered" : "Confirmed";
              }
            }

            return {
              ...o,
              id: o.orderId.toString(),
              orderNumber: `ORD-${o.orderId}`,
              orderDate: o.orderDate ? o.orderDate.split("T")[0] : "",
              deliveryDate: o.expectedDeliveryDate ? o.expectedDeliveryDate.split("T")[0] : "",
              partyId: o.partyId.toString(),
              status: derivedStatus,
              notes: o.remark || "",
              items,
            };
          });
          setOrders(mappedOrders);
        }
      } catch (err) {
        console.error("Failed to load party orders report:", err);
      } finally {
        setLoadingSummary(false);
        setLoadingOrders(false);
      }
    };

    fetchPartyDetailsAndOrders();
  }, [selectedPartyId]);

  // Client-side Filter Logic
  const getFilteredOrders = () => {
    if (!selectedPartyId) return [];
    return orders.filter((row) => {
      const matchType = orderTypeFilter === "all" || row.orderType === orderTypeFilter;
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      const matchDate = (!startDate || row.orderDate >= startDate) && (!endDate || row.orderDate <= endDate);
      return matchType && matchStatus && matchDate;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Export Config Mapping
  const csvHeaders = "Order No,Order Type,Order Date,Amount,Status";
  const csvRows = filteredOrders.map((row) => {
    const amount = row.items.reduce((sum: number, i: any) => {
      const base = i.qtyOrdered * i.unitPrice;
      if (row.orderType === "Invoice") {
        const prod = products.find(p => p.id === i.productId);
        const cgst = prod?.cgst ?? 0;
        const sgst = prod?.sgst ?? 0;
        return sum + base + (base * (cgst + sgst) / 100);
      }
      return sum + base;
    }, 0);
    return [
      row.orderNumber || "",
      row.orderType || "",
      row.orderDate || "",
      amount,
      row.status || "",
    ];
  });

  const tableHeaders = ["Order No", "Order Type", "Order Date", "Amount", "Status"];
  const tableRows = filteredOrders.map((row) => {
    const amount = row.items.reduce((sum: number, i: any) => {
      const base = i.qtyOrdered * i.unitPrice;
      if (row.orderType === "Invoice") {
        const prod = products.find(p => p.id === i.productId);
        const cgst = prod?.cgst ?? 0;
        const sgst = prod?.sgst ?? 0;
        return sum + base + (base * (cgst + sgst) / 100);
      }
      return sum + base;
    }, 0);
    return [
      row.orderNumber || "",
      row.orderType || "",
      row.orderDate ? formatDate(row.orderDate) : "N/A",
      `₹${amount.toLocaleString("en-IN")}`,
      row.status || "",
    ];
  });

  const kpiItems = partySummary ? [
    { label: "Pending Orders", value: partySummary.activeBookings || 0 },
    { label: "Total Outstanding", value: `₹${(partySummary.outstandingBalance || 0).toLocaleString("en-IN")}` }
  ] : [];

  const partyDetails = partySummary
    ? `Customer Name: ${partySummary.partyName} | Contact: ${partySummary.contactPerson} (${partySummary.primaryMobile}) | Location: ${partySummary.city}, ${partySummary.state}`
    : "No Customer Selected";

  return (
    <div className="space-y-6 text-xs animate-fade-in">
      <PageHeader
        title="Party Orders Report"
        description="Audit sales booking logs, purchase histories, and invoice statuses per customer account."
        entriesCount={selectedPartyId ? filteredOrders.length : undefined}
        entriesLabel="Orders"
      />

      {/* Filter and Actions Bar */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 print:hidden">
        {/* Left Side: Filters */}
        <div className="flex items-center gap-2 flex-grow max-w-md min-w-0">
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

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Filters trigger button (always visible) */}
          <Button
            onClick={() => setIsFilterDrawerOpen(true)}
            type="button"
            variant="secondary"
            className={`h-9 px-3.5 relative ${activeFiltersCount > 0
                ? "border-blue-500/50 bg-blue-50/50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400"
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
            fileName="party_orders_report"
            reportTitle="Party Orders Report"
            csvHeaders={csvHeaders}
            csvRows={csvRows}
            tableHeaders={tableHeaders}
            tableRows={tableRows}
            kpis={kpiItems}
            selectedPartyDetails={partyDetails}
            disabled={loadingOrders || !selectedPartyId}
          />
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Orders"
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
          <div className="space-y-1.5">
            <label className="font-bold text-slate-750">Order Type</label>
            <SearchableSelect
              value={orderTypeFilter}
              onChange={setOrderTypeFilter}
              options={[
                { value: "all", label: "All Order Types" },
                { value: "Invoice", label: "Invoice" },
                { value: "Estimate", label: "Estimate" }
              ]}
              className="w-full text-xs font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-750">Status</label>
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "Confirmed", label: "Confirmed" },
                { value: "Partially Delivered", label: "Partially Delivered" },
                { value: "Delivered", label: "Delivered" },
                { value: "Cancelled", label: "Cancelled" }
              ]}
              className="w-full text-xs font-semibold"
            />
          </div>
        </div>
      </FilterDrawer>

      {selectedPartyId ? (
        loadingSummary || loadingOrders ? (
          <Loader fullScreen={false} className="py-12" text="Loading report data..." />
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

              {/* Card 2: Pending Orders Count */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-3">
                <div className="h-9 w-9 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Pending Orders</span>
                  <span className="font-extrabold text-base block text-slate-850 dark:text-slate-100 mt-0.5">{partySummary.activeBookings || 0}</span>
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

            {/* Orders Data Grid */}
            <DataTable
              headers={["Order No", "Order Type", "Order Date", "Amount (₹)", "Status"]}
              headerClassNames={["", "", "", "text-right", ""]}
              emptyMessage="No active customer orders matched selection filters."
            >
              {filteredOrders.map((row) => {
                const amount = row.items.reduce((sum: number, i: any) => {
                  const base = i.qtyOrdered * i.unitPrice;
                  if (row.orderType === "Invoice") {
                    const prod = products.find(p => p.id === i.productId);
                    const cgst = prod?.cgst ?? 0;
                    const sgst = prod?.sgst ?? 0;
                    return sum + base + (base * (cgst + sgst) / 100);
                  }
                  return sum + base;
                }, 0);

                return (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/orders/${row.id}`)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/60 cursor-pointer"
                  >
                    <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">{row.orderNumber}</td>
                    <td className="p-3.5 text-slate-600 font-semibold">{row.orderType}</td>
                    <td className="p-3.5 text-slate-500">{formatDate(row.orderDate)}</td>
                    <td className="p-3.5 text-right font-extrabold text-slate-800 dark:text-slate-200">₹{amount.toLocaleString("en-IN")}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9.5px] font-bold ${row.status === "Delivered"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                          : row.status === "Confirmed"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-955/20"
                            : row.status === "Cancelled"
                              ? "bg-red-50 text-red-700 dark:bg-red-955/20"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-955/20"
                        }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
          <p className="text-[10px] text-slate-500 mt-0.5">Please search and select a customer party from the dropdown above to generate the orders report.</p>
        </div>
      )}
    </div>
  );
}
