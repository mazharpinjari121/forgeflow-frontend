import { Download, FileText } from "lucide-react";
import { Button } from "./button";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { createPortal } from "react-dom";

interface KPIItem {
  label: string;
  value: string | number;
}

interface ExportButtonsProps {
  fileName: string;
  reportTitle: string;
  // CSV Config
  csvHeaders: string;
  csvRows: any[][];
  // PDF Config
  tableHeaders: string[];
  tableRows: any[][]; // 2D array representing rows and columns
  kpis?: KPIItem[];
  selectedPartyDetails?: string;
  disabled?: boolean;
}

export function ExportButtons({
  fileName,
  reportTitle,
  csvHeaders,
  csvRows,
  tableHeaders,
  tableRows,
  kpis,
  selectedPartyDetails,
  disabled = false,
}: ExportButtonsProps) {

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headerRows: string[] = [];

      // Company Info Header
      headerRows.push(`"${COMPANY_NAME}"`);
      headerRows.push(`"${COMPANY_TAGLINE}"`);
      headerRows.push(`"${COMPANY_ADDRESS}"`);
      headerRows.push(`"GSTIN: ${COMPANY_GSTIN}"`);
      headerRows.push(""); // Spacer row

      // Report details
      headerRows.push(`"Report Title:","${reportTitle}"`);
      headerRows.push(`"Date Exported:","${formatDate(new Date().toISOString())}"`);
      
      if (selectedPartyDetails) {
        const cleanPartyDetails = selectedPartyDetails.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        headerRows.push(`"Party Info:","${cleanPartyDetails}"`);
      }
      headerRows.push(""); // Spacer row

      // KPIs
      if (kpis && kpis.length > 0) {
        headerRows.push(`"Key Performance Indicators (KPIs)"`);
        kpis.forEach(kpi => {
          headerRows.push(`"${kpi.label}:","${kpi.value}"`);
        });
        headerRows.push(""); // Spacer row
      }

      headerRows.push(`"Report Data"`);

      const csvContent = 
        headerRows.join("\n") + "\n" +
        csvHeaders + "\n" + 
        csvRows.map(row => 
          row.map(val => {
            if (val === null || val === undefined) return '""';
            const str = val.toString().replace(/"/g, '""');
            return `"${str}"`;
          }).join(",")
        ).join("\n");

      // Add UTF-8 Byte Order Mark (BOM) to force Excel to read UTF-8 correctly
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${reportTitle} CSV exported successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export CSV.");
    }
  };

  // Export to PDF (Print layout)
  const handleExportPDF = () => {
    try {
      window.print();
      toast.success("PDF generation dialog opened!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.");
    }
  };

  const COMPANY_NAME = "SUPER STEEL WORKS";
  const COMPANY_TAGLINE = "DEALERS IN STEEL & WOODEN FURNITURE";
  const COMPANY_ADDRESS = "D-38, Ajanta Road, MIDC, Jalgaon. Mob. 9225122238";
  const COMPANY_GSTIN = "27BARPS0793J1ZW";

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          onClick={handleExportPDF}
          disabled={disabled}
          variant="secondary"
          className="flex items-center justify-center h-9 px-3 gap-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 bg-secondary text-slate-700 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700"
          title="Export PDF"
        >
          <FileText className="h-4 w-4 text-red-655" />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>

        <Button
          onClick={handleExportCSV}
          disabled={disabled}
          variant="secondary"
          className="flex items-center justify-center h-9 px-3 gap-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 bg-secondary text-slate-700 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700"
          title="Export CSV"
        >
          <Download className="h-4 w-4 text-emerald-600" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </div>

      {/* Hidden Print Container (Visible only when window.print() is called) */}
      {createPortal(
        <div id="report-print-container" style={{ display: "none" }} className="print-container-wrapper">
          <style>{`
            @media print {
              #root {
                display: none !important;
              }
              body > *:not(.print-container-wrapper):not(.print-preview-modal-portal) {
                display: none !important;
              }
              .print-container-wrapper {
                display: block !important;
                width: 190mm !important;
                min-width: 190mm !important;
              }
              #report-print-container {
                display: block !important;
                position: relative !important;
                margin: 0 auto !important;
                width: 190mm !important;
                min-width: 190mm !important;
                max-width: 190mm !important;
                box-sizing: border-box !important;
                color: #000 !important;
                background-color: #fff !important;
                padding: 4mm !important;
                font-family: sans-serif !important;
              }
              #report-print-container * {
                border-color: #000 !important;
              }
              #report-print-container table {
                border-collapse: collapse !important;
                width: 100% !important;
                margin-top: 10px !important;
              }
              #report-print-container th,
              #report-print-container td {
                border: 1.5px solid #000 !important;
                padding: 6px 8px !important;
                text-align: center !important;
                color: #000 !important;
                vertical-align: middle !important;
              }
              #report-print-container th {
                background-color: #f1f5f9 !important;
                color: #000 !important;
                font-weight: 800 !important;
                text-transform: uppercase !important;
                font-size: 8.5px !important;
              }
              #report-print-container td {
                font-size: 9px !important;
                font-weight: 700 !important;
              }
              #report-print-container .kpi-box {
                border: 1.5px solid #000 !important;
                background-color: #f8fafc !important;
                padding: 8px !important;
                border-radius: 4px !important;
              }
              @page {
                size: A4 portrait;
                margin: 10mm 10mm 10mm 10mm;
              }
            }
          `}</style>

          {/* Company Header Block */}
          <div className="border border-black p-4 flex justify-between items-center bg-white mb-4">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                className="h-16 w-16 object-contain shrink-0"
                alt="Logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/super-steel-logo.png";
                }}
              />
              <div className="space-y-0.5">
                <h1 className="text-lg font-black tracking-tight text-black leading-tight">{COMPANY_NAME}</h1>
                <p className="text-[8px] font-bold text-slate-800 leading-tight uppercase tracking-wider">{COMPANY_TAGLINE}</p>
                <p className="text-[8px] text-slate-650 font-semibold leading-tight">{COMPANY_ADDRESS}</p>
              </div>
            </div>
            <div className="text-right font-bold text-[8.5px] leading-tight space-y-1">
              <div><span className="text-slate-550 uppercase text-[7px]">GSTIN: </span><span className="text-black font-mono text-[9px] font-black">{COMPANY_GSTIN}</span></div>
              <div className="text-sm font-black uppercase text-black pt-1">{reportTitle}</div>
              <div className="text-[8.5px] text-slate-500 font-mono">Date Printed: {formatDate(new Date().toISOString())}</div>
            </div>
          </div>

          {/* Context Details */}
          {selectedPartyDetails && (
            <div className="border border-black p-2.5 bg-slate-50 mb-4 text-[9.5px] font-bold text-black leading-relaxed border-t-0 -mt-4 border-b border-black">
              {selectedPartyDetails}
            </div>
          )}

          {/* KPI Cards Row */}
          {kpis && kpis.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="kpi-box flex flex-col justify-between">
                  <span className="text-[7.5px] text-slate-600 uppercase font-extrabold tracking-wider block">{kpi.label}</span>
                  <span className="font-mono text-xs font-black text-black block mt-0.5">{kpi.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Grid Table Data */}
          <div className="border border-black overflow-hidden bg-white">
            <table className="w-full text-[9px] text-left border-collapse">
              <thead>
                <tr>
                  <th className="w-10">Sr. No.</th>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="font-mono">{rowIdx + 1}</td>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
