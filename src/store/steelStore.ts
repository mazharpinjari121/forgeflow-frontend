import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Category {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  price: number;
  specifications: string;
  description: string;
  status: "Active" | "Inactive" | "Discontinued";
  photos: string[];
  videos: string[];
  pdf?: string;
  pdfName?: string;
  createdAt: string;
  minStockLevel: number;
  cgst?: number;
  sgst?: number;
}

export interface Party {
  id: string;
  name: string;
  type: "Retailer" | "Wholesaler" | "Direct Customer";
  contactPerson: string;
  mobile: string;
  whatsapp: string;
  email: string;
  pan: string;
  gst?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  notes: string;
  status: "Active" | "Inactive" | "Blacklisted";
  createdAt: string;
  openingBalance: number;
}

export interface StockEntry {
  id: string;
  entryNumber: string; // STK-YYYYMM-####
  productId: string;
  productionDate: string;
  qtyProduced: number;
  remarks: string;
  status: "Active" | "Cancelled";
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  qtyOrdered: number;
  qtyDelivered: number;
  unitPrice: number;
  overrideReason?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // ORD-YYYYMM-####
  orderDate: string;
  partyId: string;
  deliveryDate: string;
  status: "Confirmed" | "Partially Delivered" | "Delivered" | "Cancelled";
  notes: string;
  items: OrderItem[];
  advanceAmount: number;
  cancellationReason?: string;
  createdAt: string;
  orderType?: "Estimate" | "Invoice";
}

export interface ChallanItem {
  productId: string;
  qtyDelivered: number;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string; // CHN-YYYYMM-####
  orderId: string;
  challanDate: string;
  vehicleDetails: string;
  driverName: string;
  deliveredBy: string;
  remarks: string;
  items: ChallanItem[];
  createdAt: string;
  deliveryMode?: string;
}

export interface PaymentReceipt {
  amount: any;
  id: string;
  receiptNumber: string; // RCP-YYYYMM-####
  paymentDate: string;
  partyId: string;
  amountReceived: number;
  paymentMode: "Cash" | "UPI" | "Bank Transfer" | "Cheque";
  referenceNumber: string;
  remarks: string;
  receivedBy: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  date: string;
  type: "Invoice" | "Payment" | "Sale Return" | "Opening Balance";
  referenceId: string; // Order No or Receipt No or Return No
  debit: number; // Invoiced amount (increases outstanding)
  credit: number; // Received / returned amount (decreases outstanding)
  balance: number; // Running balance after this entry
  remarks: string;
}

export interface UserMaster {
  id: string;
  fullName: string;
  userId: string;
  mobile: string;
  email: string;
  role: "Admin" | "Manager" | "Staff";
  status: "Active" | "Inactive";
  address: string;
  createdAt: string;
  lastLogin?: string;
  password?: string;
}

export interface WhatsAppPromo {
  id: string;
  productId: string;
  messageText: string;
  sentToPartyTypes: string[];
  sentCount: number;
  sentAt: string;
}

export interface SaleReturn {
  id: string;
  returnNumber: string; // RET-YYYYMM-####
  orderId: string;
  returnDate: string;
  type: "Credit Note" | "Refund";
  items: { productId: string; qtyReturned: number; unitPrice: number }[];
  remarks: string;
  createdAt: string;
}

interface SteelState {
  categories: Category[];
  products: Product[];
  parties: Party[];
  users: UserMaster[];
  stockEntries: StockEntry[];
  orders: Order[];
  challans: DeliveryChallan[];
  payments: PaymentReceipt[];
  ledgerEntries: LedgerEntry[];
  promotions: WhatsAppPromo[];
  saleReturns: SaleReturn[];

