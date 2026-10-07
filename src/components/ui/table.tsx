import * as React from "react";
import { Loader } from "@/components/common/Loader";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText, Eye } from "lucide-react";

export interface DataTableProps {
  loading?: boolean;
  loadingText?: string;
  headers: React.ReactNode[];
  headerClassNames?: string[];
  emptyMessage?: string;
  emptyColSpan?: number;
  className?: string;
  tableClassName?: string;
  theadClassName?: string;
  children: React.ReactNode;
}

// Recursive helper to extract raw text content from a React Node
const getElementText = (node: React.ReactNode): string => {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getElementText).join(" ");
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode } | undefined;
    return getElementText(props?.children);
  }
  return "";
};

const getThemeColor = (status: any, index: number) => {
  const statusStr = String(status || "").toLowerCase();
  if (
    statusStr.includes("active") ||
    statusStr.includes("success") ||
    statusStr.includes("delivered") ||
    statusStr.includes("paid")
  ) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (
    statusStr.includes("inactive") ||
    statusStr.includes("cancelled") ||
    statusStr.includes("disabled") ||
    statusStr.includes("neutral")
  ) {
    return {
      border: "border-l-slate-300 dark:border-l-slate-700",
      bg: "bg-slate-50 dark:bg-slate-800/50",
      text: "text-slate-500 dark:text-slate-400",
    };
  }
  if (
    statusStr.includes("pending") ||
    statusStr.includes("warning") ||
    statusStr.includes("estimate") ||
    statusStr.includes("partially") ||
    statusStr.includes("overdue")
  ) {
    return {
      border: "border-l-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      text: "text-amber-600 dark:text-amber-400",
    };
  }
  if (statusStr.includes("danger") || statusStr.includes("error") || statusStr.includes("failed")) {
    return {
      border: "border-l-rose-500",
      bg: "bg-rose-50 dark:bg-rose-950/20",
      text: "text-rose-600 dark:text-rose-400",
    };
  }
  // Default color rotation based on index
  const colors = [
    { border: "", bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-600 dark:text-blue-400" },
    // { border: "border-l-violet-500", bg: "bg-violet-50 dark:bg-violet-950/20", text: "text-violet-600 dark:text-violet-400" },
    { border: "border-l-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/20", text: "text-indigo-600 dark:text-indigo-400" },
  ];
  return colors[index % colors.length];
};

export function DataTable({
  loading,
  loadingText = "Loading...",
  headers,
  headerClassNames = [],
  emptyMessage = "No entries found.",
  emptyColSpan,
  className,
  tableClassName,
  theadClassName,
  children,
}: DataTableProps) {
  const colSpan = emptyColSpan || headers.length;

  // Filter out falsy children to check if any rows actually exist
  const childrenArray = React.Children.toArray(children).filter(Boolean);
  const isEmpty = childrenArray.length === 0;

  // Manage expanded rows for mobile views
  const [expandedRows, setExpandedRows] = React.useState<Record<number, boolean>>({});

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const renderMobileCards = () => {
    return childrenArray.map((rowChild, rowIdx) => {
      if (!React.isValidElement(rowChild)) return null;

      // Extract cells of this row
      const rowProps = rowChild.props as any;
      const cells = React.Children.toArray(rowProps.children).filter(Boolean);

      let idVal: React.ReactNode = null;
      let titleVal: React.ReactNode = null;
      let statusVal: React.ReactNode = null;
      let dateVal: React.ReactNode = null;
      let actionsVal: React.ReactNode = null;
      const details: Array<{ label: string; value: React.ReactNode }> = [];

      cells.forEach((cellChild, idx) => {
        if (!React.isValidElement(cellChild)) return;
        const cellProps = cellChild.props as any;
        const rawHeader = headers[idx];

        let headerStr = "";
        if (typeof rawHeader === "string") {
          headerStr = rawHeader;
        } else if (React.isValidElement(rawHeader)) {
          headerStr = getElementText(rawHeader);
        }

        const headerLower = headerStr.toLowerCase().trim();
        const isHeaderSerial = headerLower === "#" || headerLower === "s.no" || headerLower === "s.no." || headerLower === "sr. no." || headerLower === "sr.no" || headerLower === "serial number" || headerLower === "serial no";
        const cellText = getElementText(cellProps.children).trim();
        const isSerial = isHeaderSerial && /^\d+$/.test(cellText);

        if (isSerial) {
          // Do not treat serial numbers as ID values
        } else if (headerLower === "id" || headerLower.includes("code") || headerLower.includes("number") || isHeaderSerial) {
          idVal = cellProps.children;
        } else if (
          headerLower.includes("name") ||
          headerLower.includes("title") ||
          headerLower.includes("user") ||
          headerLower.includes("party") ||
          headerLower.includes("product") ||
          headerLower.includes("category")
        ) {
          if (!titleVal) {
            titleVal = cellProps.children;
          } else {
            details.push({ label: headerStr, value: cellProps.children });
          }
        } else if (headerLower.includes("status") || headerLower.includes("active")) {
          statusVal = cellProps.children;
        } else if (headerLower.includes("date")) {
          dateVal = cellProps.children;
          details.push({ label: headerStr, value: cellProps.children });
        } else if (headerLower.includes("actions") || headerLower.includes("operations") || headerLower.includes("action")) {
          actionsVal = cellProps.children;
        } else {
          details.push({ label: headerStr, value: cellProps.children });
        }
      });

      // Fallbacks
      if (!titleVal && cells.length > 0) {
        const titleIdx = idVal && cells.length > 1 ? 1 : 0;
        const titleCell = cells[titleIdx];
        if (React.isValidElement(titleCell)) {
          titleVal = (titleCell.props as any).children;
        }
      }
      if (!idVal && cells.length > 0) {
        const firstHeaderStr = typeof headers[0] === "string" ? headers[0] : getElementText(headers[0]);
        const firstHeaderLower = firstHeaderStr.toLowerCase().trim();
        const isFirstHeaderSerial = firstHeaderLower === "#" || firstHeaderLower === "s.no" || firstHeaderLower === "s.no." || firstHeaderLower === "sr. no." || firstHeaderLower === "sr.no" || firstHeaderLower === "serial number" || firstHeaderLower === "serial no";
        const firstCell = cells[0];
        const firstCellText = React.isValidElement(firstCell) ? getElementText((firstCell.props as any).children).trim() : "";
        const isFirstSerial = isFirstHeaderSerial && /^\d+$/.test(firstCellText);

        if (!isFirstSerial) {
          if (React.isValidElement(firstCell)) {
            idVal = (firstCell.props as any).children;
          }
        }
      }

      let finalDetails = [...details];
      if (dateVal && !statusVal) {
        finalDetails = finalDetails.filter(d => {
          const l = d.label.toLowerCase();
          return l !== "date" && !l.includes("date");
        });
      }

      // Sort finalDetails: Order ID first, Amount second, Reason/Remarks last
      finalDetails.sort((a, b) => {
        const aLabel = a.label.toLowerCase();
        const bLabel = b.label.toLowerCase();

        const getWeight = (label: string) => {
          if (label.includes("order")) return 1;
          if (label.includes("amount") || label.includes("price") || label.includes("total") || label.includes("value")) return 2;
          if (label.includes("reason") || label.includes("remark") || label.includes("desc") || label.includes("comment")) return 99;
          return 50;
        };

        return getWeight(aLabel) - getWeight(bLabel);
      });

      const showChevron = finalDetails.length > 0;
      const isExpanded = !!expandedRows[rowIdx];

      // Determine colors based on extracted status text
      const statusText = getElementText(statusVal);
      const colorTheme = getThemeColor(statusText, rowIdx);

      return (
        <div
          key={rowIdx}
          className={cn(
            "border-l-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 hover:shadow-md",
            // colorTheme.border
          )}
        >
          {/* Card Header */}
          <div
            className={cn(
              "flex items-center justify-between p-4 select-none",
              showChevron ? "cursor-pointer" : ""
            )}
            onClick={() => showChevron && toggleRow(rowIdx)}
          >
            <div className="flex items-center gap-3 min-w-0 flex-grow">
              <div className="flex flex-col min-w-0 flex-grow">
                <div
                  onClick={(e) => {
                    const hasRowClick = typeof rowProps.onClick === "function";
                    if (hasRowClick) {
                      e.stopPropagation();
                      rowProps.onClick(e);
                    }
                  }}
                  className={cn(
                    "font-bold text-sm text-blue-600 dark:text-blue-400 pr-1 truncate",
                    typeof rowProps.onClick === "function" ? "cursor-pointer hover:underline" : ""
                  )}
                >
                  {titleVal || "Untitled Entry"}
                </div>
                {(() => {
                  const idText = getElementText(idVal).trim().toLowerCase();
                  const titleText = getElementText(titleVal).trim().toLowerCase();
                  const hasUniqueId = idVal && idText !== titleText && idText !== "";
                  const hasRowClick = typeof rowProps.onClick === "function";
                  return (
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {hasUniqueId && (
                        <span
                          onClick={(e) => {
                            if (hasRowClick) {
                              e.stopPropagation();
                              rowProps.onClick(e);
                            }
                          }}
                          className={cn(
                            hasRowClick ? "text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" : ""
                          )}
                        >
                          ID: {idVal}
                        </span>
                      )}
                      {hasUniqueId && (statusVal || dateVal) && <span className="text-slate-300">•</span>}
                      {statusVal ? (
                        <span className="normal-case font-semibold">{statusVal}</span>
                      ) : dateVal ? (
                        <span className="normal-case font-semibold text-slate-500 dark:text-slate-400">{dateVal}</span>
                      ) : null}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {typeof rowProps.onClick === "function" && (
                <button
                  type="button"
                  className="p-1 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors cursor-pointer"
                  title="View Details"
                  onClick={(e) => {
                    e.stopPropagation();
                    rowProps.onClick(e);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              {actionsVal && (
                <div
                  className="flex items-center gap-1.5 mr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actionsVal}
                </div>
              )}
              {showChevron && (
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRow(rowIdx);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4.5 w-4.5" />
                  ) : (
                    <ChevronDown className="h-4.5 w-4.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Expandable Content Grid */}
          {isExpanded && finalDetails.length > 0 && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-slate-100 dark:border-slate-800/60 pt-3.5 animate-fade-in">
              {finalDetails.map((detail, dIdx) => {
                const labelLower = detail.label.toLowerCase();
                const isFullRow = labelLower.includes("reason") || labelLower.includes("remark") || labelLower.includes("desc") || labelLower.includes("comment") || labelLower.includes("note") || labelLower.includes("message");
                return (
                  <div key={dIdx} className={cn("flex flex-col gap-0.5 min-w-0", isFullRow ? "col-span-2" : "")}>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      {detail.label}
                    </span>
                    <span className={cn(
                      "text-xs font-semibold text-slate-700 dark:text-slate-300",
                      isFullRow ? "break-words whitespace-pre-wrap" : "truncate"
                    )}>
                      {detail.value || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={cn("table-container md:bg-white md:dark:bg-slate-900 bg-transparent dark:bg-transparent md:border md:border-slate-200 md:dark:border-slate-800 md:rounded-xl md:shadow-sm shadow-none border-0 rounded-none flex-grow flex flex-col", className)}>
      {loading ? (
        <div className="flex items-center justify-center py-12 flex-grow">
          <Loader fullScreen={false} text={loadingText} />
        </div>
      ) : isEmpty ? (
        <div className="p-8 text-center text-slate-450 border border-slate-200 dark:border-slate-800 rounded-xl flex-grow flex items-center justify-center">
          {emptyMessage}
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="md:hidden flex flex-col gap-3.5 w-full">
            {renderMobileCards()}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto flex-grow">
            <table className={cn("w-full text-left border-collapse", tableClassName)}>
              <thead>
                <tr className={cn("border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold text-xs", theadClassName)}>
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      className={cn("p-3.5 whitespace-nowrap", headerClassNames[idx] || "")}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {children}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

