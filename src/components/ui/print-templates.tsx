import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer } from "lucide-react";
import { Button } from "./button";
import { formatDate, numberToWordsINR } from "@/lib/utils";

// --- Print Styles ---
interface PrintStylesProps {
  printableId: string;
}

export function PrintStyles({ printableId }: PrintStylesProps) {
  return (
    <style>{`
      @media print {
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
        }
        #root {
          display: none !important;
        }
        body > *:not(.print-container-wrapper):not(.print-preview-modal-portal) {
          display: none !important;
        }
        body {
          background: #fff !important;
          color: #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #${printableId} {
          position: relative !important;
          margin: 0 auto !important;
          width: 190mm !important;
          min-width: 190mm !important;
          max-width: 190mm !important;
          height: auto !important;
          color: #000 !important;
          background-color: #fff !important;
          padding: 4mm !important;
          border: 1.5px solid #000 !important;
          box-shadow: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        #${printableId} * {
          border-color: #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* Force all border utilities to render solid */
        #${printableId} [class*="border-black"],
        #${printableId} [class*="divide-black"] > * {
          border-color: #000 !important;
          border-style: solid !important;
        }
        /* Force divide utilities: ensure child border widths are set */
        #${printableId} [class*="divide-x"] > *:not(:first-child) {
          border-left-width: 1px !important;
          border-left-style: solid !important;
          border-left-color: #000 !important;
        }
        #${printableId} [class*="divide-y"] > *:not(:first-child) {
          border-top-width: 1px !important;
          border-top-style: solid !important;
          border-top-color: #000 !important;
        }
        /* Table borders */
        #${printableId} table {
          border-collapse: collapse !important;
        }
        #${printableId} th,
        #${printableId} td {
          border: 1px solid #000 !important;
        }
        /* Background colors for header/total rows */
        #${printableId} .bg-slate-800 {
          background-color: #1e293b !important;
          color: #fff !important;
        }
        #${printableId} .bg-slate-100 {
          background-color: #f1f5f9 !important;
        }
        #${printableId} .bg-slate-50 {
          background-color: #f8fafc !important;
        }
        /* Keep dotted borders as dotted */
        #${printableId} [class*="border-dotted"] {
          border-style: dotted !important;
          border-color: #94a3b8 !important;
        }
        #${printableId} [class*="border-dashed"] {
          border-style: dashed !important;
          border-color: #94a3b8 !important;
        }
        /* Text colors for print */
        #${printableId} .text-red-655 {
          color: #dc2626 !important;
        }
        #${printableId} .text-red-650 {
          color: #dc2626 !important;
        }
      }
    `}</style>
  );
}

// --- Company Details (Single place to update) ---
export const COMPANY_DETAILS = {
  name: "SUPER STEEL WORKS",
  tagline: "DEALERS IN STEEL & WOODEN FURNITURE",
  address: "D-38, Ajanta Road, MIDC, Jalgaon. Mob. 9225122238",
  gstin: "27BARPS0793J1ZW",
  state: "Maharashtra",
  stateCode: "27",
  bankDetails: {
    bankName: "IDBI Bank",
    accountNumber: "5721201000019",
    ifscCode: "IBKL0000572",
  }
};

// --- Reusable Header ---
interface PrintHeaderProps {
  title: string;
  docNumber: string;
  docDate: string;
  deliveryMode?: string;
  receivedByLabel?: string;
  receivedByValue?: string;
  textRedClass?: string;
}