  // Setters / Actions
  addCategory: (category: Omit<Category, "id" | "createdAt">) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  addProduct: (product: Omit<Product, "id" | "sku" | "createdAt">) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addParty: (party: Omit<Party, "id" | "createdAt">) => Party;
  updateParty: (id: string, updates: Partial<Party>) => void;
  addUser: (user: Omit<UserMaster, "id" | "createdAt">) => void;
  updateUser: (id: string, updates: Partial<UserMaster>) => void;
  addStockEntry: (entry: Omit<StockEntry, "id" | "entryNumber" | "status" | "createdAt">) => void;
  cancelStockEntry: (id: string) => void;
  addOrder: (order: Omit<Order, "id" | "orderNumber" | "status" | "createdAt">) => Order;
  cancelOrder: (id: string, reason: string) => void;
  modifyOrderItems: (id: string, items: { productId: string; qtyOrdered: number; unitPrice: number; overrideReason?: string }[], reason: string) => void;
  createChallan: (challan: Omit<DeliveryChallan, "id" | "challanNumber" | "createdAt">) => void;
  addPayment: (payment: Omit<PaymentReceipt, "id" | "receiptNumber" | "createdAt">) => void;
  addWhatsAppPromo: (promo: Omit<WhatsAppPromo, "id" | "sentAt">) => void;
  addSaleReturn: (saleReturn: Omit<SaleReturn, "id" | "returnNumber" | "createdAt">) => void;
}

