import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category Name is required").max(100, "Category Name must be under 100 characters"),
  description: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product Name is required").max(200, "Product Name must be under 200 characters"),
  categoryId: z.string().min(1, "Category is required"),
  price: z.preprocess((val) => Number(val), z.number().min(1, "Price must be greater than zero")),
  specifications: z.string().min(1, "Dimensions / Specifications are required"),
  description: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive", "Discontinued"]).default("Active"),
  minStockLevel: z.preprocess((val) => Number(val), z.number().min(0, "Minimum Stock Level must be 0 or more")),
});

export const partySchema = z.object({
  name: z.string().min(1, "Party Name is required").max(200, "Party Name must be under 200 characters"),
  type: z.enum(["Retailer", "Wholesaler", "Direct Customer"]),
  contactPerson: z.string().min(1, "Contact Person Name is required"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number starting with 6-9"),
  whatsapp: z.string().optional().refine((val) => !val || /^[6-9]\d{9}$/.test(val), {
    message: "Must be a valid 10-digit Indian WhatsApp number",
  }),
  email: z.string().email("Invalid email address").or(z.literal("")),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Must be a valid 10-character PAN number").or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pinCode: z.string().regex(/^\d{6}$/, "PIN Code must be exactly 6 digits"),
  notes: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive", "Blacklisted"]).default("Active"),
});

export const userSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  userId: z.string().optional().default(""),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit username/mobile"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  role: z.enum(["Admin", "Manager", "Staff"]),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  address: z.string().optional().default(""),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const stockEntrySchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productionDate: z.string().min(1, "Production Date is required"),
  qtyProduced: z.preprocess((val) => Number(val), z.number().min(1, "Quantity must be at least 1")),
  remarks: z.string().optional().default(""),
});

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  qtyOrdered: z.preprocess((val) => Number(val), z.number().min(1, "Quantity must be at least 1")),
  unitPrice: z.preprocess((val) => Number(val), z.number().min(1, "Price must be greater than zero")),
  overrideReason: z.string().optional(),
});

export const orderSchema = z.object({
  partyId: z.string().min(1, "Party is required"),
  orderDate: z.string().min(1, "Order Date is required"),
  deliveryDate: z.string().min(1, "Expected Delivery Date is required"),
  notes: z.string().optional().default(""),
  items: z.array(orderItemSchema).min(1, "At least one line item is required"),
  advanceAmount: z.preprocess((val) => Number(val || 0), z.number().min(0, "Advance cannot be negative")),
});

export const deliveryChallanItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  qtyDelivered: z.preprocess((val) => Number(val), z.number().min(0, "Delivered Qty cannot be negative")),
});

export const deliveryChallanSchema = z.object({
  challanDate: z.string().min(1, "Challan Date is required"),
  vehicleDetails: z.string().min(1, "Vehicle / Transport details are required"),
  driverName: z.string().min(1, "Driver Name is required"),
  deliveredBy: z.string().min(1, "Delivered By is required"),
  remarks: z.string().optional().default(""),
  items: z.array(deliveryChallanItemSchema),
});

export const paymentReceiptSchema = z.object({
  paymentDate: z.string().min(1, "Payment Date is required"),
  partyId: z.string().min(1, "Party is required"),
  amountReceived: z.preprocess((val) => Number(val), z.number().min(1, "Amount must be at least 1")),
  paymentMode: z.enum(["Cash", "UPI", "Bank Transfer", "Cheque"]),
  referenceNumber: z.string().min(1, "Reference number/transaction ID is required"),
  remarks: z.string().optional().default(""),
});

export const saleReturnSchema = z.object({
  orderId: z.string().min(1, "Order reference is required"),
  returnDate: z.string().min(1, "Return Date is required"),
  type: z.enum(["Credit Note", "Refund"]),
  remarks: z.string().min(1, "Remarks / Reason for return are required"),
  items: z.array(z.object({
    productId: z.string(),
    qtyReturned: z.preprocess((val) => Number(val), z.number().min(0)),
    unitPrice: z.preprocess((val) => Number(val), z.number().min(0)),
  })).min(1, "At least one item must be returned"),
});
