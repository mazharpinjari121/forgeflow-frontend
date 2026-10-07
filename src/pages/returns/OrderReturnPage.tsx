import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus, Search, Trash2, SlidersHorizontal, FilterX, Package, Check, UserPlus, Loader2,
  CornerDownLeft, Edit2, ShieldAlert, X, Info
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { PageHeader, FilterDrawer } from "@/components/common";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { orderReturnService, orderService, partyService, productService } from "@/services";
import { DataTable } from "@/components/ui/table";

export default function OrderReturnPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  // Route query parameters for redirect from accounting/orders
  const queryParams = new URLSearchParams(location.search);
  const urlPartyId = queryParams.get("partyId");
  const urlOrderId = queryParams.get("orderId");
   const from = queryParams.get("fromDate");
  const to = queryParams.get("toDate");

  // Masters & Lists
  const [returns, setReturns] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [returnIdFilter, setReturnIdFilter] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("all");
  const [startDate, setStartDate] = useState(from || "");
  const [endDate, setEndDate] = useState(to || "");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Add / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editReturnId, setEditReturnId] = useState<number | null>(null);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Tooltip State for Return Reason in Table
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

  const handleReasonClick = (e: React.MouseEvent<HTMLButtonElement>, returnId: string, reasonText: string) => {
    e.stopPropagation();
    if (tooltipData?.id === returnId) {
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
        id: returnId,
        text: reasonText,
        x,
        y: rect.top,
      });
    }
  };

  // Orders and Order Details inside Modal
  const [partyOrders, setPartyOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // Checkboxes & Quantities/Amounts for return items
  // Keyed by productId
  const [returnItemsSelection, setReturnItemsSelection] = useState<Record<number, {
    selected: boolean;
    qtyToReturn: string;
    amount: string;
    rate: number;
    maxQty: number;
    orderedQty: number;
    avlReturnQty: number;
    productName: string;
    originalQty?: number;
  }>>({});

  // Fetch basic lists
  const fetchParties = useCallback(async () => {
    try {
      const response = await partyService.getAllParties();
      if (response.data.responseStatus === "Success" && response.data.data) {
        setParties(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch parties:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productService.getAllProducts();
      if (response.data.responseStatus === "Success" && response.data.data) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }, []);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orderReturnService.getAllOrderReturns({
        ReturnId: returnIdFilter ? parseInt(returnIdFilter) : undefined,
        OrderId: orderIdFilter ? parseInt(orderIdFilter) : undefined,
        PartyId: partyFilter !== "all" ? parseInt(partyFilter) : undefined,
        FromDate: startDate || undefined,
        ToDate: endDate || undefined,
      });

      if (response.data.responseStatus === "Success" && response.data.data) {
        setReturns(response.data.data);
      } else {
        setReturns([]);
      }
    } catch (err) {
      console.error("Failed to fetch order returns:", err);
      toast.error("Failed to load order returns.");
    } finally {
      setLoading(false);
    }
  }, [returnIdFilter, orderIdFilter, partyFilter, startDate, endDate]);

  // Load initial data
  useEffect(() => {
    fetchParties();
    fetchProducts();
  }, [fetchParties, fetchProducts]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  // Handle URL redirect query parameters
  useEffect(() => {
    if (urlOrderId || urlPartyId) {
      // Clear URL params
      navigate(location.pathname, { replace: true });

      // Setup and open return setup modal
      handleOpenNewReturn();
      if (urlPartyId) {
        setSelectedPartyId(urlPartyId);
      }
      if (urlOrderId) {
        setSelectedOrderId(urlOrderId);
      }
    }
  }, [urlPartyId, urlOrderId, from, to]);

  // When selectedPartyId changes inside modal, load party's orders
  useEffect(() => {
    const fetchPartyOrders = async () => {
      if (!selectedPartyId) {
        setPartyOrders([]);
        setSelectedOrderId("");
        return;
      }
      setLoadingOrders(true);
      try {
        const response = await orderService.getAllOrders({
          PartyId: parseInt(selectedPartyId),
          Status: "Delivered",
        });
        if (response.data.responseStatus === "Success" && response.data.data) {
          // Filter to only show orders that have a status of Delivered or Partially Delivered
          const filteredOrders = response.data.data.filter((o: any) =>
            o.status === "Delivered" || o.status === "Partially Delivered"
          );
          setPartyOrders(filteredOrders);
        } else {
          setPartyOrders([]);
        }
      } catch (err) {
        console.error("Failed to load orders for party:", err);
        toast.error("Failed to load orders for party.");
      } finally {
        setLoadingOrders(false);
      }
    };

    if (isModalOpen) {
      fetchPartyOrders();
    }
  }, [selectedPartyId, isModalOpen]);

  // When selectedOrderId changes inside modal, load order details and items
  useEffect(() => {
    const fetchSelectedOrderDetails = async () => {
      if (!selectedOrderId) {
        setOrderDetails(null);
        setReturnItemsSelection({});
        return;
      }
      setLoadingOrderDetails(true);
      try {
        const response = await orderService.getOrderById(parseInt(selectedOrderId));
        if (response.data.responseStatus === "Success" && response.data.data) {
          const ord = response.data.data;
          setOrderDetails(ord);

          // Populate selectable items
          const itemsMap: Record<number, any> = {};
          (ord.orderDetails || []).forEach((item: any) => {
            const prodId = item.productId;
            const rate = item.rate || 0;
            const orderedQty = item.qty || 0;
            const maxQty = item.deliveryQty !== undefined ? item.deliveryQty : (item.deliveredQty ?? item.qty ?? 0);
            const avlReturnQty = item.avlReturnQty !== undefined ? item.avlReturnQty : maxQty;
            const productName = item.productName || `Product #${prodId}`;

            itemsMap[prodId] = {
              selected: false,
              qtyToReturn: "1",
              amount: rate.toString(),
              rate: rate,
              maxQty: maxQty, // Delivered Qty
              orderedQty: orderedQty, // Ordered Qty
              avlReturnQty: avlReturnQty, // Available Qty
              productName: productName,
              originalQty: 0,
            };
          });

          setReturnItemsSelection(prev => {
            const merged = { ...itemsMap };
            Object.keys(prev).forEach(key => {
              const k = parseInt(key);
              if (merged[k]) {
                merged[k] = {
                  ...merged[k],
                  selected: prev[k].selected,
                  qtyToReturn: prev[k].qtyToReturn,
                  amount: prev[k].amount,
                  rate: prev[k].rate || merged[k].rate,
                  originalQty: prev[k].originalQty || 0,
                };
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Failed to load order details:", err);
        toast.error("Failed to load order details.");
      } finally {
        setLoadingOrderDetails(false);
      }
    };

    if (isModalOpen) {
      fetchSelectedOrderDetails();
    }
  }, [selectedOrderId, isModalOpen]);

  // Open New Return Modal
  const handleOpenNewReturn = () => {
    setEditReturnId(null);
    setSelectedPartyId("");
    setSelectedOrderId("");
    setReturnDate(new Date().toISOString().split("T")[0]);
    setReason("");
    setReturnItemsSelection({});
    setModalError("");
    setIsModalOpen(true);
  };

  // Open Edit Return Modal
  const handleOpenEditReturn = async (ret: any) => {
    setEditReturnId(ret.returnId);
    setSelectedPartyId(ret.partyId.toString());
    setSelectedOrderId(ret.orderId.toString());
    setReturnDate(ret.returnDate ? ret.returnDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setReason(ret.reason || "");
    setModalError("");

    const initItemsSelection: Record<number, any> = {};
    (ret.orderReturnDetails || []).forEach((d: any) => {
      initItemsSelection[d.productId] = {
        selected: true,
        qtyToReturn: d.qty.toString(),
        amount: d.amount.toString(),
        rate: d.rate || (d.qty > 0 ? (d.amount / d.qty) : 0),
        maxQty: d.qty,
        orderedQty: d.qty,
        avlReturnQty: d.qty,
        productName: d.productName || `Product #${d.productId}`,
        originalQty: d.qty,
      };
    });
    setReturnItemsSelection(initItemsSelection);
    setIsModalOpen(true);
  };

  // Handle Item Checkbox Change
  const handleItemSelectToggle = (productId: number) => {
    setReturnItemsSelection(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const isSelected = !item.selected;
      return {
        ...prev,
        [productId]: {
          ...item,
          selected: isSelected,
          qtyToReturn: isSelected && (parseFloat(item.qtyToReturn) || 0) <= 0 ? "1" : item.qtyToReturn,
          amount: isSelected && (parseFloat(item.qtyToReturn) || 0) <= 0 ? item.rate.toString() : item.amount,
        }
      };
    });
  };

  // Handle Item Quantity Change
  const handleItemQtyChange = (productId: number, val: string) => {
    setReturnItemsSelection(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const qty = parseFloat(val) || 0;
      const amt = (qty * item.rate).toFixed(2);

      return {
        ...prev,
        [productId]: {
          ...item,
          qtyToReturn: val,
          amount: amt,
        }
      };
    });
  };

  // Handle Item Amount Change
  const handleItemAmountChange = (productId: number, val: string) => {
    setReturnItemsSelection(prev => {
      const item = prev[productId];
      if (!item) return prev;

      return {
        ...prev,
        [productId]: {
          ...item,
          amount: val,
        }
      };
    });
  };

  // Compute total return amount dynamically
  const calculateTotalReturnAmount = () => {
    return Object.values(returnItemsSelection)
      .filter(item => item.selected)
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  // Dynamic order value calculation to prevent blank totals
  const getOrderTotalValue = () => {
    if (!orderDetails) return 0;
    return (orderDetails.orderDetails || []).reduce((sum: number, item: any) => sum + (item.qty * item.rate), 0);
  };

  // Check if any selected item exceeds delivery qty limit
  const hasQuantityErrors = () => {
    return Object.values(returnItemsSelection).some(
      item => item.selected && (parseFloat(item.qtyToReturn) || 0) > item.avlReturnQty
    );
  };

  // Handle Submit (Add/Update Return)
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!selectedPartyId) return setModalError("Please select a Party.");
    if (!selectedOrderId) return setModalError("Please select an Order.");

    const userIdNum = currentUser?.id ? (parseInt(currentUser.id.replace("usr-", ""), 10) || 1) : 1;

    try {
      const selectedDetails = Object.entries(returnItemsSelection)
        .filter(([_, item]) => item.selected)
        .map(([prodId, item]) => {
          const qty = parseFloat(item.qtyToReturn);
          const amount = parseFloat(item.amount);

          if (isNaN(qty) || qty <= 0) {
            throw new Error(`Quantity must be a valid positive number for item: ${item.productName}`);
          }
          if (qty > item.avlReturnQty) {
            throw new Error(`Return quantity cannot exceed available return qty (${item.avlReturnQty}) for item: ${item.productName}`);
          }
          if (isNaN(amount) || amount < 0) {
            throw new Error(`Return amount must be a valid positive number for item: ${item.productName}`);
          }

          return {
            productId: parseInt(prodId),
            qty: qty,
            amount: amount,
            userId: userIdNum,
          };
        });

      if (selectedDetails.length === 0) {
        return setModalError("Please select at least one item to return by checking its box.");
      }

      if (hasQuantityErrors() && !editReturnId) {
        return setModalError("Please resolve quantity limit errors before posting return.");
      }

      setSubmitting(true);

      if (editReturnId) {
        // Update Return Payload
        const updatePayload = {
          returnId: editReturnId,
          returnDate: new Date(returnDate + "T12:00:00").toISOString(),
          orderId: parseInt(selectedOrderId),
          reason: reason.trim(),
          userId: userIdNum,
          orderReturnDetails: selectedDetails.map((d) => {
            return {
              ...d,
              returnDetailId: 0,
              returnId: editReturnId,
            };
          }),
        };

        const response = await orderReturnService.updateOrderReturn(updatePayload);
        if (response.data.responseStatus === "Success") {
          toast.success("Order return updated successfully!");
          setIsModalOpen(false);
          fetchReturns();
        } else {
          setModalError(response.data.message || "Failed to update order return.");
        }
      } else {
        // Add Return Payload
        const addPayload = {
          returnDate: new Date(returnDate + "T12:00:00").toISOString(),
          orderId: parseInt(selectedOrderId),
          reason: reason.trim(),
          userId: userIdNum,
          orderReturnDetails: selectedDetails,
        };

        const response = await orderReturnService.addOrderReturn(addPayload);
        if (response.data.responseStatus === "Success") {
          toast.success("Order return processed successfully!");
          setIsModalOpen(false);
          fetchReturns();
        } else {
          setModalError(response.data.message || "Failed to process order return.");
        }
      }
    } catch (err: any) {
      setModalError(err.message || "An error occurred while saving the return.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Order Return Entry
  const handleDeleteReturn = (id: number) => {
    Swal.fire({
      title: "Delete Return Entry?",
      text: "Are you sure you want to delete this order return record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "hsl(var(--destructive, 0 84.2% 60.2%))",
      cancelButtonColor: "hsl(var(--secondary, 210 40% 96.1%))",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const userIdNum = currentUser?.id ? (parseInt(currentUser.id.replace("usr-", ""), 10) || 1) : 1;
          const response = await orderReturnService.deleteOrderReturn(id, userIdNum);
          if (response.data.responseStatus === "Success") {
            toast.success("Order return entry deleted successfully!");
            fetchReturns();
          } else {
            toast.error(response.data.message || "Failed to delete return.");
          }
        } catch (err) {
          console.error("Failed to delete return:", err);
          toast.error("Error occurred while deleting return.");
        }
      }
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setReturnIdFilter("");
    setOrderIdFilter("");
    setPartyFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    returnIdFilter !== "" ||
    orderIdFilter !== "" ||
    partyFilter !== "all" ||
    startDate !== "" ||
    endDate !== "";

  const activeFiltersCount = [
    returnIdFilter !== "",
    orderIdFilter !== "",
    partyFilter !== "all",
    startDate !== "" || endDate !== "",
  ].filter(Boolean).length;

  const hasSelectedItems = Object.values(returnItemsSelection).some(i => i.selected);

  // Compute party options ensuring selectedPartyId is included
  const partyOptions = [...parties];
  if (selectedPartyId && !partyOptions.some(p => p.partyId.toString() === selectedPartyId)) {
    const foundReturn = returns.find(r => r.partyId.toString() === selectedPartyId);
    partyOptions.push({
      partyId: parseInt(selectedPartyId),
      partyName: foundReturn?.partyName || `Party #${selectedPartyId}`,
      partyType: "Active Return"
    });
  }

  // Compute order options ensuring selectedOrderId is included
  const orderOptions = [...partyOrders];
  if (selectedOrderId && !orderOptions.some(o => o.orderId.toString() === selectedOrderId)) {
    if (orderDetails) {
      orderOptions.push({
        orderId: orderDetails.orderId,
        orderDate: orderDetails.orderDate,
        totalAmount: orderDetails.totalAmount || 0,
      });
    } else {
      orderOptions.push({
        orderId: parseInt(selectedOrderId),
        orderDate: new Date().toISOString(),
        totalAmount: 0,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Returns"
        description="Manage customer order returns, process credit notes, reverse inventory updates, and log return history."
        entriesCount={returns.length}
        entriesLabel="Returns"
      />

      {/* Action Header / Top Bar (Responsive inline layout matching orders) */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Return ID, Order, Party..."
              value={returnIdFilter}
              onChange={(e) => setReturnIdFilter(e.target.value)}
              className="input-base pl-9 h-9"
            />
          </div>

          {/* Mobile buttons (hidden on desktop lg) */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            <Button
              onClick={() => setIsFilterDrawerOpen(true)}
              type="button"
              variant="secondary"
              className={`h-9 px-3 relative ${activeFiltersCount > 0
                ? "border-blue-500/50 bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                : ""
                }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-bold text-white leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <Button
              onClick={handleOpenNewReturn}
              className="flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm shrink-0 cursor-pointer"
              title="New Order Return"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Buttons (hidden on mobile, visible on lg) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setIsFilterDrawerOpen(true)}
            type="button"
            variant="secondary"
            className={`h-9 px-3.5 relative ${activeFiltersCount > 0
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

          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              type="button"
              variant="ghost"
              className="h-9 px-2 text-red-600 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <FilterX className="h-4 w-4" />
              <span>Clear Filters</span>
            </Button>
          )}

          <Button onClick={handleOpenNewReturn} className="h-9">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>New Order Return</span>
          </Button>
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Returns"
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      >
        <div className="space-y-4">
          <Input
            label="Return ID"
            placeholder="Filter by Return ID"
            value={returnIdFilter}
            onChange={(e) => setReturnIdFilter(e.target.value)}
            className="h-9"
          />

          <Input
            label="Order ID"
            placeholder="Filter by Order ID"
            value={orderIdFilter}
            onChange={(e) => setOrderIdFilter(e.target.value)}
            className="h-9"
          />

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Party</label>
            <SearchableSelect
              value={partyFilter}
              onChange={setPartyFilter}
              options={[
                { value: "all", label: "All Parties" },
                ...parties.map((p) => ({ value: p.partyId.toString(), label: p.partyName })),
              ]}
              className="w-full text-xs font-semibold"
            />
          </div>


          <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <label className="font-bold text-slate-700 dark:text-slate-300">Return Date Range</label>
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
        </div>
      </FilterDrawer>

      {/* Main Returns Log Table */}
      <DataTable
        loading={loading}
        loadingText="Loading returns log..."
        headers={[
          "#",
          "Return Date",
          "Order ID",
          "Party",
          "Return Reason",
          "Total Amount",
          "Actions"
        ]}
        headerClassNames={[
          "",
          "",
          "",
          "",
          "min-w-[150px]",
          "text-right",
          "text-right",
        ]}
        emptyMessage="No returns processed yet."
      >
        {returns.map((ret) => (
          <tr
            key={ret.returnId}
            onClick={() => navigate(`/returns/${ret.returnId}`)}
            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
          >
            <td className="p-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/returns/${ret.returnId}`);
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-bold text-left cursor-pointer"
              >
                RET-{ret.returnId}
              </button>
            </td>
            <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDate(ret.returnDate)}</td>
            <td className="p-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              ORD-{ret.orderId}
            </td>
            <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              {ret.partyName || "—"}
            </td>
            <td className="p-3.5 text-slate-500 max-w-xs whitespace-nowrap">
              {ret.reason ? (
                <button
                  onClick={(e) => handleReasonClick(e, ret.returnId.toString(), ret.reason)}
                  className="remark-tooltip-trigger text-left hover:text-blue-650 dark:hover:text-blue-400 transition-colors focus:outline-none cursor-pointer flex items-center gap-1.5 max-w-[180px] w-full"
                  type="button"
                >
                  <span className="truncate flex-1">{ret.reason}</span>
                  <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 hover:text-blue-500 transition-colors" />
                </button>
              ) : (
                "—"
              )}
            </td>
            <td className="p-3.5 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              ₹{ret.totalAmount.toLocaleString("en-IN")}
            </td>
            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
              {ret.isActive && (
                <>
                  {/* Edit action is commented for order return 29-06-2026*/}
                  {/* <button
                    onClick={() => handleOpenEditRet  urn(ret)}
                    className="p-1 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors inline-flex items-center justify-center"
                    title="Edit Return"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-blue-550" />
                  </button> */}
                  <button
                    onClick={() => handleDeleteReturn(ret.returnId)}
                    className="p-1 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors inline-flex items-center justify-center"
                    title="Delete Return"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Booking/Editing Return Form Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-7xl overflow-hidden max-h-[90vh] lg:h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">

                {editReturnId ? `Edit Order Return (RET-${editReturnId})` : "New Order Return Booking"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReturn} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto lg:overflow-hidden flex flex-col gap-4 text-xs flex-1">
                {modalError && (
                  <div className="flex items-center gap-1.5 p-2.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium shrink-0">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 lg:overflow-hidden">
                  {/* Left Column - Return Form Fields */}
                  <div className="col-span-12 lg:col-span-4 flex flex-col lg:overflow-y-auto space-y-4 pr-1 shrink-0 lg:h-full pb-2 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800/80 lg:pr-6">
                    <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                      <h4 className="font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Return Details</h4>

                      {/* Party Selection */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Party Account *</label>
                        <SearchableSelect
                          value={selectedPartyId}
                          onChange={(val) => {
                            setSelectedPartyId(val);
                            setSelectedOrderId("");
                            setReturnItemsSelection({});
                          }}
                          disabled={editReturnId !== null || hasSelectedItems}
                          options={[
                            { value: "", label: "Choose a Party..." },
                            ...partyOptions.map((p) => ({
                              value: p.partyId.toString(),
                              label: `${p.partyName} (${p.partyType})`
                            }))
                          ]}
                          className="w-full text-xs font-semibold bg-white dark:bg-slate-900"
                        />
                      </div>

                      {/* Order Selection */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Select Order Reference *</label>
                        {loadingOrders ? (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] p-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Fetching orders...</span>
                          </div>
                        ) : (
                          <SearchableSelect
                            value={selectedOrderId}
                            onChange={(val) => {
                              setSelectedOrderId(val);
                              setReturnItemsSelection({});
                            }}
                            disabled={!selectedPartyId || editReturnId !== null || hasSelectedItems}
                            options={[
                              { value: "", label: selectedPartyId ? "Choose an Order..." : "Select Party First..." },
                              ...orderOptions.map((o) => ({
                                value: o.orderId.toString(),
                                label: `ORD-${o.orderId} (Booked: ${formatDate(o.orderDate)} - Total: ₹${o.totalAmount.toLocaleString("en-IN")})`
                              }))
                            ]}
                            className="w-full text-xs font-semibold bg-white dark:bg-slate-900"
                          />
                        )}
                      </div>

                      {/* Return Date */}
                      <Input
                        label="Return Date *"
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="h-9.5"
                      />

                      {/* Reason / Remarks */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Reason for Return (Optional)</label>
                        <textarea
                          rows={3}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Dimensions not matching specification, damaged delivery, over-ordered stock..."
                          className="input-base p-2 min-h-[70px] resize-y"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Ordered Product Selector & Settings */}
                  <div className="col-span-12 lg:col-span-8 flex flex-col lg:h-full lg:overflow-hidden">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col flex-1 lg:h-full bg-slate-50/20 dark:bg-slate-950/10">
                      {/* Summary values showed on the top of the grid */}
                      <div className="px-4 py-3 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Adjust Order Products Returns</span>
                        {orderDetails && (
                          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
                              Order Amount: <b className="text-slate-900 dark:text-slate-100 font-mono">₹{getOrderTotalValue().toLocaleString("en-IN")}</b>
                            </span>
                            <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded">
                              Selected: <b className="font-mono">{Object.values(returnItemsSelection).filter(i => i.selected).length}</b>
                            </span>
                            <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded">
                              Credit Amount: <b className="font-mono">₹{calculateTotalReturnAmount().toLocaleString("en-IN")}</b>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {!selectedOrderId ? (
                          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 h-full">
                            <Package className="h-10 w-10 text-slate-300 mb-2" />
                            <p className="font-bold text-xs">No Order Selected</p>
                            <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">Please select a party and an order on the left panel to load returned items.</p>
                          </div>
                        ) : loadingOrderDetails ? (
                          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 h-full">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                            <span>Loading order items...</span>
                          </div>
                        ) : (
                          <div className="p-4 space-y-2">
                            {Object.entries(returnItemsSelection).map(([prodIdKey, item]) => {
                              const prodId = parseInt(prodIdKey);
                              const qtyVal = parseFloat(item.qtyToReturn) || 0;
                              const isExceeded = qtyVal > item.avlReturnQty;
                              const isZeroAvailable = item.avlReturnQty <= 0;

                              return (
                                <div
                                  key={prodId}
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all duration-150 gap-4 ${isZeroAvailable
                                      ? "bg-slate-50/50 dark:bg-slate-900/10 border-slate-200/40 dark:border-slate-800/40 opacity-60"
                                      : item.selected
                                        ? "bg-blue-50/30 border-blue-200 dark:bg-blue-950/10 dark:border-blue-900"
                                        : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80"
                                    }`}
                                >
                                  {/* Select & Info */}
                                  <div className="flex items-start gap-3 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={item.selected}
                                      disabled={isZeroAvailable}
                                      onChange={() => handleItemSelectToggle(prodId)}
                                      className={`mt-1.5 h-4.5 w-4.5 rounded text-blue-600 focus:ring-blue-500/40 border-slate-300 ${isZeroAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                        }`}
                                    />
                                    <div className="space-y-0.5">
                                      <span className={`font-bold block ${isZeroAvailable ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-900 dark:text-slate-100"}`}>
                                        {item.productName}
                                      </span>
                                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500">
                                        <span>Ordered: <b className="text-slate-700 dark:text-slate-300">{item.orderedQty} Qty</b></span>
                                        <span>•</span>
                                        <span>
                                          Available to return:{" "}
                                          <b className={isZeroAvailable ? "text-red-500" : "text-slate-700 dark:text-slate-300"}>
                                            {item.avlReturnQty} Qty
                                          </b>
                                        </span>
                                        <span>•</span>
                                        <span>Rate: <b className="text-slate-700 dark:text-slate-300">₹{item.rate}/Unit</b></span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Inputs */}
                                  {item.selected && (
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                        {/* Return Qty */}
                                        <div className="w-24">
                                          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Qty to Return</label>
                                          <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={item.qtyToReturn}
                                            onChange={(e) => handleItemQtyChange(prodId, e.target.value)}
                                            className={`input-base h-8 text-right font-bold w-full ${isExceeded ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : ""}`}
                                          />
                                        </div>

                                        {/* Return Amount */}
                                        <div className="w-32">
                                          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Return Credit (₹)</label>
                                          <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={item.amount}
                                            onChange={(e) => handleItemAmountChange(prodId, e.target.value)}
                                            className="input-base h-8 text-right font-extrabold w-full text-blue-600 dark:text-blue-400"
                                          />
                                        </div>
                                      </div>

                                      {/* Instant exceeded validation warning */}
                                      {isExceeded && (
                                        <span className="text-[9px] text-red-500 font-bold mt-0.5 block">
                                          Exceeds available return qty of {item.avlReturnQty}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/30 dark:bg-slate-900/10">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || hasQuantityErrors()}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      <span>Saving Return...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      <span>{editReturnId ? "Save Changes" : "Order Return"}</span>
                    </>
                  )}
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
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Return Reason</span>
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