export const useSteelStore = create<SteelState>()(
  persist(
    (set, get) => ({
      categories: [
        { id: "cat-1", name: "Steel Plates", description: "Hot Rolled & Cold Rolled carbon steel plates", status: "Active", createdAt: "2026-01-01" },
        { id: "cat-2", name: "TMT Rebars", description: "High strength thermo-mechanically treated reinforcement bars", status: "Active", createdAt: "2026-01-01" },
        { id: "cat-3", name: "HR Sheets", description: "Hot Rolled steel sheets of varying thicknesses", status: "Active", createdAt: "2026-01-02" },
        { id: "cat-4", name: "MS Angles", description: "Mild Steel structural L-shaped profiles", status: "Active", createdAt: "2026-01-02" },
      ],
      products: [
        { id: "prod-1", name: "HR Sheet 2.0mm IS 2062", sku: "SKU-HR-001", categoryId: "cat-3", price: 55000, specifications: "Size: 8ft x 4ft, Thickness: 2mm, Grade: IS 2062", description: "Premium quality hot rolled sheet for structural fabrication.", status: "Active", photos: [], videos: [], createdAt: "2026-01-03", minStockLevel: 5, cgst: 9, sgst: 9 },
        { id: "prod-2", name: "TMT Bar Fe 550D 12mm", sku: "SKU-TMT-002", categoryId: "cat-2", price: 62000, specifications: "Diameter: 12mm, Grade: Fe 550D, High Ductility", description: "Heavy duty concrete reinforcement bars.", status: "Active", photos: [], videos: [], createdAt: "2026-01-03", minStockLevel: 10, cgst: 9, sgst: 9 },
        { id: "prod-3", name: "MS Angle 50x50x5mm", sku: "SKU-MS-003", categoryId: "cat-4", price: 48000, specifications: "Size: 50x50mm, Thickness: 5mm, Length: 6m", description: "Mild steel structural angle profile.", status: "Active", photos: [], videos: [], createdAt: "2026-01-04", minStockLevel: 3, cgst: 9, sgst: 9 },
      ],
      parties: [
        { id: "party-1", name: "Steel Solutions Corp", type: "Wholesaler", contactPerson: "Rajesh Kumar", mobile: "9876543210", whatsapp: "9876543210", email: "info@steelsolutions.com", pan: "ABCDE1234F", gst: "33ABCDE1234F1Z1", address: "12, Industrial Estate, Guindy", city: "Chennai", state: "Tamil Nadu", pinCode: "600032", notes: "Prefers bulk delivery, prompt payment on credit terms.", status: "Active", createdAt: "2026-01-04", openingBalance: 150000 },
        { id: "party-2", name: "BuildMart Retailers", type: "Retailer", contactPerson: "Anil Sharma", mobile: "9123456789", whatsapp: "9123456789", email: "contact@buildmart.in", pan: "FGHIJ5678K", gst: "29FGHIJ5678K1Z2", address: "55, Ring Road, HSR Layout", city: "Bangalore", state: "Karnataka", pinCode: "560102", notes: "Regular small retail orders.", status: "Active", createdAt: "2026-01-05", openingBalance: 45000 },
        { id: "party-3", name: "Apex Infrastructure Ltd", type: "Direct Customer", contactPerson: "Vikram Reddy", mobile: "8888888888", whatsapp: "8888888888", email: "purchase@apexinfra.com", pan: "KLMNO9012L", gst: "27KLMNO9012L1Z9", address: "Plot 24, Nariman Point", city: "Mumbai", state: "Maharashtra", pinCode: "400021", notes: "Large government project client. Cash & credit mixed.", status: "Active", createdAt: "2026-01-06", openingBalance: 0 },
      ],
      users: [
        { id: "usr-1", fullName: "Amit Patil", userId: "SS-ADM-01", mobile: "9000000001", email: "amit.admin@supersteel.com", role: "Admin", status: "Active", address: "Mumbai", createdAt: "2026-01-01", password: "password123" },
        { id: "usr-2", fullName: "Shweta Joshi", userId: "SS-MGR-02", mobile: "9000000002", email: "shweta.mgr@supersteel.com", role: "Manager", status: "Active", address: "Pune", createdAt: "2026-01-02", password: "password123" },
        { id: "usr-3", fullName: "Rohan Das", userId: "SS-STF-03", mobile: "9000000003", email: "rohan.staff@supersteel.com", role: "Staff", status: "Active", address: "Kolkata", createdAt: "2026-01-03", password: "password123" },
      ],
      stockEntries: [
        { id: "stk-1", entryNumber: "STK-202605-0001", productId: "prod-1", productionDate: "2026-05-10", qtyProduced: 50, remarks: "Shift A production run. Checked for thickness tolerance.", status: "Active", createdAt: "2026-05-10" },
        { id: "stk-2", entryNumber: "STK-202605-0002", productId: "prod-2", productionDate: "2026-05-12", qtyProduced: 120, remarks: "Shift B production run. Cold testing passed.", status: "Active", createdAt: "2026-05-12" },
        { id: "stk-3", entryNumber: "STK-202605-0003", productId: "prod-3", productionDate: "2026-05-14", qtyProduced: 40, remarks: "Quality control approved.", status: "Active", createdAt: "2026-05-14" },
      ],
      orders: [
        {
          id: "ord-1",
          orderNumber: "ORD-202605-0001",
          orderDate: "2026-05-18",
          partyId: "party-1",
          deliveryDate: "2026-05-28",
          status: "Partially Delivered",
          notes: "Priority delivery. Load on heavy truck.",
          items: [
            { id: "item-1-1", productId: "prod-1", qtyOrdered: 30, qtyDelivered: 20, unitPrice: 55000 },
            { id: "item-1-2", productId: "prod-2", qtyOrdered: 50, qtyDelivered: 50, unitPrice: 62000 },
          ],
          advanceAmount: 500000,
          createdAt: "2026-05-18",
        },
        {
          id: "ord-2",
          orderNumber: "ORD-202605-0002",
          orderDate: "2026-05-20",
          partyId: "party-2",
          deliveryDate: "2026-05-25", // Overdue
          status: "Confirmed",
          notes: "Need direct retail delivery.",
          items: [
            { id: "item-2-1", productId: "prod-3", qtyOrdered: 10, qtyDelivered: 0, unitPrice: 49000, overrideReason: "Bulk discount given" },
          ],
          advanceAmount: 0,
          createdAt: "2026-05-20",
        },
      ],
      challans: [
        {
          id: "chal-1",
          challanNumber: "CHN-202605-0001",
          orderId: "ord-1",
          challanDate: "2026-05-22",
          vehicleDetails: "KA-03-MR-9988 (10-wheeler)",
          driverName: "Manpreet Singh",
          deliveredBy: "Rohan Das",
          remarks: "First lot delivered successfully. Product 2 fully done.",
          items: [
            { productId: "prod-1", qtyDelivered: 20 },
            { productId: "prod-2", qtyDelivered: 50 },
          ],
          createdAt: "2026-05-22",
        },
      ],
      payments: [
        {
          id: "pay-1", receiptNumber: "RCP-202605-0001", paymentDate: "2026-05-18", partyId: "party-1", amountReceived: 500000, paymentMode: "Bank Transfer", referenceNumber: "IMPS889028", remarks: "Advance for ORD-202605-0001", receivedBy: "Shweta Joshi", createdAt: "2026-05-18",
          amount: function (amount: any): unknown {
            throw new Error("Function not implemented.");
          }
        },
        {
          id: "pay-2", receiptNumber: "RCP-202605-0002", paymentDate: "2026-05-23", partyId: "party-2", amountReceived: 100000, paymentMode: "UPI", referenceNumber: "UPI-paymart-1290", remarks: "Partial payment against ledger dues", receivedBy: "Rohan Das", createdAt: "2026-05-23",
          amount: function (amount: any): unknown {
            throw new Error("Function not implemented.");
          }
        },
      ],
      ledgerEntries: [
        { id: "ld-1", partyId: "party-1", date: "2026-01-04", type: "Opening Balance", referenceId: "SYSTEM", debit: 0, credit: 0, balance: 150000, remarks: "Account initialization" },
        { id: "ld-2", partyId: "party-2", date: "2026-01-05", type: "Opening Balance", referenceId: "SYSTEM", debit: 0, credit: 0, balance: 45000, remarks: "Account initialization" },
        { id: "ld-3", partyId: "party-1", date: "2026-05-18", type: "Payment", referenceId: "RCP-202605-0001", debit: 0, credit: 500000, balance: -350000, remarks: "Advance received" },
        { id: "ld-4", partyId: "party-1", date: "2026-05-18", type: "Invoice", referenceId: "ORD-202605-0001", debit: 4750000, credit: 0, balance: 4400000, remarks: "Total invoice raised (30x55k + 50x62k)" },
        { id: "ld-5", partyId: "party-2", date: "2026-05-20", type: "Invoice", referenceId: "ORD-202605-0002", debit: 490000, credit: 0, balance: 535000, remarks: "Total invoice raised (10x49k)" },
        { id: "ld-6", partyId: "party-2", date: "2026-05-23", type: "Payment", referenceId: "RCP-202605-0002", debit: 0, credit: 100000, balance: 435000, remarks: "Partial payment received" },
      ],
      promotions: [
        { id: "prm-1", productId: "prod-1", messageText: "New production lot of 2.0mm HR Sheets now available at attractive prices! Contact us for bookings.", sentToPartyTypes: ["Wholesaler", "Retailer"], sentCount: 2, sentAt: "2026-05-24" },
      ],
      saleReturns: [],

      // Setters
      addCategory: (category) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { ...category, id: `cat-${state.categories.length + 1}`, createdAt: new Date().toISOString().split("T")[0] },
          ],
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      addProduct: (product) => {
        const id = `prod-${get().products.length + 1}`;
        const count = get().products.filter((p) => p.categoryId === product.categoryId).length + 1;
        const cat = get().categories.find((c) => c.id === product.categoryId);
        const prefix = cat ? cat.name.slice(0, 3).toUpperCase() : "PRD";
        const sku = `SKU-${prefix}-${String(count).padStart(3, "0")}`;
        const newProduct = {
          ...product,
          id,
          sku,
          createdAt: new Date().toISOString().split("T")[0],
        };
        set((state) => ({
          products: [...state.products, newProduct],
        }));
        return newProduct;
      },

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      addParty: (party) => {
        const state = get();
        const newParty: Party = {
          ...party,
          id: `party-${state.parties.length + 1}`,
          createdAt: new Date().toISOString().split("T")[0],
        };
        const initialLedger = {
          id: `ld-${state.ledgerEntries.length + 1}`,
          partyId: newParty.id,
          date: newParty.createdAt,
          type: "Opening Balance" as const,
          referenceId: "SYSTEM",
          debit: 0,
          credit: 0,
          balance: party.openingBalance || 0,
          remarks: "Account initialized with opening balance",
        };
        set({
          parties: [...state.parties, newParty],
          ledgerEntries: [...state.ledgerEntries, initialLedger],
        });
        return newParty;
      },

      updateParty: (id, updates) =>
        set((state) => {
          const updatedParties = state.parties.map((p) => (p.id === id ? { ...p, ...updates } : p));
          let updatedLedgerEntries = [...state.ledgerEntries];
          if (updates.openingBalance !== undefined) {
            const idx = updatedLedgerEntries.findIndex((l) => l.partyId === id && l.type === "Opening Balance");
            if (idx !== -1) {
              const oldOpening = updatedLedgerEntries[idx].balance;
              const diff = updates.openingBalance - oldOpening;
              updatedLedgerEntries[idx] = {
                ...updatedLedgerEntries[idx],
                balance: updates.openingBalance,
              };
              let currentBal = updates.openingBalance;
              for (let i = idx + 1; i < updatedLedgerEntries.length; i++) {
                if (updatedLedgerEntries[i].partyId === id) {
                  updatedLedgerEntries[i] = {
                    ...updatedLedgerEntries[i],
                    balance: updatedLedgerEntries[i].balance + diff,
                  };
                }
              }
            }
          }
          return {
            parties: updatedParties,
            ledgerEntries: updatedLedgerEntries,
          };
        }),

      addUser: (user) =>
        set((state) => ({
          users: [
            ...state.users,
            { ...user, id: `usr-${state.users.length + 1}`, createdAt: new Date().toISOString().split("T")[0] },
          ],
        })),

      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),

      addStockEntry: (entry) =>
        set((state) => {
          const date = new Date();
          const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
          const count = state.stockEntries.length + 1;
          const entryNumber = `STK-${yyyymm}-${String(count).padStart(4, "0")}`;
          return {
            stockEntries: [
              ...state.stockEntries,
              {
                ...entry,
                id: `stk-${count}`,
                entryNumber,
                status: "Active",
                createdAt: new Date().toISOString().split("T")[0],
              },
            ],
          };
        }),

      cancelStockEntry: (id) =>
        set((state) => ({
          stockEntries: state.stockEntries.map((st) => (st.id === id ? { ...st, status: "Cancelled" } : st)),
        })),

      addOrder: (order) => {
        const state = get();
        const date = new Date();
        const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
        const count = state.orders.length + 1;
        const orderNumber = `ORD-${yyyymm}-${String(count).padStart(4, "0")}`;

        // Calculate total amount including taxes if orderType is Invoice
        const totalAmount = order.items.reduce((sum, item) => {
          const base = item.qtyOrdered * item.unitPrice;
          if (order.orderType === "Invoice") {
            const prod = state.products.find(p => p.id === item.productId);
            const cgst = prod?.cgst ?? 0;
            const sgst = prod?.sgst ?? 0;
            return sum + base + (base * (cgst + sgst) / 100);
          }
          return sum + base;
        }, 0);

        const newOrder: Order = {
          ...order,
          id: `ord-${count}`,
          orderNumber,
          status: "Confirmed",
          createdAt: new Date().toISOString().split("T")[0],
        };

        // Post to ledger as a Debit (invoice amount)
        const lastLedger = [...state.ledgerEntries]
          .reverse()
          .find((l) => l.partyId === order.partyId);
        const prevBalance = lastLedger ? lastLedger.balance : 0;
        const newBalance = prevBalance + totalAmount;

        const ledgerId = `ld-${state.ledgerEntries.length + 1}`;
        const newLedger: LedgerEntry = {
          id: ledgerId,
          partyId: order.partyId,
          date: newOrder.orderDate,
          type: "Invoice",
          referenceId: orderNumber,
          debit: totalAmount,
          credit: 0,
          balance: newBalance,
          remarks: `Total invoice raised for order ${orderNumber}`,
        };

        // If there's an advance amount, post it immediately as credit
        let updatedLedgerEntries = [...state.ledgerEntries, newLedger];
        let finalPayments = [...state.payments];

        if (order.advanceAmount > 0) {
          const rcCount = state.payments.length + 1;
          const receiptNumber = `RCP-${yyyymm}-${String(rcCount).padStart(4, "0")}`;
          const newReceipt: PaymentReceipt = {
            id: `pay-${rcCount}`,
            receiptNumber,
            paymentDate: order.orderDate,
            partyId: order.partyId,
            amountReceived: order.advanceAmount,
            paymentMode: "Bank Transfer",
            referenceNumber: "ADV-AUTO",
            remarks: `Advance for order ${orderNumber}`,
            receivedBy: "System Auto-Post",
            createdAt: new Date().toISOString().split("T")[0],
            amount: function (amount: any): unknown {
              throw new Error("Function not implemented.");
            }
          };

          const advLedger: LedgerEntry = {
            id: `ld-${updatedLedgerEntries.length + 1}`,
            partyId: order.partyId,
            date: order.orderDate,
            type: "Payment",
            referenceId: receiptNumber,
            debit: 0,
            credit: order.advanceAmount,
            balance: newBalance - order.advanceAmount,
            remarks: `Advance payment receipt auto-posted`,
          };

          updatedLedgerEntries.push(advLedger);
          finalPayments.push(newReceipt);
        }

        set({
          orders: [...state.orders, newOrder],
          ledgerEntries: updatedLedgerEntries,
          payments: finalPayments,
        });

        return newOrder;
      },

      cancelOrder: (id, reason) =>
        set((state) => {
          const ord = state.orders.find((o) => o.id === id);
          if (!ord) return {};

          const updatedOrders = state.orders.map((o) =>
            o.id === id ? { ...o, status: "Cancelled" as const, cancellationReason: reason } : o
          );

          // Reverse invoice in ledger (credit back)
          const totalAmount = ord.items.reduce((sum, item) => {
            const base = item.qtyOrdered * item.unitPrice;
            if (ord.orderType === "Invoice") {
              const prod = state.products.find(p => p.id === item.productId);
              const cgst = prod?.cgst ?? 0;
              const sgst = prod?.sgst ?? 0;
              return sum + base + (base * (cgst + sgst) / 100);
            }
            return sum + base;
          }, 0);
          const lastLedger = [...state.ledgerEntries]
            .reverse()
            .find((l) => l.partyId === ord.partyId);
          const prevBalance = lastLedger ? lastLedger.balance : 0;
          const newBalance = prevBalance - totalAmount + ord.advanceAmount; // undo debit and return advance credit

          const ledgerId = `ld-${state.ledgerEntries.length + 1}`;
          const reverseLedger: LedgerEntry = {
            id: ledgerId,
            partyId: ord.partyId,
            date: new Date().toISOString().split("T")[0],
            type: "Sale Return",
            referenceId: ord.orderNumber,
            debit: 0,
            credit: totalAmount,
            balance: newBalance,
            remarks: `Order cancelled reversal: ${reason}`,
          };

          return {
            orders: updatedOrders,
            ledgerEntries: [...state.ledgerEntries, reverseLedger],
          };
        }),

      modifyOrderItems: (orderId, updatedItems, reason) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          if (!order) return {};

          const calculateOrderTotal = (items: OrderItem[]) => {
            return items.reduce((sum, item) => {
              const base = item.qtyOrdered * item.unitPrice;
              if (order.orderType === "Invoice") {
                const prod = state.products.find(p => p.id === item.productId);
                const cgst = prod?.cgst ?? 0;
                const sgst = prod?.sgst ?? 0;
                return sum + base + (base * (cgst + sgst) / 100);
              }
              return sum + base;
            }, 0);
          };

          const oldTotalAmount = calculateOrderTotal(order.items);

          // Build new items array
          const newItems: OrderItem[] = updatedItems.map((updatedItem, index) => {
            const existingItem = order.items.find((item) => item.productId === updatedItem.productId);
            const qtyDelivered = existingItem ? existingItem.qtyDelivered : 0;

            // Validate: cannot set qtyOrdered < qtyDelivered
            if (updatedItem.qtyOrdered < qtyDelivered) {
              throw new Error(
                `Invalid quantity: Cannot set quantity for product to ${updatedItem.qtyOrdered} because ${qtyDelivered} has already been delivered.`
              );
            }

            return {
              id: existingItem ? existingItem.id : `item-${orderId}-${Date.now()}-${index}`,
              productId: updatedItem.productId,
              qtyOrdered: updatedItem.qtyOrdered,
              qtyDelivered,
              unitPrice: updatedItem.unitPrice,
              overrideReason: updatedItem.overrideReason || "",
            };
          });

          // Calculate new total order amount
          const newTotalAmount = calculateOrderTotal(newItems);
          const diffAmount = newTotalAmount - oldTotalAmount;

          // Re-evaluate order status
          const totalDelivered = newItems.reduce((sum, item) => sum + item.qtyDelivered, 0);
          const totalOrdered = newItems.reduce((sum, item) => sum + item.qtyOrdered, 0);

          let status: Order["status"] = order.status;
          if (totalOrdered === 0) {
            status = "Cancelled";
          } else if (totalDelivered >= totalOrdered && totalOrdered > 0) {
            status = "Delivered";
          } else if (totalDelivered > 0) {
            status = "Partially Delivered";
          } else {
            status = "Confirmed";
          }

          const updatedOrder: Order = {
            ...order,
            items: newItems,
            status,
            cancellationReason: status === "Cancelled" ? reason : order.cancellationReason,
          };

          const updatedOrders = state.orders.map((o) => (o.id === orderId ? updatedOrder : o));

          // Post ledger adjustment if amount changed
          let updatedLedgerEntries = [...state.ledgerEntries];
          if (diffAmount !== 0) {
            const lastLedger = [...state.ledgerEntries]
              .reverse()
              .find((l) => l.partyId === order.partyId);
            const prevBalance = lastLedger ? lastLedger.balance : 0;
            const newBalance = prevBalance + diffAmount;

            const ledgerId = `ld-${state.ledgerEntries.length + 1}`;
            const adjustmentLedger: LedgerEntry = {
              id: ledgerId,
              partyId: order.partyId,
              date: new Date().toISOString().split("T")[0],
              type: diffAmount > 0 ? "Invoice" : "Sale Return",
              referenceId: order.orderNumber,
              debit: diffAmount > 0 ? diffAmount : 0,
              credit: diffAmount < 0 ? Math.abs(diffAmount) : 0,
              balance: newBalance,
              remarks: `Booking adjustment for order ${order.orderNumber}. Reason: ${reason}`,
            };
            updatedLedgerEntries.push(adjustmentLedger);
          }

          return {
            orders: updatedOrders,
            ledgerEntries: updatedLedgerEntries,
          };
        }),

      createChallan: (challan) =>
        set((state) => {
          const date = new Date();
          const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
          const count = state.challans.length + 1;
          const challanNumber = `CHN-${yyyymm}-${String(count).padStart(4, "0")}`;

          const newChallan = {
            ...challan,
            id: `chal-${count}`,
            challanNumber,
            createdAt: new Date().toISOString().split("T")[0],
          };

          // Update order items quantity delivered
          const updatedOrders = state.orders.map((order) => {
            if (order.id !== challan.orderId) return order;

            const updatedItems = order.items.map((item) => {
              const chItem = challan.items.find((c) => c.productId === item.productId);
              if (!chItem) return item;
              const newDelivered = item.qtyDelivered + chItem.qtyDelivered;
              if (newDelivered > item.qtyOrdered) {
                const prod = state.products.find(p => p.id === item.productId);
                throw new Error(
                  `Dispatch failure: Dispatching ${chItem.qtyDelivered} Qty of '${prod?.name || item.productId}' would cause total delivered quantity (${newDelivered}) to exceed ordered quantity (${item.qtyOrdered}).`
                );
              }
              return {
                ...item,
                qtyDelivered: newDelivered,
              };
            });

            // Re-calculate order status
            const allDelivered = updatedItems.every((item) => item.qtyDelivered >= item.qtyOrdered);
            const status = allDelivered
              ? ("Delivered" as const)
              : ("Partially Delivered" as const);

            return {
              ...order,
              items: updatedItems,
              status,
            };
          });

          return {
            challans: [...state.challans, newChallan],
            orders: updatedOrders,
          };
        }),

      addPayment: (payment) =>
        set((state) => {
          const date = new Date();
          const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
          const count = state.payments.length + 1;
          const receiptNumber = `RCP-${yyyymm}-${String(count).padStart(4, "0")}`;

          const newReceipt = {
            ...payment,
            id: `pay-${count}`,
            receiptNumber,
            createdAt: new Date().toISOString().split("T")[0],
          };

          // Add to ledger
          const lastLedger = [...state.ledgerEntries]
            .reverse()
            .find((l) => l.partyId === payment.partyId);
          const prevBalance = lastLedger ? lastLedger.balance : 0;
          const newBalance = prevBalance - payment.amountReceived;

          const newLedger: LedgerEntry = {
            id: `ld-${state.ledgerEntries.length + 1}`,
            partyId: payment.partyId,
            date: payment.paymentDate,
            type: "Payment",
            referenceId: receiptNumber,
            debit: 0,
            credit: payment.amountReceived,
            balance: newBalance,
            remarks: payment.remarks || "Payment collection received",
          };

          return {
            payments: [...state.payments, newReceipt],
            ledgerEntries: [...state.ledgerEntries, newLedger],
          };
        }),

      addWhatsAppPromo: (promo) =>
        set((state) => ({
          promotions: [
            ...state.promotions,
            {
              ...promo,
              id: `prm-${state.promotions.length + 1}`,
              sentAt: new Date().toISOString().split("T")[0],
            },
          ],
        })),

      addSaleReturn: (saleReturn) =>
        set((state) => {
          const date = new Date();
          const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
          const count = state.saleReturns.length + 1;
          const returnNumber = `RET-${yyyymm}-${String(count).padStart(4, "0")}`;

          const newReturn = {
            ...saleReturn,
            id: `ret-${count}`,
            returnNumber,
            createdAt: new Date().toISOString().split("T")[0],
          };

          const order = state.orders.find((o) => o.id === saleReturn.orderId);
          const partyId = order ? order.partyId : "";

          // Post to ledger (Credit - reduce outstanding for Credit Note, or Debit refund for Refund)
          let ledgerEntries = [...state.ledgerEntries];
          if (partyId) {
            const totalReturned = saleReturn.items.reduce((sum, i) => sum + i.qtyReturned * i.unitPrice, 0);
            const lastLedger = [...state.ledgerEntries]
              .reverse()
              .find((l) => l.partyId === partyId);
            const prevBalance = lastLedger ? lastLedger.balance : 0;

            let debit = 0;
            let credit = 0;
            let remarks = "";

            if (saleReturn.type === "Credit Note") {
              credit = totalReturned;
              remarks = `Sale return credit note issued against ${order?.orderNumber}`;
            } else {
              // Cash out / refund increases the party outstanding or represents cash paid out
              credit = totalReturned; // reduction of dues
              remarks = `Sale return cash refund processed against ${order?.orderNumber}`;
            }

            const newLedger: LedgerEntry = {
              id: `ld-${state.ledgerEntries.length + 1}`,
              partyId,
              date: saleReturn.returnDate,
              type: "Sale Return",
              referenceId: returnNumber,
              debit,
              credit,
              balance: prevBalance - credit + debit,
              remarks,
            };
            ledgerEntries.push(newLedger);
          }

          return {
            saleReturns: [...state.saleReturns, newReturn],
            ledgerEntries,
          };
        }),
    }),
    {
      name: "super-steel-erp-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Strip large base64 strings from product photos/videos before writing to localStorage.
        // This keeps the persisted state well within the 5MB browser quota while allowing
        // full size files to exist in active memory during the user's session.
        const sanitizedProducts = state.products.map((prod) => ({
          ...prod,
          photos: prod.photos.map((p) => (p.length > 50000 ? "" : p)).filter(Boolean),
          videos: prod.videos.map((v) => (v.length > 50000 ? "" : v)).filter(Boolean),
          pdf: prod.pdf && prod.pdf.length > 50000 ? "" : prod.pdf,
        }));
        return {
          ...state,
          products: sanitizedProducts,
        };
      },
    }
  )
);
