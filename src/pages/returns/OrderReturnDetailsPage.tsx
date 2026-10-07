import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Loader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { orderReturnService } from "@/services";

export default function OrderReturnDetailsPage() {
  const { returnId } = useParams<{ returnId: string }>();
  const navigate = useNavigate();

  const [returnData, setReturnData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReturnDetails = useCallback(async () => {
    if (!returnId) return;
    setLoading(true);
    try {
      const response = await orderReturnService.getOrderReturnById(parseInt(returnId));
      if (response.data.responseStatus === "Success" && response.data.data) {
        setReturnData(response.data.data);
      } else {
        toast.error("Failed to load return details.");
        navigate("/returns");
      }
    } catch (err) {
      console.error("Failed to fetch return details:", err);
      toast.error("Error loading return details.");
      navigate("/returns");
    } finally {
      setLoading(false);
    }
  }, [returnId, navigate]);

  useEffect(() => {
    fetchReturnDetails();
  }, [fetchReturnDetails]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader fullScreen={false} text="Loading return details..." />
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-650 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Return Note Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested return record could not be loaded or does not exist.
        </p>
        <Button onClick={() => navigate("/returns")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Returns
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs">
      <PageHeader
        title={`Return Details Note: RET-${returnData.returnId}`}
        description={`Processed on ${formatDate(returnData.returnDate)}`}
        backUrl="/returns"
      />

      {/* Grid container: Split on desktop (lg), Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left Column: Return Info Card with merged Summary stats */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4.5 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5">
            Return Summary
          </h3>

          <div className="space-y-3.5">
            <div>
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Party Account</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                {returnData.partyName}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block">Order Reference</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block font-mono">
                ORD-{returnData.orderId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Return Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                  {formatDate(returnData.returnDate)}
                </span>
              </div>

            </div>

            {/* Return Reason remarks */}
            <div className="border-t border-slate-100 dark:border-slate-805 pt-3">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Reason / Remarks</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 break-words whitespace-pre-wrap">
                {returnData.reason || "No remarks provided"}
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: Returned Products Table Card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4.5 space-y-3 lg:self-stretch flex flex-col justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Returned Products Details</h3>
              <div className="text-right">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Total Return</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-450 text-sm block">
                  ₹{returnData.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <DataTable
              headers={["#", "Product Name", "Qty Returned", "Rate (₹)", "Total Amount (₹)"]}
              headerClassNames={["w-12 text-center", "", "text-right", "text-right", "text-right"]}
              emptyMessage="No items listed in return detail."
            >
              {(returnData.orderReturnDetails || []).map((item: any, idx: number) => {
                const rateVal = item.rate || (item.qty > 0 ? (item.amount / item.qty) : 0);
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-center text-slate-500 dark:text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.productName || `Product #${item.productId}`}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                      {item.qty} Qty
                    </td>
                    <td className="p-3 text-right text-slate-500">
                      ₹{rateVal.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-950 dark:text-slate-100">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          </div>
        </div>

      </div>
    </div>
  );
}
