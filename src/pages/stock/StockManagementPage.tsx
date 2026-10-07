import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Trash2, Calendar, ShieldAlert, FileSpreadsheet, Package, AlertCircle, Info, History, X, SlidersHorizontal, FilterX, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loader, FilterDrawer } from "@/components/common";
import { SearchInput } from "@/components/ui/search-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { productService, categoryService, stockService } from "@/services";
import { DataTable } from "@/components/ui/table";

export default function StockManagementPage() {

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const handleClearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setProductFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProductSummary, setSelectedProductSummary] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === "Staff";

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAllCategories();
      if (response.data.responseStatus === "Success" && response.data.data) {
        const mapped = response.data.data.map((c: any) => ({
          ...c,
          id: c.categoryId.toString(),
          name: c.categoryName,
          status: c.isActive ? "Active" : "Inactive",
        }));
        setCategories(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const catId = categoryFilter !== "all" ? parseInt(categoryFilter) : undefined;
      const response = await productService.getAllProducts(catId);
      if (response.data.responseStatus === "Success" && response.data.data) {
        const mapped = response.data.data.map((p: any) => ({
          ...p,
          id: p.productId.toString(),
          name: p.productName,
          categoryId: p.categoryId ? p.categoryId.toString() : "",
          sku: p.sku || p.hsnCode || `SKU-PRD-${p.productId}`,
          status: p.status || (p.isActive ? "Active" : "Inactive"),
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }, [categoryFilter]);

  const fetchAllProductsForModal = useCallback(async () => {
    try {
      const response = await productService.getAllProducts();
      if (response.data.responseStatus === "Success" && response.data.data) {
        const mapped = response.data.data.map((p: any) => ({
          ...p,
          id: p.productId.toString(),
          name: p.productName,
          categoryId: p.categoryId ? p.categoryId.toString() : "",
          sku: p.sku || p.hsnCode || `SKU-PRD-${p.productId}`,
          status: p.status || (p.isActive ? "Active" : "Inactive"),
        }));
        setAllProducts(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch all products:", err);
    }
  }, []);

  const fetchStockEntries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await stockService.getAllStockProductions({
        categoryId: categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
        productId: productFilter !== "all" ? parseInt(productFilter) : undefined,
        fromDate: startDate || undefined,
        toDate: endDate || undefined,
      });
      if (response.data.responseStatus === "Success" && response.data.data) {
        const mapped = response.data.data.map((entry: any) => ({
          id: entry.productionId.toString(),
          entryNumber: `STK-${entry.productionId}`,
          productId: entry.productId.toString(),
          productName: entry.productName,
          categoryName: entry.categoryName,
          sku: entry.sku || entry.productSku,
          productionDate: entry.productionDate ? entry.productionDate.split("T")[0] : "",
          qtyProduced: entry.qty,
          remarks: entry.remark || "",
          status: entry.isActive ? "Active" : "Cancelled",
          createdAt: entry.productionDate,
        }));
        setStockEntries(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch stock entries:", err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, productFilter, startDate, endDate]);

  useEffect(() => {
    fetchCategories();
    fetchAllProductsForModal();
  }, [fetchCategories, fetchAllProductsForModal]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchStockEntries();
  }, [fetchStockEntries]);

  useEffect(() => {
    if (productFilter !== "all") {
      productService.getProductStockSummary(parseInt(productFilter))
        .then((res) => {
          if (res.data.responseStatus === "Success" && res.data.data) {
            setSelectedProductSummary(res.data.data);
          }
        })
        .catch((err) => console.error("Error fetching product stock summary:", err));
    } else {
      setSelectedProductSummary(null);
    }
  }, [productFilter]);

  // Filters State relocated above to avoid hoisting/TDZ errors

  const hasActiveFilters =
    searchTerm !== "" ||
    categoryFilter !== "all" ||
    productFilter !== "all" ||
    statusFilter !== "all" ||
    startDate !== "" ||
    endDate !== "";

  const activeFiltersCount = [
    categoryFilter !== "all",
    productFilter !== "all",
    statusFilter !== "all",
    startDate !== "" || endDate !== ""
  ].filter(Boolean).length;

  // Tooltip State for Remarks Column
  const [tooltipData, setTooltipData] = useState<{ id: string; text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!tooltipData) return;

    const handleClose = (e: Event) => {
      const target = e.target as HTMLElement;
      if (e.type === "click") {
        if (target && typeof target.closest === "function" && (target.closest(".remark-tooltip-trigger") || target.closest(".remark-tooltip-portal"))) {
          return;
        }
      } else if (e.type === "scroll") {
        if (target && typeof target.closest === "function" && target.closest(".remark-tooltip-portal")) {
          return;
        }
      }
      setTooltipData(null);
    };

    document.addEventListener("click", handleClose);
    window.addEventListener("scroll", handleClose, { capture: true });
    window.addEventListener("resize", handleClose);

    return () => {
      document.removeEventListener("click", handleClose);
      window.removeEventListener("scroll", handleClose, { capture: true });
      window.removeEventListener("resize", handleClose);
    };
  }, [tooltipData]);

  const handleRemarkClick = (e: React.MouseEvent<HTMLButtonElement>, entryId: string, remarksText: string) => {
    e.stopPropagation();
    if (tooltipData?.id === entryId) {
      setTooltipData(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      let x = rect.left + rect.width / 2;
      const tooltipWidth = 280;
      const halfWidth = tooltipWidth / 2;
      const padding = 16;
      if (x - halfWidth < padding) {
        x = halfWidth + padding;
      } else if (x + halfWidth > window.innerWidth - padding) {
        x = window.innerWidth - halfWidth - padding;
      }

      setTooltipData({
        id: entryId,
        text: remarksText,
        x,
        y: rect.top,
      });
    }
  };

  // Add Entry Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split("T")[0]);
  const [qtyProduced, setQtyProduced] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  // Role Access Guard: Stock Production is restricted to Admin only!
  if (user?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Stock Production management is restricted to **Administrator** accounts only.
        </p>
      </div>
    );
  }

  // Real-time stock calculator (Physical Stock on hand) removed mock data calculations

  const handleOpenAdd = () => {
    if (isStaff) {
      toast.error("Access Denied: Staff cannot add production entries");
      return;
    }
    setProductId("");
    setProductionDate(new Date().toISOString().split("T")[0]);
    setQtyProduced("");
    setRemarks("");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return setError("Product selection is required");
    if (!productionDate) return setError("Production Date is required");
    if (!qtyProduced || parseFloat(qtyProduced) <= 0) return setError("Quantity produced must be greater than zero");

    setSubmitting(true);
    setError("");
    const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;
    try {
      const response = await stockService.addStockProduction({
        productionId: 0,
        productId: parseInt(productId),
        productionDate: new Date(productionDate + "T12:00:00").toISOString(),
        qty: parseFloat(qtyProduced),
        remark: remarks.trim(),
        userId: userIdNum
      });

      if (response.data.responseStatus === "Success") {
        toast.success("Production batch entry added successfully");
        setIsModalOpen(false);
        fetchStockEntries();
        if (productFilter === productId) {
          const summaryRes = await productService.getProductStockSummary(parseInt(productId));
          if (summaryRes.data.responseStatus === "Success" && summaryRes.data.data) {
            setSelectedProductSummary(summaryRes.data.data);
          }
        }
      } else {
        setError(response.data.message || "Failed to add production entry");
      }
    } catch (err: any) {
      console.error("Error adding production entry:", err);
      setError(err?.response?.data?.message || "Failed to add production entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEntry = (entry: any) => {
    if (user?.role !== "Admin") {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "Only Administrator accounts can cancel production stock entries.",
        confirmButtonColor: "hsl(var(--accent))",
      });
      return;
    }

    Swal.fire({
      title: "Cancel Stock Entry?",
      text: `Are you sure you want to cancel production entry "${entry.entryNumber}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "hsl(var(--destructive))",
      cancelButtonColor: "hsl(var(--muted-foreground))",
      confirmButtonText: "Yes, Cancel Entry",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;
        try {
          const response = await stockService.deleteStockProduction(parseInt(entry.id), userIdNum);
          if (response.data.responseStatus === "Success") {
            toast.success("Production entry cancelled successfully");
            fetchStockEntries();
            if (productFilter !== "all") {
              const summaryRes = await productService.getProductStockSummary(parseInt(productFilter));
              if (summaryRes.data.responseStatus === "Success" && summaryRes.data.data) {
                setSelectedProductSummary(summaryRes.data.data);
              }
            }
          } else {
            toast.error(response.data.message || "Failed to cancel production entry");
          }
        } catch (err: any) {
          console.error("Error cancelling production entry:", err);
          toast.error(err?.response?.data?.message || "Failed to cancel production entry");
        }
      }
    });
  };

  // Mock export report
  const handleExport = () => {
    if (isStaff) {
      toast.error("Access Denied: Staff cannot export stock reports");
      return;
    }
    toast.success("Exporting Product Stock Report as Excel spreadsheet...");
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,Product,Category,Available Stock (Qty),Minimum Level (Qty)\n" +
        products.map(p => `"${p.name}",${p.categoryName || categories.find(c => c.id === p.categoryId)?.name || ""},${p.availableStock || 0},${p.minStockLevel || p.minimumStockAlert || 0}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SuperSteel_StockReport_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1000);
  };

  // Available Active Products
  const activeProducts = allProducts.filter((p) => p.status === "Active");

  // Filtered Production Batch Entries
  const filteredEntries = stockEntries.filter((entry) => {
    const prod = allProducts.find((p) => p.id === entry.productId) || products.find((p) => p.id === entry.productId);

    // Search match
    const matchesSearch =
      entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.categoryName && entry.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category match
    const matchesCategory =
      categoryFilter === "all" || prod?.categoryId === categoryFilter;

    // Product match
    const matchesProduct =
      productFilter === "all" || entry.productId === productFilter;

    // Status match
    const matchesStatus =
      statusFilter === "all" || entry.status === statusFilter;

    // Date range match
    const matchesStartDate = !startDate || entry.productionDate >= startDate;
    const matchesEndDate = !endDate || entry.productionDate <= endDate;

    return matchesSearch && matchesCategory && matchesProduct && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const productError = ((error.toLowerCase().includes("product") || error.toLowerCase().includes("prodid")) && !error.toLowerCase().includes("production")) ? error : "";
  const dateError = (error.toLowerCase().includes("date") || error.toLowerCase().includes("production")) ? error.replace(/ProductionDate/g, "Production date") : "";
  const qtyError = (error.toLowerCase().includes("quantity") || error.toLowerCase().includes("qty") || error.toLowerCase().includes("greater than zero")) ? error : "";
  const generalError = error && !productError && !dateError && !qtyError ? error.replace(/ProductionDate/g, "Production date") : "";

  if (loading && stockEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <Loader fullScreen={false} text="Loading production data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Production"
        description="Manage steel manufacturing batches, evaluate live inventory levels, and export audit trails."
        entriesCount={filteredEntries.length}
        entriesLabel="Batches"
      />

      {/* Unified Search, Filters & Actions Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-2 flex-grow">
          <div className="flex-grow max-w-full lg:max-w-md">
            <SearchInput
              placeholder="Search by Batch code, Product or Remarks..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full"
            />
          </div>

          {/* Mobile Filter Trigger Button (hidden on desktop lg) */}
          <Button
            onClick={() => setIsFilterDrawerOpen(true)}
            type="button"
            variant="secondary"
            className={`lg:hidden h-9 px-3 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${activeFiltersCount > 0
              ? "border-blue-500/50 bg-blue-50/50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400"
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

          {/* Mobile Add Production Batch Button (hidden on desktop lg) */}
          {!isStaff && (
            <Button
              onClick={handleOpenAdd}
              className="lg:hidden flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm shadow-primary/20 shrink-0 cursor-pointer active:scale-95"
              title="Add Production Batch"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          {/* Quick Filters on Large Screens */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-44">
              <SearchableSelect
                value={categoryFilter}
                onChange={(val) => {
                  setCategoryFilter(val);
                  setProductFilter("all");
                }}
                options={[
                  { value: "all", label: "All Categories" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                placeholder="All Categories"
                className="w-full text-xs font-semibold"
              />
            </div>
            <div className="w-56">
              <SearchableSelect
                value={productFilter}
                onChange={setProductFilter}
                options={[
                  { value: "all", label: "All Products" },
                  ...products
                    .filter((p) => categoryFilter === "all" || p.categoryId === categoryFilter)
                    .map((p) => ({ value: p.id, label: p.name })),
                ]}
                placeholder="All Products"
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
              className="h-9 px-2 text-red-656 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              title="Clear all active filters"
            >
              <FilterX className="h-4 w-4" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          )}
        </div>

        {/* Desktop Buttons (hidden on mobile, visible on lg) */}
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
          {!isStaff && (
            <Button onClick={handleOpenAdd} className="h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Add Production Batch</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Chips & Compact Live Inventory Badge */}
      {(hasActiveFilters || productFilter !== "all") && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 animate-fade-in">
          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1.5">
                Active Filters:
              </span>

              {categoryFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
                  <span>Category: {categories.find(c => c.id === categoryFilter)?.name}</span>
                  <button onClick={() => { setCategoryFilter("all"); setProductFilter("all"); }} className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {productFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
                  <span>Product: {products.find(p => p.id === productFilter)?.name}</span>
                  <button onClick={() => setProductFilter("all")} className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
                  <span>Status: {statusFilter}</span>
                  <button onClick={() => setStatusFilter("all")} className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {(startDate || endDate) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
                  <span>
                    Date: {startDate || "Any"} to {endDate || "Any"}
                  </span>
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors"
                  >
                    <X className="h-3 w-3" />
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
          ) : <div />}

          {productFilter !== "all" && (() => {
            const selectedProduct = products.find(p => p.id === productFilter);
            if (!selectedProduct) return null;
            const physical = selectedProductSummary ? selectedProductSummary.physicalStock : 0;
            const committed = selectedProductSummary ? (selectedProductSummary.committedStock !== undefined ? selectedProductSummary.committedStock : selectedProductSummary.commitedStock) : 0;
            const delivered = selectedProductSummary ? (selectedProductSummary.deliveredStock ?? 0) : 0;
            const available = selectedProductSummary ? selectedProductSummary.availableStock : 0;
            const minStockVal = selectedProduct.minimumStockAlert !== undefined ? selectedProduct.minimumStockAlert : (selectedProduct.minStockLevel ?? 0);
            const isLow = available <= minStockVal && selectedProduct.status === "Active";

            return (
              <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-400 shadow-sm md:ml-auto w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[8px] font-extrabold mr-1">Stock:</span>
                  <span>Physical: <strong className="text-slate-800 dark:text-slate-200 font-bold">{physical} Qty</strong></span>
                </div>
                <span className="hidden md:inline text-slate-200 dark:text-slate-800">|</span>
                <span>Committed: <strong className="text-slate-800 dark:text-slate-200 font-bold">{committed} Qty</strong></span>
                <span className="hidden md:inline text-slate-200 dark:text-slate-800">|</span>
                <span>Delivered: <strong className="text-slate-800 dark:text-slate-200 font-bold">{delivered} Qty</strong></span>
                <span className="hidden md:inline text-slate-200 dark:text-slate-800">|</span>
                <span className="flex items-center gap-1.5">
                  <span>Net Available:</span>
                  <span className={`px-2 py-0.5 rounded font-black text-xs ${isLow ? 'bg-red-50 dark:bg-red-950/30 text-red-500' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'}`}>
                    {available} Qty
                  </span>
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Right sliding Filter Drawer Sidebar */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Stock Records"
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      >
        {/* Category Selector */}
        <div className="space-y-1.5 lg:hidden">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <span>Product Category</span>
          </label>
          <SearchableSelect
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setProductFilter("all");
            }}
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>

        {/* Product Selector */}
        <div className="space-y-1.5 lg:hidden">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <span>Specific Product</span>
          </label>
          <SearchableSelect
            value={productFilter}
            onChange={setProductFilter}
            options={[
              { value: "all", label: "All Products" },
              ...products
                .filter((p) => categoryFilter === "all" || p.categoryId === categoryFilter)
                .map((p) => ({ value: p.id, label: p.name })),
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>

        {/* Status Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Batch Status</span>
          </label>
          <SearchableSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Status" },
              { value: "Active", label: "Active" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>

        {/* Date Section */}
        <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Production Date Range</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="From Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9"
            />
            <Input
              label="To Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </FilterDrawer>


      {/* Production Batch Entries Grid */}
      <DataTable
        loading={loading}
        loadingText="Loading production data..."
        headers={[
          "#",
          "Product Name",
          "Category",
          "Production Date",
          "Qty Produced",
          "Remarks",
          "Status",
          ...(user?.role === "Admin" ? ["Actions"] : [])
        ]}
        headerClassNames={[
          "",
          "min-w-[200px]",
          "",
          "",
          "text-right",
          "min-w-[150px]",
          "",
          ...(user?.role === "Admin" ? ["text-center"] : [])
        ]}
        emptyMessage="No production batch entries found matching the filter criteria."
      >
        {[...filteredEntries].sort((a, b) => parseInt(b.id) - parseInt(a.id)).map((entry) => {
          return (
            <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{entry.entryNumber}</td>
              <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span>{entry.productName || "—"}</span>
                </div>
              </td>
              <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">{entry.categoryName || "—"}</td>
              <td className="p-3.5 text-slate-500 whitespace-nowrap">
                {formatDate(entry.productionDate)}
              </td>
              <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 text-right whitespace-nowrap">
                {entry.qtyProduced.toLocaleString()} Qty
              </td>
              <td className="p-3.5 text-slate-500 max-w-xs whitespace-nowrap">
                {entry.remarks ? (
                  <button
                    onClick={(e) => handleRemarkClick(e, entry.id, entry.remarks)}
                    className="remark-tooltip-trigger text-left hover:text-blue-650 dark:hover:text-blue-400 transition-colors focus:outline-none cursor-pointer flex items-center gap-1.5 max-w-[180px] w-full"
                    type="button"
                  >
                    <span className="truncate flex-1">{entry.remarks}</span>
                    <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 hover:text-blue-500 transition-colors" />
                  </button>
                ) : (
                  "—"
                )}
              </td>
              <td className="p-3.5 whitespace-nowrap">
                <Badge variant={entry.status === "Active" ? "success" : "neutral"}>
                  {entry.status}
                </Badge>
              </td>
              {user?.role === "Admin" && (
                <td className="p-3.5 text-center whitespace-nowrap">
                  {entry.status === "Active" ? (
                    <button
                      onClick={() => handleCancelEntry(entry)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Cancel production run"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 select-none whitespace-nowrap">Cancelled</span>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </DataTable>

      {/* Add Stock Entry Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Add Production Batch
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
                <div className="flex items-center gap-1.5 p-2.5 rounded bg-red-50 dark:bg-red-900/20 text-red-656 dark:text-red-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className={`font-semibold ${productError ? "text-red-500 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
                  Select Manufactured Product *
                </label>
                <SearchableSelect
                  value={productId}
                  onChange={(val) => {
                    setProductId(val);
                    setError("");
                  }}
                  placeholder="-- Select Product --"
                  options={activeProducts.map((p) => ({ value: p.id, label: p.name }))}
                  className="w-full text-xs font-semibold"
                  hasError={!!productError}
                />
                {productError && (
                  <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{productError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Production Date *"
                  type="date"
                  value={productionDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setProductionDate(e.target.value);
                    setError("");
                  }}
                  error={dateError}
                  disabled={submitting}
                />

                <Input
                  label="Quantity (Qty) *"
                  type="number"
                  placeholder="e.g. 25"
                  value={qtyProduced}
                  onChange={(e) => {
                    setQtyProduced(e.target.value);
                    setError("");
                  }}
                  error={qtyError}
                  disabled={submitting}
                />
              </div>

              <Textarea
                label="Quality / Batch Remarks"
                placeholder="e.g. Shift B. Checked carbon levels, hot rolled sheet thickness tested successfully..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                disabled={submitting}
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
                <Button
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                  className="min-w-[150px]"
                >
                  {!submitting && <Plus className="h-4 w-4 mr-1.5" />}
                  <span>{submitting ? "Saving Batch..." : "Add Production Batch"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {tooltipData && createPortal(
        <div
          className="remark-tooltip-portal fixed bg-slate-900 dark:bg-slate-955 text-white text-xs rounded-lg p-3.5 shadow-2xl z-[9999] border border-slate-800/80 animate-fade-in break-words w-[280px]"
          style={{
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y - 8}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5 pb-1 flex-row border-b border-slate-800">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Batch Remarks</span>
            <button
              onClick={() => setTooltipData(null)}
              className="text-slate-450 hover:text-slate-200 transition-colors p-0.5 rounded cursor-pointer"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-slate-200 leading-relaxed max-h-32 overflow-y-auto pr-1">
            {tooltipData.text}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