export function PrintHeader({
  title,
  docNumber,
  docDate,
  deliveryMode,
  receivedByLabel,
  receivedByValue,
  textRedClass = "text-red-655"
}: PrintHeaderProps) {
  return (
    <div className="grid grid-cols-12 border border-black divide-x divide-black bg-white">
      <div className="col-span-7 p-3 flex items-center gap-3 bg-white">
        <img
          src="/main-logo"
          className="h-20 object-contain shrink-0"
          alt={`${COMPANY_DETAILS.name} Logo`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/logo.png";
          }}
        />
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-black leading-tight">{COMPANY_DETAILS.name}</h1>
          <p className="text-[9px] font-bold text-slate-800 leading-tight uppercase">{COMPANY_DETAILS.tagline}</p>
          <p className="text-[8.5px] text-slate-600 font-semibold leading-tight">{COMPANY_DETAILS.address}</p>
        </div>
      </div>
      <div className="col-span-5 flex flex-col divide-y divide-black bg-white">
        <div className="grid grid-cols-2 divide-x divide-black">
          <div className="p-1.5 flex flex-col justify-between font-bold text-[8.5px] leading-tight">
            <span className="text-slate-500 uppercase text-[7px]">GSTIN</span>
            <span className="text-black font-mono text-[9px]">{COMPANY_DETAILS.gstin}</span>
          </div>
          <div className="p-1.5 text-center bg-slate-100 font-black text-[10px] uppercase tracking-wider text-black flex items-center justify-center">
            {title}
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-black">
          <div className="p-1.5 flex flex-col justify-between font-bold text-[8.5px] leading-tight">
            <span className="text-slate-500 uppercase text-[7px]">State</span>
            <span className="text-black text-[9px]">{COMPANY_DETAILS.state}</span>
          </div>
          <div className="p-1.5 flex flex-col justify-between font-bold text-[8.5px] leading-tight">
            <span className="text-slate-500 uppercase text-[7px]">No.</span>
            <span className={`${textRedClass} font-extrabold text-[10.5px] font-mono`}>{docNumber}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-black">
          <div className="p-1.5 flex flex-col justify-between font-bold text-[8.5px] leading-tight">
            <span className="text-slate-500 uppercase text-[7px]">Code</span>
            <span className="text-black text-[9px]">{COMPANY_DETAILS.stateCode}</span>
          </div>
          <div className="p-1.5 flex flex-col justify-between font-bold text-[8.5px] leading-tight">
            <span className="text-slate-500 uppercase text-[7px]">Date</span>
            <span className="text-black text-[9px] font-mono">{formatDate(docDate)}</span>
          </div>
        </div>
        {deliveryMode !== undefined && (
          <div className="p-1.5 font-bold text-[8.5px] flex items-center gap-1 leading-tight">
            <span className="text-slate-500 uppercase text-[7px]">Mode of Delivery:</span>
            <span className="text-black uppercase text-[8.5px] font-extrabold">{deliveryMode}</span>
          </div>
        )}
        {receivedByLabel !== undefined && (
          <div className="p-1.5 font-bold text-[8.5px] flex items-center gap-1 leading-tight">
            <span className="text-slate-500 uppercase text-[7px]">{receivedByLabel}:</span>
            <span className="text-black uppercase text-[8.5px] font-extrabold">{receivedByValue || "Staff"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Reusable Party Details ---
interface PrintPartyDetailsProps {
  partyName: string;
  partyAddress: string;
  partyGstin: string;
  state?: string;
  stateCode?: string;
  contactMobile?: string;
  isReceiptFormat?: boolean;
}

export function PrintPartyDetails({
  partyName,
  partyAddress,
  partyGstin,
  state = "",
  stateCode = "",
  contactMobile = "",
  isReceiptFormat = false
}: PrintPartyDetailsProps) {
  return (
    <div className="grid grid-cols-12 border-x border-b border-black divide-x divide-black text-[9.5px]">
      <div className="col-span-7 divide-y divide-black flex flex-col justify-between">
        <div className="p-2 flex items-center gap-2">
          <span className="w-20 font-bold text-slate-500 uppercase text-[8px] shrink-0">Party Name</span>
          <span className="flex-1 font-black text-black uppercase text-[11px] pb-0.5 border-b border-dotted border-slate-300">{partyName}</span>
        </div>
        <div className="p-2 flex items-center gap-2">
          <span className="w-20 font-bold text-slate-500 uppercase text-[8px] shrink-0">Place</span>
          <span className="flex-1 font-bold text-slate-800 text-[10px] pb-0.5 border-b border-dotted border-slate-300 leading-tight">
            {partyAddress}
          </span>
        </div>
      </div>
      <div className="col-span-5 flex flex-col divide-y divide-black font-bold text-[9px]">
        <div className="p-2 flex items-center justify-between">
          <span className="text-slate-550 text-slate-500 uppercase text-[7.5px]">Party's GSTIN / Aadhar No.</span>
          <span className="text-black font-mono text-[9.5px] font-black">{partyGstin || "N/A"}</span>
        </div>
        {isReceiptFormat ? (
          <div className="grid grid-cols-2 divide-x divide-black flex-1">
            <div className="p-2 flex flex-col justify-between">
              <span className="text-slate-500 uppercase text-[7px]">Contact Mobile</span>
              <span className="text-black text-[9.5px] font-extrabold">{contactMobile || "N/A"}</span>
            </div>
            <div className="p-2 flex flex-col justify-between">
              <span className="text-slate-500 uppercase text-[7px]">State/Code</span>
              <span className="text-black text-[9.5px] font-extrabold">{state || "N/A"}{stateCode ? ` / ${stateCode}` : ""}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-black flex-1">
            <div className="p-2 flex flex-col justify-between">
              <span className="text-slate-555 text-slate-500 uppercase text-[7px]">State</span>
              <span className="text-black text-[9.5px] font-extrabold">{state}</span>
            </div>
            <div className="p-2 flex flex-col justify-between">
              <span className="text-slate-555 text-slate-500 uppercase text-[7px]">Code</span>
              <span className="text-black text-[9.5px] font-extrabold">{stateCode}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Reusable Signatures Footer ---
interface PrintSignaturesProps {
  leftLabel: string;
  leftValue: string;
  centerText: string;
  centerSub: string;
}

export function PrintSignatures({
  leftLabel,
  leftValue,
  centerText,
  centerSub
}: PrintSignaturesProps) {
  return (
    <div className="grid grid-cols-3 border border-black divide-x divide-black text-[9px] font-bold text-center h-20 bg-white">
      <div className="p-1.5 flex flex-col justify-between h-full">
        <span className="text-slate-500 block uppercase text-[7.5px]">{leftLabel}</span>
        <div className="border-t border-dashed border-slate-350 pt-0.5 text-slate-700">{leftValue}</div>
      </div>
      <div className="p-1.5 flex flex-col justify-between h-full">
        <div className="text-slate-750 leading-tight text-[8px] font-semibold italic text-slate-600">
          {centerText}
        </div>
        <div className="text-[8px] text-slate-400">{centerSub}</div>
      </div>
      <div className="p-1.5 flex flex-col justify-between h-full">
        <span className="text-black uppercase text-[7.5px] font-black">For {COMPANY_DETAILS.name}</span>
        <div className="border-t border-dashed border-slate-350 pt-0.5 text-slate-700 font-extrabold">Authorised Signatory</div>
      </div>
    </div>
  );
}

// --- Print Preview Modal Wrapper ---
interface PrintPreviewModalProps {
  title: string;
  onClose: () => void;
  onPrint: () => void;
  printBtnLabel: string;
  printableId: string;
  children: React.ReactNode;
}

export function PrintPreviewModal({
  title,
  onClose,
  onPrint,
  printBtnLabel,
  printableId,
  children
}: PrintPreviewModalProps) {
  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in print:bg-white print:p-0 print:absolute print:inset-0 print-preview-modal-portal">
      <PrintStyles printableId={printableId} />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:m-0 print:p-0">
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between print:hidden shrink-0">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-950/20 overflow-auto flex-1 print:overflow-visible print:p-0 print:bg-white font-sans">
          {children}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-2 print:hidden shrink-0">
          <Button variant="secondary" onClick={onClose}>
            Close View
          </Button>
          <Button onClick={onPrint} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-1">
            <Printer className="h-4 w-4" />
            <span>{printBtnLabel}</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Order Print Document Component ---
interface OrderPrintDocumentProps {
  order: any;
  party: any;
  products: any[];
  onClose: () => void;
}

export function OrderPrintDocument({
  order,
  party,
  products,
  onClose
}: OrderPrintDocumentProps) {
  const isInvoice = order.orderType === "Invoice";
  const title = isInvoice ? "Tax Invoice" : "Estimate";
  const docNumber = isInvoice ? order.orderNumber : `B ${order.id}`;
  const printableId = "printable-order";

  const handlePrint = () => {
    const originalTitle = document.title;
    const typeLabel = isInvoice ? "Tax_Invoice" : "Estimate";
    document.title = `${typeLabel}_${order.orderNumber || order.id}`;
    window.print();
    document.title = originalTitle;
    onClose();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const baseTotal = order.items.reduce((sum: number, item: any) => sum + (item.qtyOrdered * item.unitPrice), 0);
  const cgstTotal = order.items.reduce((sum: number, item: any) => sum + ((item.qtyOrdered * item.unitPrice) * ((item.cgst ?? 0) / 100)), 0);
  const sgstTotal = order.items.reduce((sum: number, item: any) => sum + ((item.qtyOrdered * item.unitPrice) * ((item.sgst ?? 0) / 100)), 0);
  const grandTotal = isInvoice ? (baseTotal + cgstTotal + sgstTotal) : baseTotal;

  const uniqueCgst = order.items.find((i: any) => (i.cgst ?? 0) > 0)?.cgst ?? 0;
  const uniqueSgst = order.items.find((i: any) => (i.sgst ?? 0) > 0)?.sgst ?? 0;

  const partyAddress = party
    ? `${party.address || ""}${party.city ? `, ${party.city}` : ""}${party.state ? `, ${party.state}` : ""}${party.pinCode ? ` - ${party.pinCode}` : ""}`
    : "";

  return createPortal(
    <div style={{ display: "none" }} className="print-container-wrapper">
      <style>{`
        @media print {
          .print-container-wrapper {
            display: block !important;
          }
        }
      `}</style>
      <PrintStyles printableId={printableId} />
      <div id={printableId} className="w-[190mm] min-w-[190mm] h-auto mx-auto border border-black p-4 bg-white text-black flex flex-col gap-1 shadow-lg print:shadow-none print:my-0 print:p-0 my-2">
        <div className="space-y-1">
          <PrintHeader
            title={isInvoice ? "TAX INVOICE" : "ESTIMATE"}
            docNumber={docNumber}
            docDate={order.orderDate}
            deliveryMode={order.deliveryMode || ""}
            textRedClass="text-red-650"
          />

          <PrintPartyDetails
            partyName={party?.name || ""}
            partyAddress={partyAddress}
            partyGstin={party?.gstNumber || party?.gstin || ""}
            state={party?.state || ""}
            stateCode={party?.stateCode || ""}
          />

          {isInvoice ? (
            /* --- TAX INVOICE ITEMS & TOTALS --- */
            <>
              <div className="overflow-hidden">
                <table className="w-full text-[9.5px] text-left border-collapse border-x border-b border-black">
                  <thead>
                    <tr className="bg-slate-800 text-white font-extrabold uppercase text-[8.5px] tracking-wider text-center divide-x divide-black border-b border-black">
                      <th className="p-1.5 w-10">Sr. No.</th>
                      <th className="p-1.5 text-left border-r border-black border-l">Name of Product / Service</th>
                      <th className="p-1.5 w-20 text-center border-r border-black">HSN Code</th>
                      <th className="p-1.5 w-16 text-center border-r border-black">Qty.</th>
                      <th className="p-1.5 w-20 text-right border-r border-black">Rate</th>
                      <th className="p-1.5 w-16 text-center border-r border-black">GST %</th>
                      <th className="p-1.5 w-24 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-black">
                    {order.items.map((item: any, idx: number) => {
                      const prod = products.find((p) => p.id === item.productId);
                      const nameToDisplay = item.productName || prod?.name || "N/A";
                      const base = item.qtyOrdered * item.unitPrice;
                      const gstRate = (item.cgst ?? 0) + (item.sgst ?? 0);
                      return (
                        <tr key={idx} className="divide-x divide-black font-bold text-center h-[25px] align-middle">
                          <td className="p-1">{idx + 1}</td>
                          <td className="p-1 text-left uppercase font-extrabold text-[9.5px]">{nameToDisplay}</td>
                          <td className="p-1 font-mono"></td>
                          <td className="p-1 font-mono font-black text-[9.5px]">{item.qtyOrdered}</td>
                          <td className="p-1 text-right font-mono">₹{item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="p-1 font-mono">{gstRate > 0 ? `${gstRate}%` : ""}</td>
                          <td className="p-1 text-right font-mono font-black">₹{base.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-12 border border-black divide-x divide-black text-[9.5px] mt-1 bg-white">
                <div className="col-span-7 p-2.5 flex flex-col justify-between space-y-3 bg-white">
                  <div className="space-y-0.5">
                    <span className="text-[7.5px] text-slate-500 uppercase font-black block">Rs. in Words:</span>
                    <span className="font-extrabold text-black text-[10.5px] leading-tight block mt-0.5">
                      {numberToWordsINR(grandTotal)}
                    </span>
                  </div>
                  <div className="border border-black p-1.5 rounded bg-slate-50 space-y-1">
                    <span className="text-[7.5px] text-slate-500 uppercase font-black block">Bank Details</span>
                    <div className="grid grid-cols-3 gap-1 text-[8.5px] font-bold text-slate-800">
                      <div>Bank: <strong className="text-black">{COMPANY_DETAILS.bankDetails.bankName}</strong></div>
                      <div>A/C No: <strong className="text-black font-mono">{COMPANY_DETAILS.bankDetails.accountNumber}</strong></div>
                      <div>IFSC: <strong className="text-black font-mono">{COMPANY_DETAILS.bankDetails.ifscCode}</strong></div>
                    </div>
                  </div>
                </div>
                <div className="col-span-5 font-bold divide-y divide-black text-[9.5px] flex flex-col justify-between bg-white">
                  <div className="p-1.5 flex justify-between">
                    <span className="text-slate-550">Total Amount:</span>
                    <span className="font-mono text-black font-black">₹{baseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="p-1.5 flex justify-between">
                    <span className="text-slate-550">Discount:</span>
                    <span className="font-mono text-black"></span>
                  </div>
                  <div className="p-1.5 flex justify-between bg-slate-50">
                    <span className="text-slate-700 font-extrabold">Taxable Value:</span>
                    <span className="font-mono text-black font-black">₹{baseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="p-1.5 flex justify-between">
                    <span className="text-slate-550">CGST {uniqueCgst > 0 ? `${uniqueCgst}%` : ""}:</span>
                    <span className="font-mono text-black font-bold">₹{cgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="p-1.5 flex justify-between">
                    <span className="text-slate-550">SGST {uniqueSgst > 0 ? `${uniqueSgst}%` : ""}:</span>
                    <span className="font-mono text-black font-bold">₹{sgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="p-1.5 flex justify-between">
                    <span className="text-slate-550">IGST:</span>
                    <span className="font-mono text-black"></span>
                  </div>
                  <div className="p-1.5 flex justify-between bg-slate-100 text-black font-extrabold text-xs border-t border-black">
                    <span>Invoice Total:</span>
                    <span className="font-mono text-black font-black">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* --- ESTIMATE ITEMS & TOTALS --- */
            <>
              <div className="overflow-hidden">
                <table className="w-full text-[9.5px] text-left border-collapse border-x border-b border-black">
                  <thead>
                    <tr className="bg-slate-800 text-white font-extrabold uppercase text-[8.5px] tracking-wider divide-x divide-black text-center border-b border-black">
                      <th className="p-1.5 w-10">Sr. No.</th>
                      <th className="p-1.5 text-left border-r border-black border-l">Item Name</th>
                      <th className="p-1.5 w-16 border-r border-black">Qty.</th>
                      <th className="p-1.5 w-20 border-r border-black">Rate</th>
                      <th className="p-1.5 w-24 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-black">
                    {order.items.map((item: any, idx: number) => {
                      const prod = products.find((p) => p.id === item.productId);
                      const nameToDisplay = item.productName || prod?.name || "N/A";
                      const base = item.qtyOrdered * item.unitPrice;
                      return (
                        <tr key={idx} className="divide-x divide-black font-bold text-center h-[25px] align-middle">
                          <td className="p-1">{idx + 1}</td>
                          <td className="p-1 text-left uppercase font-extrabold text-[9.5px]">{nameToDisplay}</td>
                          <td className="p-1 font-mono font-black text-[9.5px]">{item.qtyOrdered}</td>
                          <td className="p-1 font-mono text-right">₹{item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="p-1 text-right font-mono font-black">₹{base.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-black divide-x divide-black font-black text-black text-center bg-slate-50">
                      <td className="p-1.5"></td>
                      <td className="p-1.5 text-left uppercase text-[8.5px] font-black">Total</td>
                      <td className="p-1.5 font-mono font-black text-[10px]">
                        {order.items.reduce((sum: number, item: any) => sum + item.qtyOrdered, 0)}
                      </td>
                      <td className="p-1.5"></td>
                      <td className="p-1.5 text-right font-mono font-black text-[10px]">
                        ₹{baseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-12 border border-black divide-x divide-black text-[9.5px] mt-1 bg-white">
                <div className="col-span-7 flex flex-col justify-between divide-y divide-black bg-white">
                  <div className="p-2.5 bg-white font-black text-black text-[10.5px] leading-tight flex-1 flex items-center">
                    <div className="space-y-0.5 w-full">
                      <span className="text-[7.5px] text-slate-550 uppercase font-black block">Rs. in Words:</span>
                      <span className="font-extrabold text-black text-[10.5px] leading-tight block mt-0.5">
                        {numberToWordsINR(baseTotal)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 divide-x divide-black font-bold text-center text-[8.5px] bg-slate-50">
                    <div className="p-1.5">
                      <span className="text-slate-500 uppercase block text-[7px] mb-0.5">Previous Bal.</span>
                      <span className="text-black font-mono"></span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-slate-500 uppercase block text-[7px] mb-0.5">Current Bill Amt</span>
                      <span className="text-black font-mono font-black text-[9.5px]">
                        ₹{baseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-slate-500 uppercase block text-[7px] mb-0.5">Payment Received</span>
                      <span className="text-black font-mono"></span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-slate-500 uppercase block text-[7px] mb-0.5">Total Bal</span>
                      <span className="text-black font-mono"></span>
                    </div>
                  </div>
                </div>

                <div className="col-span-5 font-bold divide-y divide-black text-[9.5px] flex flex-col justify-between bg-white">
                  <div className="p-1.5 flex justify-between items-center">
                    <span className="text-slate-550 uppercase text-[7.5px]">LESS *** %:</span>
                    <span className="font-mono text-black"></span>
                  </div>
                  <div className="p-1.5 flex justify-between items-center">
                    <span className="text-slate-550 uppercase text-[7.5px]">ADD *** %:</span>
                    <span className="font-mono text-black"></span>
                  </div>
                  <div className="p-1.5 flex justify-between items-center">
                    <span className="text-slate-550 uppercase text-[7.5px]">ROUNDING OFF:</span>
                    <span className="font-mono text-black">0.00</span>
                  </div>
                  <div className="p-1.5 flex justify-between items-center bg-slate-100 text-black font-extrabold text-xs border-t border-black">
                    <span className="uppercase tracking-wider">Bill Amt:</span>
                    <span className="font-mono text-xs font-black">
                      ₹{baseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          <PrintSignatures
            leftLabel="Goods Received by"
            leftValue="Receiver's Signature"
            centerText="Certified that the above particulars are true & correct."
            centerSub="Declaration & Stamp"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Payment Receipt Print Document Component ---
interface PaymentReceiptPrintDocumentProps {
  receipt: any;
  customer: any;
  onClose: () => void;
}

export function PaymentReceiptPrintDocument({
  receipt,
  customer,
  onClose
}: PaymentReceiptPrintDocumentProps) {
  const printableId = "printable-receipt";

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Payment_Receipt_${receipt.receiptNumber || receipt.id}`;
    window.print();
    document.title = originalTitle;
    onClose();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const customerAddress = customer
    ? `${customer.address || "Address"}${customer.city ? `, ${customer.city}` : ""}${customer.state ? `, ${customer.state}` : ""}${customer.pinCode ? ` - ${customer.pinCode}` : ""}`
    : "Address";

  return createPortal(
    <div style={{ display: "none" }} className="print-container-wrapper">
      <style>{`
        @media print {
          .print-container-wrapper {
            display: block !important;
          }
        }
      `}</style>
      <PrintStyles printableId={printableId} />
      <div id={printableId} className="w-[190mm] min-w-[190mm] h-auto mx-auto border border-black p-4 bg-white text-black flex flex-col gap-1 shadow-lg print:shadow-none print:my-0 print:p-0 my-2">
        <div className="space-y-1">
          <PrintHeader
            title="PAYMENT RECEIPT"
            docNumber={receipt.receiptNumber}
            docDate={receipt.paymentDate}
            receivedByLabel="Received By (Staff)"
            receivedByValue={receipt.receivedBy}
            textRedClass="text-red-655"
          />

          <PrintPartyDetails
            partyName={customer?.name || receipt.receivedBy}
            partyAddress={customerAddress}
            partyGstin={customer?.gstNumber || customer?.gstin || ""}
            contactMobile={customer?.primaryMobile || customer?.mobile || ""}
            state={customer?.state || ""}
            stateCode={customer?.stateCode || ""}
            isReceiptFormat={true}
          />

          <div className="overflow-hidden">
            <table className="w-full text-[10px] text-left border-collapse border-x border-b border-black">
              <thead>
                <tr className="bg-slate-800 text-white font-extrabold uppercase text-[8.5px] tracking-wider divide-x divide-black text-center border-b border-black">
                  <th className="p-2 w-12 text-center">Sr. No.</th>
                  <th className="p-2 text-left border-r border-black border-l">Description / Particulars</th>
                  <th className="p-2 w-32 border-r border-black">Payment Mode</th>
                  <th className="p-2 w-44 border-r border-black">Reference / Txn ID</th>
                  <th className="p-2 w-32 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody>
                <tr className="divide-x divide-black border-b border-black text-center h-28 align-top">
                  <td className="p-2 font-mono text-center">1.</td>
                  <td className="p-2 text-left border-r border-black border-l">
                    <span className="font-bold text-black block">Payment Collection Receipt</span>
                    <span className="text-[9.5px] text-slate-600 block mt-1 leading-normal font-semibold">
                      Receipt against outstanding balance / invoice credit ledger posting.
                    </span>
                    {receipt.remarks && (
                      <span className="text-[9.5px] text-slate-700 block mt-2 leading-relaxed bg-slate-50 p-1.5 border border-dashed border-slate-300 rounded font-semibold">
                        <strong>Remarks:</strong> {receipt.remarks}
                      </span>
                    )}
                  </td>
                  <td className="p-2 font-bold text-slate-800 text-center">{receipt.paymentMode}</td>
                  <td className="p-2 font-mono text-slate-700 text-center">{receipt.referenceNumber || "N/A"}</td>
                  <td className="p-2 text-right font-black font-mono text-black">
                    ₹{receipt.amountReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr className="bg-slate-50 font-bold divide-x divide-black border-b border-black">
                  <td colSpan={2} className="p-2 text-[9.5px] text-slate-600 italic">
                    Amount in words: <strong className="text-black not-italic">{numberToWordsINR(receipt.amountReceived)}</strong>
                  </td>
                  <td colSpan={2} className="p-2 text-right text-slate-700 font-extrabold uppercase text-[8px] tracking-wider">
                    Total Amount Received:
                  </td>
                  <td className="p-2 text-right font-black font-mono text-black text-xs bg-slate-100">
                    ₹{receipt.amountReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <PrintSignatures
            leftLabel="Depositor's Signature"
            leftValue="Signature of Payer"
            centerText="Certified that the payment has been successfully recorded in the ledger."
            centerSub="Computer Generated Receipt"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
