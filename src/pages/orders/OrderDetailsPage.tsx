import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  ArrowLeft, Calendar, ShieldAlert, Truck, Eye, FileText, CheckCircle,
  Clock, AlertTriangle, X, Printer, Share2, DollarSign, User, MapPin,
  Info, Sparkles, Building, AlertCircle, RefreshCcw, Activity, HardHat,
  ArrowUpRight, Landmark, CreditCard, ExternalLink, SlidersHorizontal, Trash2, Plus, Edit, Package, Loader2,
  ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { PageHeader, Loader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { formatDate, numberToWordsINR } from "@/lib/utils";
import { orderService, partyService, productService, categoryService } from "@/services";
import { OrderPrintDocument } from "@/components/ui/print-templates";

export default function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Local state for API elements
  const [order, setOrder] = useState<any | null>(null);
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [challansList, setChallansList] = useState<any[]>([]);
  const [submittingChallan, setSubmittingChallan] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  const toggleProductExpand = (id: string) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Fetch callbacks
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
          categoryId: p.categoryId.toString(),
          price: p.price,
          specifications: p.specification,
          description: p.description || p.discription || "",
          status: p.status,
          cgst: p.cgst,
          sgst: p.sgst,
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
      }
    } catch (err) {
      console.error("Failed to fetch parties:", err);
    }
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const response = await orderService.getOrderById(parseInt(orderId));
      if (response.data.responseStatus === "Success" && response.data.data) {
        const o = response.data.data;
        const orderIdVal = o.orderID !== undefined ? o.orderID : o.orderId;
        const items = (o.orderDetails || []).map((d: any) => {
          const detailIdVal = d.orderDetailID !== undefined ? d.orderDetailID : d.orderDetailId;
          const qtyDelivered = d.deliveryQty !== undefined ? d.deliveryQty : (d.deliveredQty ?? 0);
          const remainingQty = d.remainingQty !== undefined ? d.remainingQty : (d.qty - qtyDelivered);
          return {
            id: detailIdVal.toString(),
            productId: d.productId.toString(),
            productName: d.productName,
            categoryName: d.categoryName,
            qtyOrdered: d.qty,
            qtyDelivered,
            remainingQty,
            cgst: d.cgst ?? 0,
            sgst: d.sgst ?? 0,
            unitPrice: d.rate,
          };
        });

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

        const mappedOrder = {
          ...o,
          id: orderIdVal.toString(),
          orderNumber: `ORD-${orderIdVal}`,
          orderDate: o.orderDate ? o.orderDate.split("T")[0] : "",
          deliveryDate: o.expectedDeliveryDate ? o.expectedDeliveryDate.split("T")[0] : "",
          partyId: o.partyId.toString(),
          status: derivedStatus,
          notes: o.remark || "",
          advanceAmount: o.advanceAmount ?? 0,
          items,
        };
        setOrder(mappedOrder);
      } else {
        setOrder(null);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const fetchChallans = useCallback(async () => {
    if (!orderId) return;
    try {
      const response = await orderService.getAllDeliveryChallans(parseInt(orderId));
      if (response.data.responseStatus === "Success" && response.data.data) {
        const filtered = response.data.data.filter((c: any) => {
          const ordIdVal = c.orderID !== undefined ? c.orderID : c.orderId;
          return ordIdVal === parseInt(orderId);
        });
        const mapped = filtered.map((c: any) => {
          const chalIdVal = c.challanID !== undefined ? c.challanID : c.challanId;
          const ordIdVal = c.orderID !== undefined ? c.orderID : c.orderId;
          return {
            ...c,
            id: chalIdVal ? chalIdVal.toString() : "",
            challanNumber: `CHN-${chalIdVal}`,
            challanDate: c.challanDate ? c.challanDate.split("T")[0] : "",
            orderId: ordIdVal ? ordIdVal.toString() : "",
            remarks: c.remark || "",
            deliveryMode: c.deliveryMode || "Company Transport",
            items: (c.deliveryChallanDetails || []).map((d: any) => ({
              productId: (d.productId !== undefined ? d.productId : d.productID)?.toString() || "",
              qtyDelivered: d.qty,
            })),
          };
        });
        setChallansList(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch challans:", err);
    }
  }, [orderId]);

  const [fetchingChallanDetails, setFetchingChallanDetails] = useState<string | null>(null);

  const handleViewPrintChallan = async (challanId: string) => {
    setFetchingChallanDetails(challanId);
    try {
      const response = await orderService.getDeliveryChallanById(parseInt(challanId));
      if (response.data.responseStatus === "Success" && response.data.data) {
        const c = response.data.data;
        const chalIdVal = c.challanID !== undefined ? c.challanID : c.challanId;
        const ordIdVal = c.orderID !== undefined ? c.orderID : c.orderId;
        const mapped = {
          ...c,
          id: chalIdVal ? chalIdVal.toString() : "",
          challanNumber: `CHN-${chalIdVal}`,
          challanDate: c.challanDate ? c.challanDate.split("T")[0] : "",
          orderId: ordIdVal ? ordIdVal.toString() : "",
          remarks: c.remark || "",
          deliveryMode: c.deliveryMode || "Company Transport",
          items: (c.deliveryChallanDetails || []).map((d: any) => ({
            productId: (d.productId !== undefined ? d.productId : d.productID)?.toString() || "",
            qtyDelivered: d.qty,
          })),
        };
        setViewingPrintChallan(mapped);
      } else {
        toast.error(response.data.message || "Failed to fetch challan details");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch challan details");
    } finally {
      setFetchingChallanDetails(null);
    }
  };

  const handlePrintChallan = () => {
    if (!viewingPrintChallan) return;
    const originalTitle = document.title;
    document.title = `Challan_${viewingPrintChallan.challanNumber || viewingPrintChallan.id}`;
    window.print();
    document.title = originalTitle;
  };

  // Load resources on mount
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchParties();
  }, [fetchCategories, fetchProducts, fetchParties]);

  // Load/reload order details
  useEffect(() => {
    fetchOrderDetails();
    fetchChallans();
  }, [fetchOrderDetails, fetchChallans]);

  // Find party based on local state lookup
  const party = order ? parties.find((p) => p.id === order.partyId) : null;

  // Challan Form state
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"" | "Company Transport" | "Self-Pickup" | "Third-Party Logistics">("");
  const [challanItems, setChallanItems] = useState<{ productId: string; qtyDelivering: string; pendingQty: number; selected?: boolean }[]>([]);
  const [challanError, setChallanError] = useState("");

  // Printable Challan Modal state
  const [viewingPrintChallan, setViewingPrintChallan] = useState<any | null>(null);

  // Printable Order Modal state (Estimate / Invoice)
  const [viewingPrintOrder, setViewingPrintOrder] = useState<any | null>(null);

  // Challan Form Modal state
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);

  // Cancel Remaining Items directly
  const handleCancelRemaining = (productId: string) => {
    if (!order) return;
    const item = order.items.find((i: any) => i.productId === productId);
    if (!item) return;

    const pendingQty = item.remainingQty !== undefined ? item.remainingQty : (item.qtyOrdered - item.qtyDelivered);
    if (pendingQty <= 0) return;

    const prod = products.find((p) => p.id === productId);

    if (item.qtyDelivered === 0) {
      // 0 Qty delivered: Delete product from order entirely
      Swal.fire({
        title: "Remove Product from Order?",
        text: `Are you sure you want to delete '${item.productName || prod?.name || productId}' from this order?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "hsl(var(--destructive))",
        cancelButtonColor: "hsl(var(--muted-foreground))",
        confirmButtonText: "Yes, Delete Product"
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;
            const response = await orderService.deleteOrderDetail({
              orderDetailID: parseInt(item.id),
              orderID: parseInt(order.id),
              userId: userIdNum
            });
            if (response.data.responseStatus === "Success") {
              const remainingItems = order.items.filter((i: any) => i.productId !== productId);
              
              // Calculate new status
              let nextStatus = order.status;
              if (remainingItems.length === 0) {
                nextStatus = "Cancelled";
              } else {
                const allDelivered = remainingItems.every((item: any) => item.qtyDelivered >= item.qtyOrdered);
                if (allDelivered) {
                  nextStatus = "Delivered";
                } else {
                  const someDelivered = remainingItems.some((item: any) => item.qtyDelivered > 0);
                  nextStatus = someDelivered ? "Partially Delivered" : "Confirmed";
                }
              }

              try {
                await orderService.updateOrderStatus(parseInt(order.id), nextStatus, userIdNum);
              } catch (statusErr) {
                console.error("Failed to update order status in API:", statusErr);
              }

              toast.success("Product removed from order successfully!");
              fetchOrderDetails();
            } else {
              toast.error(response.data.message || "Failed to remove product from order");
            }
          } catch (err: any) {
            toast.error(err.message || "Failed to remove product from order");
          }
        }
      });
    } else {
      // Partially delivered: Cancel remaining quantity
      Swal.fire({
        title: "Cancel Remaining Quantity?",
        text: `Are you sure you want to cancel the remaining ${pendingQty} Qty of '${item.productName || prod?.name || productId}'? The quantity booked will be reduced from ${item.qtyOrdered} to ${item.qtyDelivered}.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "hsl(var(--destructive))",
        cancelButtonColor: "hsl(var(--muted-foreground))",
        confirmButtonText: "Yes, Cancel Remaining"
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;
            const detailPayload = {
              orderDetailId: parseInt(item.id),
              orderId: parseInt(order.id),
              productId: parseInt(item.productId),
              qty: item.qtyDelivered, // New qty is set to the delivered qty
              rate: item.unitPrice,
              amount: item.qtyDelivered * item.unitPrice,
              userId: userIdNum
            };

            const response = await orderService.updateOrderDetail(detailPayload);
            if (response.data.responseStatus === "Success") {
              // Recalculate status based on new ordered quantities
              const newStatusItems = order.items.map((i: any) => {
                const isCancelledItem = i.productId === productId;
                const itemQtyOrdered = isCancelledItem ? i.qtyDelivered : i.qtyOrdered;
                return {
                  ...i,
                  qtyOrdered: itemQtyOrdered,
                };
              });

              const allDelivered = newStatusItems.length > 0 && newStatusItems.every((item: any) => item.qtyDelivered >= item.qtyOrdered);
              let nextStatus = order.status;
              if (newStatusItems.reduce((sum: number, item: any) => sum + item.qtyOrdered, 0) === 0) {
                nextStatus = "Cancelled";
              } else if (allDelivered) {
                nextStatus = "Delivered";
              } else {
                const someDelivered = newStatusItems.some((item: any) => item.qtyDelivered > 0);
                nextStatus = someDelivered ? "Partially Delivered" : "Confirmed";
              }

              try {
                await orderService.updateOrderStatus(parseInt(order.id), nextStatus, userIdNum);
              } catch (statusErr) {
                console.error("Failed to update order status in API:", statusErr);
              }

              toast.success("Remaining quantity cancelled successfully!");
              fetchOrderDetails();
            } else {
              toast.error(response.data.message || "Failed to cancel remaining items");
            }
          } catch (err: any) {
            toast.error(err.message || "Failed to cancel remaining items");
          }
        }
      });
    }
  };

  // Auto-fill/reset challan items
  const initializeChallanForm = () => {
    if (!order) return;
    const items = order.items
      .map((item: any) => {
        const pending = item.qtyOrdered - item.qtyDelivered;
        return {
          productId: item.productId,
          qtyDelivering: pending.toString(),
          pendingQty: pending,
          selected: pending > 0,
        };
      })
      .filter((i: any) => i.pendingQty > 0);
    setChallanItems(items);
    setChallanError("");
  };

  // Initialize on mount/order update
  useEffect(() => {
    if (order) {
      initializeChallanForm();
    }
  }, [orderId, order]);

  // fallback if loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <Loader fullScreen={false} text="Loading order details..." />
      </div>
    );
  }

  // fallback if order doesn't exist
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 shadow-lg border border-red-100 dark:border-red-900/30 animate-pulse">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Order Booking Record Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested order ID does not exist in the ERP system or has been archived from active operations.
        </p>
        <Button onClick={() => navigate("/orders")} className="h-9">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Return to Order Booking</span>
        </Button>
      </div>
    );
  }

  // Outstanding lookup removed mock data lookup

  // Calculations
  const subtotal = order.items.reduce((sum: number, item: any) => {
    const base = item.qtyOrdered * item.unitPrice;
    if (order.orderType === "Invoice") {
      const cgst = item.cgst ?? 0;
      const sgst = item.sgst ?? 0;
      return sum + base + (base * (cgst + sgst) / 100);
    }
    return sum + base;
  }, 0);
  const totalDelivered = order.items.reduce((sum: number, item: any) => sum + item.qtyDelivered, 0);
  const totalOrdered = order.items.reduce((sum: number, item: any) => sum + item.qtyOrdered, 0);
  const fulfillmentPct = Math.round((totalDelivered / totalOrdered) * 100) || 0;


  // Delivery Urgency helper
  const getDeliveryUrgency = (dateStr: string, status: string) => {
    if (status === "Delivered" || status === "Cancelled") return "neutral";
    const today = new Date().toISOString().split("T")[0];
    if (dateStr < today) return "overdue";
    if (dateStr === today) return "due-today";
    return "upcoming";
  };

  const urgency = getDeliveryUrgency(order.deliveryDate, order.status);
  const orderChallans = challansList;

  // Handle Dispatch Challan Submit
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmittingChallan(true);
    setChallanError("");

    if (!deliveryMode) {
      setSubmittingChallan(false);
      return setChallanError("Delivery mode is required");
    }

    try {
      const itemsToSubmit = challanItems
        .filter((item) => item.selected)
        .map((item) => {
          const qty = parseFloat(item.qtyDelivering) || 0;
          if (qty <= 0) {
            throw new Error("Quantity must be greater than 0 for selected items.");
          }
          if (qty > item.pendingQty) {
            throw new Error(
              `Fulfillment quantity error: Cannot dispatch ${qty} Qty of product. Maximum pending is ${item.pendingQty} Qty.`
            );
          }
          return {
            productId: item.productId,
            qtyDelivered: qty,
          };
        });

      if (itemsToSubmit.length === 0) {
        setSubmittingChallan(false);
        return setChallanError("Please select at least one product with valid quantity to dispatch");
      }

      const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;

      const challanPayload = {
        orderId: parseInt(order.id),
        challanDate: new Date(challanDate + "T12:00:00").toISOString(),
        deliveryMode,
        remark: remarks.trim(),
        userId: userIdNum,
        deliveryChallanDetails: itemsToSubmit.map((item) => ({
          challanDetailId: 0,
          challanId: 0,
          productId: parseInt(item.productId),
          qty: item.qtyDelivered,
          userId: userIdNum,
        })),
      };

      const response = await orderService.saveDeliveryChallan(challanPayload);
      if (response.data.responseStatus === "Success") {
        // Recalculate status based on current delivered quantity + newly dispatched quantity
        const updatedItems = order.items.map((item: any) => {
          const dispatched = itemsToSubmit.find((i) => i.productId === item.productId);
          const newDelivered = item.qtyDelivered + (dispatched ? dispatched.qtyDelivered : 0);
          return {
            ...item,
            qtyDelivered: newDelivered,
          };
        });

        const allDelivered = updatedItems.length > 0 && updatedItems.every((item: any) => item.qtyDelivered >= item.qtyOrdered);
        const nextStatus = allDelivered ? "Delivered" : "Partially Delivered";

        const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;
        try {
          await orderService.updateOrderStatus(parseInt(order.id), nextStatus, userIdNum);
        } catch (statusErr) {
          console.error("Failed to update order status in API:", statusErr);
        }

        toast.success("Delivery Challan issued successfully!");
        setRemarks("");
        setDeliveryMode("");
        setChallanError("");
        setIsChallanModalOpen(false);
        // Refresh details and challan list from backend
        fetchOrderDetails();
        fetchChallans();
      } else {
        setChallanError(response.data.message || "Failed to create Delivery Challan");
      }
    } catch (err: any) {
      setChallanError(err.message || "Failed to create Delivery Challan");
    } finally {
      setSubmittingChallan(false);
    }
  };

  // Cancel order (Admin only)
  const handleCancel = () => {
    if (user?.role !== "Admin") {
      toast.error("Access Denied: Only Administrator accounts can cancel orders");
      return;
    }

    const userIdNum = user?.id ? (parseInt(user.id.replace("usr-", ""), 10) || 1) : 1;

    Swal.fire({
      title: "Cancel Order?",
      text: `Are you sure you want to cancel ${order.orderNumber}? Outstanding ledger invoice values will be reversed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "hsl(var(--destructive))",
      cancelButtonColor: "hsl(var(--muted-foreground))",
      confirmButtonText: "Yes, Cancel Order"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await orderService.updateOrderStatus(parseInt(order.id), "Cancelled", userIdNum);
          if (response.data.responseStatus === "Success") {
            toast.success("Order cancelled successfully");
            fetchOrderDetails();
          } else {
            toast.error(response.data.message || "Failed to cancel order");
          }
        } catch (err: any) {
          console.error("Failed to cancel order:", err);
          toast.error(err.message || "Failed to cancel order");
        }
      }
    });
  };

  const hasInvalidItem = challanItems.some((i) => {
    if (!i.selected) return false;
    const qtyStr = i.qtyDelivering.trim();
    if (qtyStr === "") return true;
    const qtyVal = parseFloat(qtyStr);
    return isNaN(qtyVal) || qtyVal <= 0 || qtyVal > i.pendingQty;
  });
  const totalQtyToDeliver = challanItems.reduce((sum, i) => sum + (i.selected ? (parseFloat(i.qtyDelivering) || 0) : 0), 0);
  const isSubmitDisabled = hasInvalidItem || totalQtyToDeliver <= 0 || !challanItems.some((i) => i.selected) || !deliveryMode;

  return (
    <div className="space-y-6 text-xs animate-fade-in font-sans">
      <PageHeader
        title={`Order Details: ${order.orderNumber}`}
        description={`Fulfillment & partial dispatch logs for order ${order.orderNumber}.`}
        backUrl="/orders"
      />

      {/* Operational Header & Customer Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-xl shadow-sm space-y-4">

        {/* Top Status & Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hidden xs:inline">Order Booking Status</span>
              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 xs:hidden">Status</span>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/40 dark:border-slate-700/40">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${order.status === "Cancelled" ? "bg-red-400" : order.status === "Delivered" ? "bg-emerald-400" : "bg-sky-400"
                    }`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${order.status === "Cancelled" ? "bg-red-500" : order.status === "Delivered" ? "bg-emerald-500" : "bg-sky-500"
                    }`} />
                </span>
                <span className="font-bold text-[9px] uppercase tracking-wider text-slate-750 dark:text-slate-350">{order.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {order.status === "Confirmed" && user?.role === "Admin" && (
              <Button
                onClick={handleCancel}
                variant="destructive"
                className="h-9 px-3 sm:px-4 font-bold flex items-center justify-center gap-1.5"
                title="Cancel Order Booking"
              >
                <span>Cancel<span className="hidden sm:inline"> Order Booking</span></span>
                <X className="h-4 w-4 shrink-0" />
              </Button>
            )}
            {order.status !== "Cancelled" && (
              <Button
                onClick={() => setViewingPrintOrder(order)}
                variant="secondary"
                className="h-9 w-9 sm:w-auto sm:px-4 font-bold flex items-center justify-center gap-1.5"
                title={`Print ${order.orderType === "Invoice" ? "Tax Invoice" : "Estimate"}`}
              >
                <Printer className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Print {order.orderType === "Invoice" ? "Tax Invoice" : "Estimate"}</span>
              </Button>
            )}
          </div>
        </div>

        <hr className="border-slate-150 dark:border-slate-800/80" />

        {/* Customer & Order Details grid (responsive 2-columns on mobile, 6 columns on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-5 text-xs pt-1">

          {/* Column 1: Customer Detail */}
          {party && (
            <div className="flex items-start gap-2.5 col-span-2 sm:col-span-1">
              <Building className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Party</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs mt-0.5">{party.name}</span>
                <span className="text-[9px] font-bold text-slate-450 uppercase block mt-0.5">{party.type}</span>
              </div>
            </div>
          )}

          {/* Column 2: Contact Person & Number */}
          {party && (
            <div className="flex items-start gap-2.5 col-span-2 sm:col-span-1">
              <User className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Contact Person</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs mt-0.5">{party.contactPerson}</span>
                <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap">
                  <a href={`tel:${party.mobile}`} className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold text-[11px]">{party.mobile}</a>
                  {party.whatsapp && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <a
                        href={`https://wa.me/91${party.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-mono font-bold"
                        title="Direct message WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#25D366" d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24z" />
                          <path fill="white" d="M15.782 13.002c-.229-.115-1.353-.667-1.561-.742-.208-.075-.359-.112-.51.115-.15.227-.584.74-.716.89-.13.152-.262.17-.491.056-.23-.114-.969-.357-1.846-1.14-.683-.609-1.144-1.36-1.278-1.587-.133-.227-.013-.35.101-.463.103-.102.228-.266.343-.399.114-.132.15-.227.228-.378.077-.152.039-.285-.02-.399-.058-.114-.51-1.229-.699-1.684-.183-.442-.369-.381-.51-.388-.13-.007-.28-.008-.43-.008-.15 0-.395.056-.602.28-.208.227-.792.775-.792 1.89s.81 2.19.923 2.34c.113.15 1.59 2.429 3.853 3.407.538.232.958.371 1.286.475.54.171 1.03.147 1.418.089.432-.064 1.353-.553 1.542-1.087.19-.533.19-.99.133-1.087-.058-.097-.208-.152-.437-.267z" />
                        </svg>
                        <span className="text-[11px]">{party.whatsapp}</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Column 3: Order Type */}
          <div className="flex items-start gap-2.5 col-span-1">
            <FileText className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Order Type</span>
              <span className={`badge mt-1 font-bold ${order.orderType === "Invoice" ? "badge-info" : "badge-neutral"}`}>
                {order.orderType || "Estimate"}
              </span>
            </div>
          </div>

          {/* Column 4: Total Booking Value */}
          <div className="flex items-start gap-2.5 col-span-1">
            <DollarSign className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Booking Amount</span>
              <span className="font-extrabold text-slate-900 dark:text-slate-105 block mt-1 text-sm">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Column 5: Booking Date */}
          <div className="flex items-start gap-2.5 col-span-1">
            <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Booking Date</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-1 text-xs">{formatDate(order.orderDate)}</span>
            </div>
          </div>

          {/* Column 6: Expected Delivery */}
          <div className="flex items-start gap-2.5 col-span-1">
            <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Expected Delivery</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-1 text-xs">{formatDate(order.deliveryDate)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Details, Items, and Challan Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 2): Specs Cards + Line Items List + Dispatch Portal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Line Items Sheet */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                <h3 className="font-extrabold text-xs text-slate-905 dark:text-slate-150 uppercase tracking-wider">
                  Order Products List
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] sm:text-[10px] text-slate-450 font-bold">
                <span>{order.items.length} Product(s)</span>
              </div>
            </div>            {/* Desktop Grid/Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <DataTable
                headers={[
                  "Category",
                  "Product Name",
                  "Qty Booked",
                  "Delivered",
                  "Remaining",
                  "Rate",
                  ...(order.orderType === "Invoice" ? ["CGST", "SGST"] : []),
                  "Total Amount",
                  ...(order.status !== "Cancelled" && order.status !== "Delivered" ? ["Actions"] : [])
                ]}
                headerClassNames={[
                  "",
                  "",
                  "text-right",
                  "text-right",
                  "text-right",
                  "text-right",
                  ...(order.orderType === "Invoice" ? ["text-right", "text-right"] : []),
                  "text-right",
                  ...(order.status !== "Cancelled" && order.status !== "Delivered" ? ["text-center"] : [])
                ]}
                theadClassName="text-[9px]"
              >
                {order.items.map((item: any) => {
                  const prod = products.find((p) => p.id === item.productId);
                  const cat = prod ? categories.find((c) => c.id === prod.categoryId) : null;
                  const pendingQty = item.remainingQty !== undefined ? item.remainingQty : (item.qtyOrdered - item.qtyDelivered);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                          {item.categoryName || cat?.name || "Steel Category"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-850 dark:text-slate-200 block text-xs">{item.productName || prod?.name}</span>
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                        {item.qtyOrdered}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50/20 dark:bg-emerald-950/5">
                        {item.qtyDelivered}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-xs">
                        <span className={pendingQty > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}>
                          {pendingQty}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex flex-col items-end gap-0.5 font-mono">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{item.unitPrice.toLocaleString("en-IN")}</span>
                        </div>
                      </td>
                      {order.orderType === "Invoice" && (
                        <>
                          <td className="p-3.5 text-right font-semibold font-mono text-slate-650 dark:text-slate-400 whitespace-nowrap">
                            ₹{((item.qtyOrdered * item.unitPrice) * ((item.cgst ?? 0) / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-[10px] text-slate-450 font-normal ml-1">({item.cgst ?? 0}%)</span>
                          </td>
                          <td className="p-3.5 text-right font-semibold font-mono text-slate-650 dark:text-slate-400 whitespace-nowrap">
                            ₹{((item.qtyOrdered * item.unitPrice) * ((item.sgst ?? 0) / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-[10px] text-slate-450 font-normal ml-1">({item.sgst ?? 0}%)</span>
                          </td>
                        </>
                      )}
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-slate-50 text-xs font-mono">
                        ₹{(() => {
                          const base = item.qtyOrdered * item.unitPrice;
                          if (order.orderType === "Invoice") {
                            const cgstVal = base * ((item.cgst ?? 0) / 100);
                            const sgstVal = base * ((item.sgst ?? 0) / 100);
                            return (base + cgstVal + sgstVal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          }
                          return base.toLocaleString("en-IN");
                        })()}
                      </td>
                      {order.status !== "Cancelled" && order.status !== "Delivered" && (
                        <td className="p-3.5 text-center">
                          {pendingQty > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleCancelRemaining(item.productId)}
                              className="px-2.5 py-1 text-[9px] bg-red-50 dark:bg-red-955/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-650 dark:text-red-400 rounded border border-red-200/50 dark:border-red-900/40 font-bold transition-all shadow-sm whitespace-nowrap hover:scale-[1.02]"
                            >
                              Cancel Remaining
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[9px] font-semibold">Fulfilled</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </DataTable>
            </div>

            {/* Mobile Cards View */}
            <div className="block sm:hidden divide-y divide-slate-150 dark:divide-slate-800">
              {order.items.map((item: any) => {
                const prod = products.find((p) => p.id === item.productId);
                const cat = prod ? categories.find((c) => c.id === prod.categoryId) : null;
                const pendingQty = item.remainingQty !== undefined ? item.remainingQty : (item.qtyOrdered - item.qtyDelivered);
                const isExpanded = !!expandedProducts[item.id];
                const isFulfilled = pendingQty <= 0;

                return (
                  <div key={item.id} className="bg-white dark:bg-slate-900 transition-all duration-250">
                    {/* Clickable Header */}
                    <button
                      type="button"
                      onClick={() => toggleProductExpand(item.id)}
                      className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 focus:outline-none transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-wider">
                            {item.categoryName || cat?.name || "Steel Category"}
                          </span>
                          {isFulfilled ? (
                            <span className="badge badge-success text-[8px] px-2 py-0.5 rounded-full font-bold">
                              Fulfilled
                            </span>
                          ) : item.qtyDelivered > 0 ? (
                            <span className="badge badge-info text-[8px] px-2 py-0.5 rounded-full font-bold">
                              {item.qtyDelivered}/{item.qtyOrdered} Shipped
                            </span>
                          ) : (
                            <span className="badge badge-warning text-[8px] px-2 py-0.5 rounded-full font-bold">
                              Pending
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-xs truncate">
                          {item.productName || prod?.name}
                        </h4>

                        {/* Summary of quantities in collapsed state */}
                        {!isExpanded && (
                          <div className="flex items-center gap-2 text-[9.5px] text-slate-400 font-medium font-mono mt-0.5">
                            <span>Booked: <strong>{item.qtyOrdered}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400">Delivered: <strong>{item.qtyDelivered}</strong></span>
                            <span>•</span>
                            <span className={pendingQty > 0 ? "text-amber-600 dark:text-amber-400" : ""}>
                              Pending: <strong>{pendingQty}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rate</span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs font-mono">
                            ₹{item.unitPrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4.5 w-4.5 text-slate-400 shrink-0 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0 transition-transform duration-200" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Details Area */}
                    {isExpanded && (
                      <div className="px-4 pb-4.5 pt-0.5 space-y-3 animate-fade-in border-t border-slate-100/50 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-950/5">

                        {/* Grid detail metrics */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800 text-center">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Booked Qty</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{item.qtyOrdered}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Delivered Qty</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{item.qtyDelivered}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Remaining Qty</span>
                            <span className={`font-extrabold text-xs ${pendingQty > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-450"}`}>
                              {pendingQty}
                            </span>
                          </div>
                        </div>

                        {/* GST Breakdown (Invoices) */}
                        {order.orderType === "Invoice" && (
                          <div className="bg-slate-50/40 dark:bg-slate-950/20 rounded-lg p-2.5 border border-slate-150/50 dark:border-slate-800/40 text-[10px] text-slate-550 font-semibold font-mono space-y-1">
                            <div className="flex justify-between items-center">
                              <span>CGST ({item.cgst ?? 0}%):</span>
                              <span>₹{((item.qtyOrdered * item.unitPrice) * ((item.cgst ?? 0) / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>SGST ({item.sgst ?? 0}%):</span>
                              <span>₹{((item.qtyOrdered * item.unitPrice) * ((item.sgst ?? 0) / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        )}

                        {/* Total Amount */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-150/70 dark:border-slate-800/60">
                          <span className="text-slate-450 font-bold text-[9px] uppercase tracking-wider">Total Product Value</span>
                          <span className="font-black text-slate-900 dark:text-slate-50 text-xs font-mono">
                            ₹{(() => {
                              const base = item.qtyOrdered * item.unitPrice;
                              if (order.orderType === "Invoice") {
                                const cgstVal = base * ((item.cgst ?? 0) / 100);
                                const sgstVal = base * ((item.sgst ?? 0) / 100);
                                return (base + cgstVal + sgstVal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              }
                              return base.toLocaleString("en-IN");
                            })()}
                          </span>
                        </div>

                        {/* Action buttons */}
                        {order.status !== "Cancelled" && order.status !== "Delivered" && pendingQty > 0 && (
                          <div className="flex justify-end pt-2 border-t border-slate-150/70 dark:border-slate-800/60 mt-1">
                            <button
                              type="button"
                              onClick={() => handleCancelRemaining(item.productId)}
                              className="w-full text-center py-2 text-[10px] bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-900/30 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/40 font-extrabold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Cancel Remaining Quantity ({pendingQty} Qty)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right Column: Linked Challans Listing */}
        <div className="space-y-6 lg:sticky lg:top-6 self-start">

          {/* Linked shipment receipts history */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-150 uppercase tracking-wider">
                  Delivery Challan Receipts
                </h3>
              </div>
              {order.status !== "Cancelled" && order.status !== "Delivered" && (
                <Button
                  onClick={() => {
                    initializeChallanForm();
                    setIsChallanModalOpen(true);
                  }}
                  size="sm"
                  className="shrink-0"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <span>Create Challan</span>
                </Button>
              )}
            </div>
            {orderChallans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium">
                No delivery challan notes issued against this order booking yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                {orderChallans.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400/40 dark:hover:border-blue-500/40 transition-all shadow-sm hover:scale-[1.01]"
                  >
                    <div className="flex flex-col gap-1 pr-2">
                      <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-[11px]">
                        {ch.challanNumber}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>Issued: {formatDate(ch.challanDate)}</span>
                      </span>
                      {ch.items && ch.items.length > 0 && (
                        <div className="mt-1 space-y-0.5 pl-1.5 border-l border-slate-300 dark:border-slate-700">
                          {ch.items.map((item: any, iidx: number) => {
                            const orderItem = order?.items.find((oi: any) => oi.productId === item.productId);
                            const prodName = orderItem?.productName || products.find(p => p.id === item.productId)?.name || item.productId;
                            return (
                              <span key={iidx} className="block text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                • {prodName}: {item.qtyDelivered} Qty
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {ch.remarks && (
                        <span className="text-[9px] text-slate-450 dark:text-slate-550 italic mt-0.5">
                          Note: {ch.remarks}
                        </span>
                      )}
                    </div>
                    <button
                      disabled={fetchingChallanDetails === ch.id}
                      onClick={() => handleViewPrintChallan(ch.id)}
                      className="p-1.5 px-3 text-blue-600 bg-blue-600/10 hover:bg-blue-600 dark:text-blue-450 dark:hover:text-white dark:bg-blue-900/25 dark:hover:bg-blue-600 hover:text-white rounded-lg transition-all inline-flex items-center gap-1 font-bold text-[10px] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Print Challan Slip"
                    >
                      {fetchingChallanDetails === ch.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Printer className="h-3.5 w-3.5" />
                          <span>Print</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Delivery Challan Modal */}
      {isChallanModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Generate Delivery Challan Slip
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChallanModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                {challanError && (
                  <div className="flex items-center gap-1.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 font-bold border border-red-200/50 dark:border-red-900/30">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                    <span>{challanError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Dispatch Date *"
                    type="date"
                    value={challanDate}
                    onChange={(e) => setChallanDate(e.target.value)}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">Delivery Mode *</label>
                    <SearchableSelect
                      value={deliveryMode}
                      onChange={(val) => setDeliveryMode(val as any)}
                      options={[
                        { value: "", label: "Please select delivery mode" },
                        { value: "Company Transport", label: "Company Transport" },
                        { value: "Self-Pickup", label: "Self-Pickup" },
                        { value: "Third-Party Logistics", label: "Third-Party Logistics" },
                      ]}
                      placeholder="Please select delivery mode"
                      className="w-full text-xs font-semibold"
                    />
                  </div>
                </div>

                <Input
                  label="Remarks / Route Directives"
                  type="text"
                  placeholder="Loaded Shift-A, high density batch"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />

                {/* Dispatch load details */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden mt-3 shadow-sm bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="bg-slate-100/80 dark:bg-slate-900/60 p-2.5 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-650 dark:text-slate-355 uppercase tracking-wider text-[9px] flex items-center justify-between">
                    <span>Configure Shipment Quantities</span>

                  </div>
                  {challanItems.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 font-semibold bg-white dark:bg-slate-900">
                      No outstanding items remaining to be dispatched on this booking.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-900 max-h-[200px] overflow-y-auto pr-1">
                      {challanItems.map((item, idx) => {
                        const prod = products.find((p) => p.id === item.productId);
                        const orderItem = order?.items.find((oi: any) => oi.productId === item.productId);
                        const qtyVal = parseFloat(item.qtyDelivering) || 0;
                        const hasQtyError = item.selected && (qtyVal <= 0 || qtyVal > item.pendingQty || isNaN(qtyVal) || item.qtyDelivering.trim() === "");

                        return (
                          <div
                            key={item.productId}
                            className={`p-3 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/30 transition-colors ${!item.selected ? "opacity-60 bg-slate-50/50 dark:bg-slate-950/20" : "bg-white dark:bg-slate-900"
                              }`}
                          >
                            <div className="col-span-1 flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={!!item.selected}
                                onChange={(e) => {
                                  const newItems = [...challanItems];
                                  newItems[idx].selected = e.target.checked;
                                  setChallanItems(newItems);
                                }}
                                className="h-4.5 w-4.5 rounded border-slate-350 dark:border-slate-700 text-blue-650 focus:ring-blue-500 cursor-pointer"
                              />
                            </div>

                            <div className="col-span-7">
                              <span className="font-extrabold text-slate-850 dark:text-slate-200 block text-xs">{orderItem?.productName || prod?.name}</span>
                              <span className="text-slate-450 block text-xs">
                                Remaining Qty:{" "}
                                <strong className="text-slate-800 dark:text-slate-250 bg-slate-100 dark:bg-slate-850 px-1 py-0.2 rounded">
                                  {item.pendingQty}
                                </strong>
                              </span>
                            </div>

                            <div className="col-span-4 space-y-1 relative">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={item.qtyDelivering}
                                  disabled={!item.selected}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*\.?\d*$/.test(val)) {
                                      const newItems = [...challanItems];
                                      newItems[idx].qtyDelivering = val;
                                      setChallanItems(newItems);
                                    }
                                  }}
                                  className={`input-base h-8.5 text-right font-extrabold text-xs w-full ${!item.selected
                                    ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed border-slate-200"
                                    : hasQtyError
                                      ? "border-red-500 text-red-650 bg-red-50/20 focus:border-red-500 animate-shake"
                                      : "border-slate-250 focus:border-blue-500"
                                    }`}
                                />
                                <span className="text-[10px] text-slate-400 font-extrabold shrink-0">Qty</span>
                              </div>
                              {item.selected && hasQtyError && (
                                <span className="text-[8.5px] text-red-650 dark:text-red-400 font-extrabold block text-right animate-fade-in">
                                  {parseFloat(item.qtyDelivering) > item.pendingQty
                                    ? `Cannot exceed ${item.pendingQty}`
                                    : (parseFloat(item.qtyDelivering) <= 0 || item.qtyDelivering.trim() === "")
                                      ? "Must be greater than 0"
                                      : "Invalid value"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submittingChallan}
                  onClick={() => setIsChallanModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitDisabled || submittingChallan}
                  loading={submittingChallan}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white"
                >
                  {!submittingChallan && <CheckCircle className="h-4 w-4 mr-1.5" />}
                  <span>{submittingChallan ? "Issuing..." : "Generate Dispatch Challan Note"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Styled Printable Challan Modal overlay */}
      {viewingPrintChallan && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in print:bg-white print:p-0 print-preview-modal-portal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none">
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between print:hidden">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Delivery Challan Receipt View
              </h3>
              <button
                onClick={() => setViewingPrintChallan(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Challan Printable layout */}
            <div className="p-6 sm:p-8 text-xs text-slate-800 bg-white overflow-y-auto flex-1 print:overflow-visible print:p-0" id="printable-challan">
              <div className="text-center space-y-1">
                <h2 className="text-base font-extrabold tracking-widest text-slate-900 uppercase">SUPER STEEL INDUSTRIES</h2>
                <p className="text-[10px] text-slate-500 font-medium">12, Industrial Estate, HSR Layout, India</p>
                <p className="text-[9px] text-slate-400">GSTIN: 29AAFCS9012L1Z5 | Delivery Dispatch Note</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-200 py-3 text-[10px] mt-4">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500 uppercase">Challan Number:</span>
                    <span className="font-bold text-slate-900 font-mono">{viewingPrintChallan.challanNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500 uppercase">Dispatch Date:</span>
                    <span className="font-semibold text-slate-800">{formatDate(viewingPrintChallan.challanDate)}</span>
                  </div>
                </div>
                <div className="space-y-1 border-l border-slate-200 pl-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500 uppercase">Order Ref No:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {order?.orderNumber || ""}
                    </span>
                  </div>
                  {viewingPrintChallan.deliveryMode && (
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500 uppercase">Delivery Mode:</span>
                      <span className="font-bold text-slate-800">{viewingPrintChallan.deliveryMode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer details */}
              <div className="space-y-1.5 mt-4">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Consignee / Delivery Address</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {(() => {
                    const orderObj = order;
                    const partyObj = orderObj ? parties.find(p => p.id === orderObj.partyId) : null;
                    return (
                      <>
                        <span className="font-bold text-slate-800 block text-xs">{partyObj?.name || "Consignee"}</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          Address: {partyObj?.address || ""}, {partyObj?.city || ""}, {partyObj?.state || ""} - {partyObj?.pinCode || ""}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Contact: {partyObj?.contactPerson || ""} ({partyObj?.mobile || ""})</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Line items table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                      <th className="p-2">Item / Specification</th>
                      <th className="p-2 text-right">Quantity Shipped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {viewingPrintChallan.items.map((item: any, idx: number) => {
                      const prod = products.find(p => p.id === item.productId);
                      const orderItem = order?.items.find((oi: any) => oi.productId === item.productId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 font-medium">
                            <span className="font-bold text-slate-800 block">{orderItem?.productName || prod?.name || item.productId}</span>
                            <span className="text-[8px] text-slate-400 block mt-0.5">{prod?.specifications}</span>
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">{item.qtyDelivered} Qty</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {viewingPrintChallan.remarks && (
                <div className="text-[10px] text-slate-500 mt-4">
                  <p><strong>Remarks / Batch Info:</strong> {viewingPrintChallan.remarks}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-10 text-[10px] font-semibold text-slate-600 mt-8">
                <div className="text-center pt-8 border-t border-dashed border-slate-200">
                  <p>Receiver's Signature & Stamp</p>
                </div>
                <div className="text-center pt-8 border-t border-dashed border-slate-200">
                  <p>For Super Steel Industries</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-2 print:hidden">
              <Button
                onClick={() => setViewingPrintChallan(null)}
                variant="secondary"
              >
                Close View
              </Button>
              <Button onClick={handlePrintChallan}>
                <Printer className="h-4 w-4 mr-1" />
                <span>Print Challan Slip</span>
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reusable Printable Order Modal overlay */}
      {viewingPrintOrder && (
        <OrderPrintDocument
          order={viewingPrintOrder}
          party={party}
          products={products}
          onClose={() => setViewingPrintOrder(null)}
        />
      )}
    </div>
  );
}
