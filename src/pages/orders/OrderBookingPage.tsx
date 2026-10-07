import { useState, Fragment, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, Trash2, Calendar, ShieldAlert, AlertCircle, Eye, FileText, Clock, X, Share2, SlidersHorizontal, FilterX, User, Package, Check, UserPlus, ChevronDown, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { PageHeader, Loader, FilterDrawer } from "@/components/common";
import { SearchInput } from "@/components/ui/search-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PartyFormModal } from "@/pages/masters/party/PartyFormModal";
import { formatDate } from "@/lib/utils";
import { orderService, partyService, productService, categoryService } from "@/services";
import { DataTable } from "@/components/ui/table";



export default function OrderBookingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPartyFilter = (location.state?.partyId || queryParams.get("partyId") || "all").toString();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [partyFilter, setPartyFilter] = useState(initialPartyFilter);
  const [orderStartDate, setOrderStartDate] = useState("");
  const [orderEndDate, setOrderEndDate] = useState("");
  const [deliveryStartDate, setDeliveryStartDate] = useState("");
  const [deliveryEndDate, setDeliveryEndDate] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);

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
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }, []);

  const fetchParties = useCallback(async () => {
    try {
      const response = await partyService.getAllParties();
      if (response.data.responseStatus === "Success" && response.data.data) {
        const mapped = response.data.data.map((p: any) => ({
          ...p,
          id: p.partyId.toString(),
          name: p.partyName,
          type: p.partyType,
          mobile: p.primaryMobile,
          whatsapp: p.whatsAppMobile,
          status: p.isActive ? "Active" : "Inactive",
        }));
        setParties(mapped);
        return mapped;
      }
    } catch (err) {
      console.error("Failed to fetch parties:", err);
    }
    return [];
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await orderService.getAllOrders({
        PartyId: partyFilter !== "all" ? parseInt(partyFilter) : undefined,
        Status: statusFilter !== "all" ? statusFilter : undefined,
        ProductId: productFilter !== "all" ? parseInt(productFilter) : undefined,
        OrderDateFrom: orderStartDate || undefined,
        OrderDateTo: orderEndDate || undefined,
        ExpectedDateFrom: deliveryStartDate || undefined,
        ExpectedDateTo: deliveryEndDate || undefined,
        OverdueBeforeDate: showOnlyOverdue ? today : undefined,
      });
      if (response.data.responseStatus === "Success" && response.data.data) {
        const mapped = response.data.data.map((o: any) => {
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
            advanceAmount: 0,
            items,
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [partyFilter, statusFilter, productFilter, orderStartDate, orderEndDate, deliveryStartDate, deliveryEndDate, showOnlyOverdue]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchParties();
  }, [fetchCategories, fetchProducts, fetchParties]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const paramPartyId = location.state?.partyId || qParams.get("partyId");
    if (paramPartyId) {
      setPartyFilter(paramPartyId.toString());
    }
    if (location.state?.filter === "overdue") {
      setShowOnlyOverdue(true);
    }
    const urlFromDate = qParams.get("fromDate");
    const urlToDate = qParams.get("toDate");
    if (urlFromDate) {
      setOrderStartDate(urlFromDate);
    }
    if (urlToDate) {
      setOrderEndDate(urlToDate);
    }
  }, [location]);


  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPartyFilter("all");
    setOrderStartDate("");
    setOrderEndDate("");
    setDeliveryStartDate("");
    setDeliveryEndDate("");
    setProductFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setShowOnlyOverdue(false);
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "all" ||
    partyFilter !== "all" ||
    orderStartDate !== "" ||
    orderEndDate !== "" ||
    deliveryStartDate !== "" ||
    deliveryEndDate !== "" ||
    productFilter !== "all" ||
    minAmount !== "" ||
    maxAmount !== "" ||
    showOnlyOverdue;

  const activeFiltersCount = [
    statusFilter !== "all",
    partyFilter !== "all",
    orderStartDate !== "" || orderEndDate !== "",
    deliveryStartDate !== "" || deliveryEndDate !== "",
    productFilter !== "all",
    minAmount !== "" || maxAmount !== "",
    showOnlyOverdue
  ].filter(Boolean).length;

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [orderType, setOrderType] = useState<"Estimate" | "Invoice">("Estimate");
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [partySearchTerm, setPartySearchTerm] = useState("");
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [lineItems, setLineItems] = useState<{
    categoryId: string;
    productId: string;
    qtyOrdered: string;
    unitPrice: string;
    overrideReason: string;
    productSearchQuery?: string;
    showDropdown?: boolean;
  }[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [partySummary, setPartySummary] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Party modal state
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);

  const [formCategory, setFormCategory] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formProductSearch, setFormProductSearch] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const handleFormAddItem = () => {
    if (!formCategory) {
      setBookingError("Please select a Category");
      return;
    }
    if (!formProduct) {
      setBookingError("Please select a Product");
      return;
    }
    const qty = parseFloat(formQty);
    if (isNaN(qty) || qty <= 0) {
      setBookingError("Quantity ordered must be a valid positive number");
      return;
    }
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      setBookingError("Rate must be a valid positive number");
      return;
    }

    const exists = lineItems.some(item => item.productId === formProduct);
    if (exists) {
      setBookingError("This product is already added to the order");
      return;
    }

    const prod = products.find(p => p.id === formProduct);
    const originalPrice = prod ? prod.price : 0;
    const isOverride = originalPrice !== price;

    const newItem = {
      categoryId: formCategory,
      productId: formProduct,
      qtyOrdered: formQty,
      unitPrice: formPrice,
      overrideReason: isOverride ? "Rate overridden in form" : "",
      productSearchQuery: formProductSearch
    };

    setLineItems([...lineItems, newItem]);
    setBookingError("");

    // Reset fields
    setFormCategory("");
    setFormProduct("");
    setFormProductSearch("");
    setFormQty("");
    setFormPrice("");
  };
  // Order Add logic
  const handleOpenBooking = () => {
    setSelectedPartyId("");
    setPartySearchTerm("");
    setPartySummary(null);
    setOrderDate(new Date().toISOString().split("T")[0]);
    setDeliveryDate("");
    setNotes("");
    setAdvanceAmount("");
    setLineItems([]);
    setBookingError("");
    setFormCategory("");
    setFormProduct("");
    setFormProductSearch("");
    setFormQty("");
    setFormPrice("");
    setOrderType("Estimate");
    setIsAddingProduct(true);
    setIsPartyModalOpen(false);
    setIsBookingOpen(true);
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const newItems = [...lineItems];
    newItems[index].categoryId = prod.categoryId;
    newItems[index].productId = prodId;
    newItems[index].unitPrice = prod.price.toString();
    newItems[index].overrideReason = "";
    newItems[index].productSearchQuery = prod.name;
    newItems[index].showDropdown = false;
    setLineItems(newItems);
  };

  const handleLineItemChange = (index: number, field: string, val: string) => {
    const newItems = [...lineItems];
    (newItems[index] as any)[field] = val;
    setLineItems(newItems);
  };

  const handleProductSearchChange = (index: number, val: string) => {
    const newItems = [...lineItems];
    newItems[index].productSearchQuery = val;
    newItems[index].showDropdown = true;
    setLineItems(newItems);
  };

  const handleProductFocus = (index: number) => {
    const newItems = [...lineItems];
    newItems[index].showDropdown = true;
    setLineItems(newItems);
  };

  const handleProductBlur = (index: number) => {
    setTimeout(() => {
      setLineItems((prevItems) => {
        const newItems = [...prevItems];
        if (newItems[index]) {
          newItems[index].showDropdown = false;
          const prod = products.find(p => p.id === newItems[index].productId);
          newItems[index].productSearchQuery = prod ? prod.name : "";
        }
        return newItems;
      });
    }, 200);
  };

  useEffect(() => {
    const fetchPartySummary = async () => {
      if (!selectedPartyId) {
        setPartySummary(null);
        return;
      }
      setLoadingSummary(true);
      try {
        const response = await partyService.getPartySummary(parseInt(selectedPartyId));
        if (response.data.responseStatus === "Success" && response.data.data) {
          setPartySummary(response.data.data);
        } else {
          setPartySummary(null);
        }
      } catch (err) {
        console.error("Failed to fetch party summary:", err);
        setPartySummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchPartySummary();
  }, [selectedPartyId]);

  const handleAddLine = () => {
    setLineItems([
      ...lineItems,
      {
        categoryId: "",
        productId: "",
        qtyOrdered: "",
        unitPrice: "",
        overrideReason: "",
        productSearchQuery: "",
        showDropdown: false,
      }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const partyError = bookingError.toLowerCase().includes("party") ? bookingError : "";
  const deliveryDateError = (bookingError.toLowerCase().includes("delivery") || bookingError.toLowerCase().includes("expected date")) ? bookingError : "";
  const catError = bookingError.toLowerCase().includes("category") ? bookingError : "";
  const productError = (bookingError.toLowerCase().includes("product") && !bookingError.toLowerCase().includes("category") && !bookingError.toLowerCase().includes("at least one")) ? bookingError : "";
  const qtyError = (bookingError.toLowerCase().includes("quantity") || bookingError.toLowerCase().includes("qty")) ? bookingError : "";
  const priceError = (bookingError.toLowerCase().includes("rate") || bookingError.toLowerCase().includes("price")) ? bookingError : "";
  const lineItemsError = bookingError.toLowerCase().includes("at least one") ? bookingError : "";
  const generalError = bookingError && !partyError && !deliveryDateError && !catError && !productError && !qtyError && !priceError && !lineItemsError ? bookingError : "";

  const handleBookOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId) return setBookingError("Party is required");
    if (lineItems.length === 0) return setBookingError("Please add at least one product item to book an order");
    if (!deliveryDate) return setBookingError("Expected delivery date is required");

    setSubmitting(true);
    setBookingError("");

    const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;

    try {
      const validatedItems = lineItems.map((item, idx) => {
        if (!item.productId) {
          throw new Error(`Please select a product for line #${idx + 1}`);
        }
        const prod = products.find((p) => p.id === item.productId);
        const qty = parseFloat(item.qtyOrdered);
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Quantity ordered must be a valid positive number for product: ${prod?.name || "selected item"}`);
        }
        const rate = parseFloat(item.unitPrice);
        if (isNaN(rate) || rate < 0) {
          throw new Error(`Rate must be a valid positive number for product: ${prod?.name || "selected item"}`);
        }

        const amount = qty * rate;
        return {
          productId: parseInt(item.productId),
          qty: qty,
          rate: rate,
          amount: amount,
          userId: userIdNum,
        };
      });

      const orderPayload = {
        orderId: 0,
        partyId: parseInt(selectedPartyId),
        orderType: orderType,
        orderDate: new Date(orderDate + "T12:00:00").toISOString(),
        expectedDeliveryDate: new Date(deliveryDate + "T12:00:00").toISOString(),
        status: "Confirmed",
        remark: notes.trim(),
        userId: userIdNum,
        orderDetails: validatedItems,
      };

      const response = await orderService.addOrder(orderPayload);
      if (response.data.responseStatus === "Success") {
        toast.success(`Order booked successfully!`);
        setIsBookingOpen(false);
        await fetchOrders();
      } else {
        setBookingError(response.data.message || "Failed to book order");
      }
    } catch (err: any) {
      setBookingError(err.message || "Failed to book order");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel order (Admin only)
  const handleCancelOrder = async (ord: any) => {
    if (user?.role !== "Admin") {
      toast.error("Access Denied: Only Administrator accounts can cancel orders");
      return;
    }

    const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;

    const result = await Swal.fire({
      title: "Cancel Order?",
      text: `Are you sure you want to cancel ${ord.orderNumber}? Outstanding balances will be reversed.`,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Enter reason for cancellation...",
      showCancelButton: true,
      confirmButtonColor: "hsl(var(--destructive))",
      cancelButtonColor: "hsl(var(--muted-foreground))",
      confirmButtonText: "Yes, Cancel Order",
      inputValidator: (value) => {
        if (!value) {
          return "You need to write a reason!";
        }
      }
    });

    if (result.isConfirmed) {
      try {
        const response = await orderService.updateOrderStatus(parseInt(ord.id), "Cancelled", userIdNum);
        if (response.data.responseStatus === "Success") {
          toast.success("Order cancelled successfully");
          await fetchOrders();
        } else {
          toast.error(response.data.message || "Failed to cancel order");
        }
      } catch (err: any) {
        console.error("Failed to cancel order:", err);
        toast.error("Failed to cancel order. Please try again.");
      }
    }
  };

  // Date Urgency Helper
  const getDeliveryUrgency = (dateStr: string, status: string) => {
    if (status === "Delivered" || status === "Cancelled") return "neutral";
    const today = new Date().toISOString().split("T")[0];
    if (dateStr < today) return "overdue";
    if (dateStr === today) return "due-today";
    return "upcoming";
  };

  const filteredOrders = orders.filter((o) => {
    const party = parties.find((p) => p.id === o.partyId);
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.remark && o.remark.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.status && o.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.orderType && o.orderType.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesParty = partyFilter === "all" || o.partyId === partyFilter;

    // Order Date matching
    let matchesOrderDate = true;
    if (orderStartDate) {
      matchesOrderDate = matchesOrderDate && o.orderDate >= orderStartDate;
    }
    if (orderEndDate) {
      matchesOrderDate = matchesOrderDate && o.orderDate <= orderEndDate;
    }

    // Delivery Date matching
    let matchesDeliveryDate = true;
    if (deliveryStartDate) {
      matchesDeliveryDate = matchesDeliveryDate && o.deliveryDate >= deliveryStartDate;
    }
    if (deliveryEndDate) {
      matchesDeliveryDate = matchesDeliveryDate && o.deliveryDate <= deliveryEndDate;
    }

    // Product matching
    let matchesProduct = true;
    if (productFilter !== "all") {
      matchesProduct = o.items.some((item: any) => item.productId === productFilter);
    }

    // Grand Total calculation for amount matching
    const totalAmt = o.items.reduce((sum: number, i: any) => {
      const base = i.qtyOrdered * i.unitPrice;
      if (o.orderType === "Invoice") {
        const prod = products.find(p => p.id === i.productId);
        const cgst = prod?.cgst ?? 0;
        const sgst = prod?.sgst ?? 0;
        return sum + base + (base * (cgst + sgst) / 100);
      }
      return sum + base;
    }, 0);
    let matchesAmount = true;
    if (minAmount) {
      matchesAmount = matchesAmount && totalAmt >= parseFloat(minAmount);
    }
    if (maxAmount) {
      matchesAmount = matchesAmount && totalAmt <= parseFloat(maxAmount);
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesParty &&
      matchesOrderDate &&
      matchesDeliveryDate &&
      matchesProduct &&
      matchesAmount
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Booking"
        description="Book party orders, allocate advance payments, and dispatch partial delivery challans."
        entriesCount={filteredOrders.length}
        entriesLabel="Orders"
      />

      {/* Unified Search, Filters & Action Button */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-2 flex-grow">
          <div className="flex-grow max-w-full lg:max-w-md">
            <SearchInput
              placeholder="Search Order number, Party name..."
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

          {/* Mobile Add Order Button (hidden on desktop lg) */}
          <Button
            onClick={handleOpenBooking}
            className="lg:hidden flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm shadow-primary/20 shrink-0 cursor-pointer active:scale-95"
            title="New Order Booking"
          >
            <Plus className="h-4 w-4" />
          </Button>


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

          <Button onClick={handleOpenBooking} className="h-9">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>New Order Booking</span>
          </Button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1.5">
            Active Filters:
          </span>

          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>Status: {statusFilter}</span>
              <button onClick={() => setStatusFilter("all")} className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {partyFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>Customer: {parties.find(p => p.id === partyFilter)?.name}</span>
              <button onClick={() => setPartyFilter("all")} className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {showOnlyOverdue && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50 text-[11px] font-semibold">
              <span>Only Overdue</span>
              <button onClick={() => setShowOnlyOverdue(false)} className="hover:text-red-950 dark:hover:text-red-200 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {(orderStartDate || orderEndDate) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>
                Order Date: {orderStartDate || "Any"} to {orderEndDate || "Any"}
              </span>
              <button
                onClick={() => {
                  setOrderStartDate("");
                  setOrderEndDate("");
                }}
                className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {(deliveryStartDate || deliveryEndDate) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>
                Delivery Date: {deliveryStartDate || "Any"} to {deliveryEndDate || "Any"}
              </span>
              <button
                onClick={() => {
                  setDeliveryStartDate("");
                  setDeliveryEndDate("");
                }}
                className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors"
              >
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

          {(minAmount || maxAmount) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-750 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>
                Amount: ₹{minAmount || "0"} - ₹{maxAmount || "Max"}
              </span>
              <button
                onClick={() => {
                  setMinAmount("");
                  setMaxAmount("");
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
      )}

      {/* Right sliding Filter Drawer Sidebar */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Orders"
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      >
        {/* Party Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>Party</span>
          </label>
          <SearchableSelect
            value={partyFilter}
            onChange={setPartyFilter}
            options={[
              { value: "all", label: "All Parties" },
              ...parties.map((p) => ({ value: p.id, label: p.name })),
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>

        {/* Status Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Order Status</span>
          </label>
          <SearchableSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "Confirmed", label: "Confirmed" },
              { value: "Partially Delivered", label: "Partially Delivered" },
              { value: "Delivered", label: "Delivered" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>

        {/* Overdue Filter */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyOverdue}
              onChange={() => setShowOnlyOverdue(!showOnlyOverdue)}
              className="h-4.5 w-4.5 rounded text-blue-600 focus:ring-blue-500/40 border-slate-300 cursor-pointer"
            />
            <span className="font-bold text-slate-700 dark:text-slate-300">Show Only Overdue Orders</span>
          </label>
        </div>

        {/* Product Selector */}
        <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <span>Product</span>
          </label>
          <SearchableSelect
            value={productFilter}
            onChange={setProductFilter}
            options={[
              { value: "all", label: "All Products" },
              ...products.map((p) => ({ value: p.id, label: p.name })),
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>

        {/* Order Date Section */}
        <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Order Date Range</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="From Date"
              type="date"
              value={orderStartDate}
              onChange={(e) => setOrderStartDate(e.target.value)}
              className="h-9"
            />
            <Input
              label="To Date"
              type="date"
              value={orderEndDate}
              onChange={(e) => setOrderEndDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* Delivery Date Section */}
        <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Expected Delivery Date Range</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="From Date"
              type="date"
              value={deliveryStartDate}
              onChange={(e) => setDeliveryStartDate(e.target.value)}
              className="h-9"
            />
            <Input
              label="To Date"
              type="date"
              value={deliveryEndDate}
              onChange={(e) => setDeliveryEndDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </FilterDrawer>

      {/* Orders Table */}
      <DataTable
        loading={loading}
        loadingText="Loading orders..."
        headers={[
          "Order No",
          "Order Type",
          "Order Date",
          "Party",
          "Amount",
          "Delivered %",
          "Expected Delivery",
          "Status"
        ]}
        headerClassNames={["", "", "", "", "", "", "", ""]}
        emptyMessage="No orders booked yet."
      >
        {[...filteredOrders].sort((a, b) => parseInt(b.id) - parseInt(a.id)).map((o) => {
          const customer = parties.find((p) => p.id === o.partyId);
          const totalAmt = o.items.reduce((sum: number, i: any) => {
            const base = i.qtyOrdered * i.unitPrice;
            if (o.orderType === "Invoice") {
              const prod = products.find(p => p.id === i.productId);
              const cgst = prod?.cgst ?? 0;
              const sgst = prod?.sgst ?? 0;
              return sum + base + (base * (cgst + sgst) / 100);
            }
            return sum + base;
          }, 0);
          const totalDelivered = o.items.reduce((sum: number, i: any) => sum + i.qtyDelivered, 0);
          const totalOrdered = o.items.reduce((sum: number, i: any) => sum + i.qtyOrdered, 0);
          const deliveredPct = Math.round(o.deliveredPercentage ?? 0);

          const urgency = getDeliveryUrgency(o.deliveryDate, o.status);

          return (
            <tr
              key={o.id}
              onClick={() => navigate(`/orders/${o.id}`)}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
            >
              <td className="p-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${o.id}`);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-bold text-left cursor-pointer"
                >
                  {o.orderNumber}
                </button>
              </td>
              <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {o.orderType || "—"}
              </td>
              <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDate(o.orderDate)}</td>
              <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{customer?.name}</td>
              <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                ₹{totalAmt.toLocaleString("en-IN")}
              </td>
              <td className="p-3.5 whitespace-nowrap">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${deliveredPct}%` }}
                    />
                  </div>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{deliveredPct}%</span>
                </div>
              </td>
              <td className="p-3.5 whitespace-nowrap">
                <span
                  className={`badge whitespace-nowrap ${urgency === "overdue"
                    ? "badge-danger font-extrabold flex items-center gap-0.5 animate-pulse"
                    : urgency === "due-today"
                      ? "badge-warning font-bold"
                      : urgency === "upcoming"
                        ? "badge-success font-medium"
                        : "badge-neutral"
                    }`}
                >
                  {formatDate(o.deliveryDate)}
                  {urgency === "overdue" && " (Overdue)"}
                  {urgency === "due-today" && " (Due Today)"}
                </span>
              </td>
              <td className="p-3.5 whitespace-nowrap">
                <span
                  className={`badge whitespace-nowrap ${o.status === "Confirmed"
                    ? "badge-info"
                    : o.status === "Partially Delivered"
                      ? "badge-warning"
                      : o.status === "Delivered"
                        ? "badge-success"
                        : "badge-danger"
                    }`}
                >
                  {o.status}
                </span>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {/* Booking Form Modal */}
      {isBookingOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-7xl overflow-hidden max-h-[90vh] lg:h-[85vh] flex flex-col">
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                New Order Booking
              </h3>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookOrder} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto lg:overflow-hidden flex flex-col gap-4 text-xs flex-1">
                {generalError && (
                  <div className="flex items-center gap-1.5 p-2.5 rounded bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-400 font-medium shrink-0">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{generalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 lg:overflow-hidden">
                  {/* Left Column - Form Details Sidebar */}
                  <div className="col-span-12 lg:col-span-4 flex flex-col lg:overflow-y-auto space-y-4 pr-1 shrink-0 lg:h-full pb-2 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800/80 lg:pr-6">
                    {/* Customer & Date Details */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                      <h4 className="font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Order Details</h4>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-700 dark:text-slate-300">Order Type *</label>
                          <select
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value as "Estimate" | "Invoice")}
                            className="input-base h-9.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                            required
                          >
                            <option value="Estimate">Estimate</option>
                            <option value="Invoice">Invoice</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 relative">
                          <div className="flex items-center justify-between">
                            <label className={`font-semibold ${partyError ? "text-red-500 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>Party *</label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsPartyModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all duration-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40"
                              title="Register new party"
                            >
                              <UserPlus className="h-3 w-3" /> New Party
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Type to search party..."
                              value={partySearchTerm}
                              onChange={(e) => {
                                setPartySearchTerm(e.target.value);
                                setShowPartyDropdown(true);
                                setBookingError("");
                              }}
                              onFocus={() => setShowPartyDropdown(true)}
                              onBlur={() => {
                                setTimeout(() => {
                                  setShowPartyDropdown(false);
                                  const p = parties.find(party => party.id === selectedPartyId);
                                  setPartySearchTerm(p ? p.name : "");
                                }, 200);
                              }}
                              className={`input-base pr-8 ${partyError ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" : ""}`}
                            />
                            {(selectedPartyId || partySearchTerm) && (
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setSelectedPartyId("");
                                  setPartySearchTerm("");
                                  setShowPartyDropdown(false);
                                  setBookingError("");
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {showPartyDropdown && (
                              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50">
                                {parties
                                  .filter(p => p.status === "Active" && (
                                    p.name.toLowerCase().includes(partySearchTerm.toLowerCase()) ||
                                    p.city.toLowerCase().includes(partySearchTerm.toLowerCase())
                                  ))
                                  .map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onMouseDown={() => {
                                        setSelectedPartyId(p.id);
                                        setPartySearchTerm(p.name);
                                        setShowPartyDropdown(false);
                                        setBookingError("");
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 flex flex-col text-[11px]"
                                    >
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                                      <span className="text-[9px] text-slate-400">{p.type} - {p.city}, {p.state}</span>
                                    </button>
                                  ))
                                }
                                {parties.filter(p => p.status === "Active" && (
                                  p.name.toLowerCase().includes(partySearchTerm.toLowerCase()) ||
                                  p.city.toLowerCase().includes(partySearchTerm.toLowerCase())
                                )).length === 0 && (
                                    <div className="p-2 text-slate-400 text-center">No active parties found</div>
                                  )}
                              </div>
                            )}
                          </div>
                          {partyError && (
                            <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{partyError}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Booking Date *"
                            type="date"
                            value={orderDate}
                            onChange={(e) => {
                              setOrderDate(e.target.value);
                              setBookingError("");
                            }}
                          />

                          <Input
                            label="Expected Delivery *"
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => {
                              setDeliveryDate(e.target.value);
                              setBookingError("");
                            }}
                            error={deliveryDateError}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Outstanding Balance card */}
                    {selectedPartyId && (
                      <div className="bg-amber-50/60 dark:bg-amber-955/10 border border-amber-200/60 dark:border-amber-900/40 p-4 rounded-xl flex items-center justify-between gap-2 shadow-sm animate-fade-in text-xs shrink-0">
                        <div>
                          <span className="text-[9px] text-amber-700 dark:text-amber-500 font-bold block uppercase tracking-wider">Last Payment</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block font-mono">
                            {loadingSummary ? (
                              <span className="text-slate-400 italic">Loading...</span>
                            ) : partySummary ? (
                              partySummary.lastPaymentAmount > 0
                                ? `₹${partySummary.lastPaymentAmount.toLocaleString("en-IN")} (${partySummary.lastPaymentDate ? formatDate(partySummary.lastPaymentDate.split("T")[0]) : ""})`
                                : "No payments yet"
                            ) : (
                              "No payments yet"
                            )}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-amber-700 dark:text-amber-500 font-bold block uppercase tracking-wider">Outstanding Balance</span>
                          <span className="font-extrabold text-sm text-amber-600 mt-1 block">
                            {loadingSummary ? (
                              <span className="text-slate-400 italic">Loading...</span>
                            ) : partySummary !== null ? (
                              `₹${partySummary.outstandingBalance.toLocaleString("en-IN")}`
                            ) : (
                              "₹0"
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Delivery Notes */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                      <Textarea
                        label="Remark / Notes"
                        placeholder="Load on heavy flatbed truck, bundle with metal ties..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="leading-relaxed text-xs"
                      />
                    </div>

                  </div>

                  {/* Right Column - Product Entry Form and Workspace Grid */}
                  <div className="col-span-12 lg:col-span-8 flex flex-col lg:overflow-hidden space-y-4 lg:h-full">
                    {/* Order Line Items section */}
                    <div className="bg-slate-50/30 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3.5 flex-1 flex flex-col lg:overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Order Products Items *</label>
                          {lineItems.length > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-550/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full animate-fade-in">
                              {lineItems.length} {lineItems.length === 1 ? 'Product' : 'Products'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {lineItems.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-xs shadow-sm animate-fade-in">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Total:</span>
                              <span className="font-mono text-blue-700 dark:text-blue-300 font-extrabold text-xs">
                                ₹{lineItems.reduce((sum, item) => {
                                  const base = (parseFloat(item.qtyOrdered) || 0) * (parseFloat(item.unitPrice) || 0);
                                  if (orderType === "Invoice") {
                                    const prod = products.find(p => p.id === item.productId);
                                    const cgst = prod?.cgst ?? 0;
                                    const sgst = prod?.sgst ?? 0;
                                    return sum + base + (base * (cgst + sgst) / 100);
                                  }
                                  return sum + base;
                                }, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {lineItemsError && (
                        <div className="flex items-center gap-1.5 p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-400 font-medium text-[11px] animate-fade-in shrink-0">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{lineItemsError}</span>
                        </div>
                      )}

                      {/* Compact add product form — shown on TOP of the grid */}
                      <div className="bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40 space-y-3 shrink-0 shadow-sm animate-fade-in">
                        <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider block">Add New Product</span>
                        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-end">
                          <div className="space-y-1 flex-1 min-w-[140px]">
                            <label className={`text-[10px] font-bold uppercase ${catError ? "text-red-500 dark:text-red-400" : "text-slate-500"}`}>Category *</label>
                            <SearchableSelect
                              value={formCategory}
                              onChange={(newCat) => {
                                setFormCategory(newCat);
                                setFormProduct("");
                                setFormProductSearch("");
                                setFormPrice("");
                                setBookingError("");
                              }}
                              options={[
                                { value: "", label: "Please select the category" },
                                ...categories.filter(c => c.status === "Active").map((c) => ({ value: c.id, label: c.name }))
                              ]}
                              placeholder="Please select the category"
                              className="w-full text-xs font-semibold"
                              hasError={!!catError}
                            />
                            {catError && (
                              <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{catError}</p>
                            )}
                          </div>

                          <div className="space-y-1 flex-[1.5] min-w-[180px] relative">
                            <label className={`text-[10px] font-bold uppercase ${productError ? "text-red-500 dark:text-red-400" : "text-slate-500"}`}>Product *</label>
                            <div className="relative">
                              <input
                                type="text"
                                disabled={!formCategory}
                                placeholder={formCategory ? "Type to search product..." : "Select category first..."}
                                value={formProductSearch}
                                onChange={(e) => {
                                  setFormProductSearch(e.target.value);
                                  setShowProductDropdown(true);
                                  setBookingError("");
                                }}
                                onFocus={() => {
                                  if (formCategory) setShowProductDropdown(true);
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setShowProductDropdown(false);
                                    const prod = products.find(p => p.id === formProduct);
                                    setFormProductSearch(prod ? prod.name : "");
                                  }, 200);
                                }}
                                className={`input-base pr-8 py-1.5 font-semibold text-[11px] h-9 ${!formCategory ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-60' : ''} ${productError ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" : ""}`}
                              />
                              {(formProduct || formProductSearch) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormProduct("");
                                    setFormProductSearch("");
                                    setFormPrice("");
                                    setBookingError("");
                                  }}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {showProductDropdown && formCategory && (
                                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50 animate-fade-in">
                                  {products
                                    .filter(p => p.status === "Active" && p.categoryId === formCategory && (
                                      p.name.toLowerCase().includes(formProductSearch.toLowerCase())
                                    ))
                                    .map((p) => {
                                      const isAlreadyAdded = lineItems.some(item => item.productId === p.id);
                                      return (
                                        <button
                                          key={p.id}
                                          type="button"
                                          disabled={isAlreadyAdded}
                                          onMouseDown={() => {
                                            if (isAlreadyAdded) return;
                                            setFormProduct(p.id);
                                            setFormProductSearch(p.name);
                                            setFormPrice(p.price.toString());
                                            setShowProductDropdown(false);
                                            setBookingError("");
                                          }}
                                          className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold flex justify-between items-center ${isAlreadyAdded
                                            ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800 text-slate-400"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                                            }`}
                                        >
                                          <div>
                                            <span className="font-semibold block">{p.name}</span>
                                            <span className="text-[9px] text-slate-400">Rate: ₹{p.price.toLocaleString("en-IN")}</span>
                                          </div>
                                          {isAlreadyAdded && (
                                            <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-650 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                                              Added
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })
                                  }
                                  {products.filter(p => p.status === "Active" && p.categoryId === formCategory && (
                                    p.name.toLowerCase().includes(formProductSearch.toLowerCase())
                                  )).length === 0 && (
                                      <div className="p-2 text-slate-400 text-center text-[10px]">No active products found</div>
                                    )}
                                </div>
                              )}
                            </div>
                            {productError && (
                              <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{productError}</p>
                            )}
                          </div>

                          <div className="space-y-1 w-20 shrink-0">
                            <label className={`text-[10px] font-bold uppercase ${qtyError ? "text-red-500 dark:text-red-400" : "text-slate-500"}`}>Qty *</label>
                            <input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={formQty}
                              onChange={(e) => {
                                setFormQty(e.target.value);
                                setBookingError("");
                              }}
                              className={`input-base py-1.5 text-[11px] h-9 ${qtyError ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" : ""}`}
                            />
                            {qtyError && (
                              <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{qtyError}</p>
                            )}
                          </div>

                          <div className="space-y-1 w-28 shrink-0">
                            <label className={`text-[10px] font-bold uppercase ${priceError ? "text-red-500 dark:text-red-400" : "text-slate-500"}`}>Rate *</label>
                            <input
                              type="number"
                              placeholder="Rate"
                              value={formPrice}
                              onChange={(e) => {
                                setFormPrice(e.target.value);
                                setBookingError("");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleFormAddItem();
                                }
                              }}
                              className={`input-base py-1.5 text-[11px] h-9 ${priceError ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" : ""}`}
                            />
                            {priceError && (
                              <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{priceError}</p>
                            )}
                          </div>

                          <div className="pb-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={handleFormAddItem}
                              className="h-9 w-9 bg-primary hover:brightness-110 text-primary-foreground rounded-lg flex items-center justify-center shadow-sm font-extrabold text-lg transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95 duration-150"
                              title="Add product to list"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Read-only list table of added products */}
                      <div className="flex-grow overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/40 min-h-[220px]">
                        {lineItems.length === 0 ? (
                          <div className="p-12 text-center text-slate-400 italic flex flex-col items-center justify-center gap-2 h-full">
                            <Package className="h-8 w-8 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                            <span>No products added yet. Use the product entry form above to add items.</span>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                                <th className="p-3">Category</th>
                                <th className="p-3">Product</th>
                                <th className="p-3 text-right">Qty</th>
                                <th className="p-3 text-right">Rate</th>
                                {orderType === "Invoice" && (
                                  <>
                                    <th className="p-3 text-right">CGST</th>
                                    <th className="p-3 text-right">SGST</th>
                                  </>
                                )}
                                <th className="p-3 text-right">Total</th>
                                <th className="p-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {lineItems.map((item, idx) => {
                                const prod = products.find(p => p.id === item.productId);
                                const cat = categories.find(c => c.id === item.categoryId);
                                const originalPrice = prod ? prod.price : 0;
                                const isOverride = !!item.productId && originalPrice !== parseFloat(item.unitPrice);

                                return (
                                  <Fragment key={idx}>
                                    <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                                      <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{cat?.name || "—"}</td>
                                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                        {prod ? prod.name : "—"}
                                      </td>
                                      <td className="p-3 text-right font-semibold font-mono">{item.qtyOrdered}</td>
                                      <td className="p-3 text-right font-semibold font-mono">
                                        ₹{parseFloat(item.unitPrice).toLocaleString("en-IN")}
                                      </td>
                                      {orderType === "Invoice" && (
                                        <>
                                          <td className="p-3 text-right font-semibold font-mono text-slate-650 dark:text-slate-400 whitespace-nowrap">
                                            ₹{(((parseFloat(item.qtyOrdered) || 0) * (parseFloat(item.unitPrice) || 0)) * ((prod?.cgst ?? 0) / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <span className="text-[10px] text-slate-400 font-normal ml-1">({prod?.cgst ?? 0}%)</span>
                                          </td>
                                          <td className="p-3 text-right font-semibold font-mono text-slate-650 dark:text-slate-400 whitespace-nowrap">
                                            ₹{(((parseFloat(item.qtyOrdered) || 0) * (parseFloat(item.unitPrice) || 0)) * ((prod?.sgst ?? 0) / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <span className="text-[10px] text-slate-400 font-normal ml-1">({prod?.sgst ?? 0}%)</span>
                                          </td>
                                        </>
                                      )}
                                      <td className="p-3 text-right font-bold font-mono">
                                        ₹{(() => {
                                          const base = (parseFloat(item.qtyOrdered) || 0) * (parseFloat(item.unitPrice) || 0);
                                          if (orderType === "Invoice") {
                                            const cgstVal = base * ((prod?.cgst ?? 0) / 100);
                                            const sgstVal = base * ((prod?.sgst ?? 0) / 100);
                                            return (base + cgstVal + sgstVal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                          }
                                          return base.toLocaleString("en-IN");
                                        })()}
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveLine(idx)}
                                          className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                          title="Remove"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  </Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions footer bar */}
              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => setIsBookingOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                >
                  {!submitting && <Check className="h-4 w-4 mr-1.5" />}
                  <span>{submitting ? "Booking..." : "Book Order"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isPartyModalOpen && (
        <PartyFormModal
          isOpen={isPartyModalOpen}
          onClose={() => setIsPartyModalOpen(false)}
          onSuccess={async (newParty) => {
            const updatedList = await fetchParties();
            const matchedParty = updatedList.find(
              (p: any) => p.name.toLowerCase() === newParty.partyName.toLowerCase()
            ) || updatedList.find(
              (p: any) => p.mobile === newParty.primaryMobile
            );

            if (matchedParty) {
              setSelectedPartyId(matchedParty.id);
              setPartySearchTerm(matchedParty.name);
            } else {
              setSelectedPartyId(String(newParty.partyId));
              setPartySearchTerm(newParty.partyName);
            }
            toast.success(`Party "${newParty.partyName}" registered and selected!`);
          }}
        />
      )}
    </div>
  );
}
