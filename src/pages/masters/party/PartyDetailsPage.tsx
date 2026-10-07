import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { partyService } from "@/services/party.service";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Contact, Phone, MapPin, FileText, Globe, Mail, Landmark,
  ShieldAlert, Calendar, Search,
  SlidersHorizontal, FilterX, DollarSign, ShoppingBag, Truck, Info,
  ExternalLink, UserCheck, Receipt
} from "lucide-react";
import { PageHeader, Loader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { PartyRecord } from "@/types/api.types";

export default function PartyDetailsPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [party, setParty] = useState<PartyRecord | null>(null);
  const [partySummary, setPartySummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Role Access Guard: Party Details page is restricted to Admin only!
  if (user?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The Party Details module is restricted to **Administrator** accounts only.
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (partyId) {
      fetchParty(parseInt(partyId));
    }
  }, [partyId]);

  const fetchParty = async (id: number) => {
    setLoading(true);
    try {
      const [partyRes, summaryRes] = await Promise.all([
        partyService.getPartyById(id),
        partyService.getPartySummary(id)
      ]);
      if (partyRes.data.responseStatus === "Success" && partyRes.data.data) {
        setParty(partyRes.data.data);
      }
      if (summaryRes.data.responseStatus === "Success" && summaryRes.data.data) {
        setPartySummary(summaryRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching party details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader fullScreen={false} text="Loading party details..." />
      </div>
    );
  }

  if (!party) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Party Record Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested Party/Customer ID does not exist in the system or may have been deleted.
        </p>
        <Button onClick={() => navigate("/masters/parties")} className="h-9">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Go to Party Master</span>
        </Button>
      </div>
    );
  }

  const partyStats = {
    totalBookedOrders: partySummary ? partySummary.activeBookings : 0,
    lastPaymentAmount: partySummary ? partySummary.lastPaymentAmount : 0,
    lastPaymentDate: partySummary && partySummary.lastPaymentDate ? formatDate(partySummary.lastPaymentDate.split("T")[0]) : "",
  };
  const outstandingBalance = partySummary ? partySummary.outstandingBalance : 0;

  return (
    <div className="space-y-5 animate-fade-in text-slate-800 dark:text-slate-200">
      <PageHeader
        title={party.partyName}
        description={`${party.partyType} • ${party.status}`}
        backUrl="/masters/parties"
      />
      {/* Integrated Party Header & Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full" />
        <div className="p-5">
          {/* Details Content: Compact 4-Column Layout */}
          <div className="space-y-4 text-xs">
            {/* Row 1: 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

              {/* Field 1: Contact Person */}
              <div className="flex items-start gap-2.5">
                <Contact className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Contact Person</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{party.contactPerson}</span>
                </div>
              </div>

              {/* Field 2: Mobile & WhatsApp */}
              <div className="flex items-start gap-2.5">
                <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold block">Mobile & WhatsApp</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex flex-wrap gap-x-2 gap-y-0.5">
                    <a href={`tel:${party.primaryMobile}`} className="text-blue-600 hover:underline font-mono">
                      {party.primaryMobile}
                    </a>
                    {party.whatsAppMobile && (
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                    )}
                    {party.whatsAppMobile && (
                      <a
                        href={`https://wa.me/91${party.whatsAppMobile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline font-mono font-bold inline-flex items-center gap-1"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#25D366" d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24z" />
                          <path fill="white" d="M15.782 13.002c-.229-.115-1.353-.667-1.561-.742-.208-.075-.359-.112-.51.115-.15.227-.584.74-.716.89-.13.152-.262.17-.491.056-.23-.114-.969-.357-1.846-1.14-.683-.609-1.144-1.36-1.278-1.587-.133-.227-.013-.35.101-.463.103-.102.228-.266.343-.399.114-.132.15-.227.228-.378.077-.152.039-.285-.02-.399-.058-.114-.51-1.229-.699-1.684-.183-.442-.369-.381-.51-.388-.13-.007-.28-.008-.43-.008-.15 0-.395.056-.602.28-.208.227-.792.775-.792 1.89s.81 2.19.923 2.34c.113.15 1.59 2.429 3.853 3.407.538.232.958.371 1.286.475.54.171 1.03.147 1.418.089.432-.064 1.353-.553 1.542-1.087.19-.533.19-.99.133-1.087-.058-.097-.208-.152-.437-.267z" />
                        </svg>
                        <span>{party.whatsAppMobile}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Field 3: Email */}
              <div className="flex items-start gap-2.5">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold block">Email Address</span>
                  {party.email ? (
                    <a href={`mailto:${party.email}`} className="font-semibold text-blue-600 hover:underline break-all block">
                      {party.email}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No email</span>
                  )}
                </div>
              </div>

              {/* Field 4: Status & Type */}
              <div className="flex items-start gap-2.5">
                <UserCheck className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Status & Type</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant={party.status === "Active" ? "success" : "danger"}>
                      {party.status}
                    </Badge>
                    <Badge variant="info">{party.partyType}</Badge>
                  </div>
                </div>
              </div>

            </div>

            {/* Row 2: Billing Address (col-span-2) + Tax (col-span-1) + Party Since (col-span-1) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">

              {/* Field 5: Billing Address */}
              <div className="flex items-start gap-2.5 md:col-span-2">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Billing Address</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 leading-normal block">
                    {party.address}, {party.city}, {party.state} — {party.pincode}
                  </span>
                </div>
              </div>
              {/* Field 7: Customer Since */}
              <div className="flex items-start gap-2.5 md:col-span-1">
                <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Party Since</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{formatDate(party.createdAt)}</span>
                </div>
              </div>
              {/* Field 6: Tax & Identification */}
              <div className="flex items-start gap-2.5 md:col-span-1">
                <Landmark className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="w-full">
                  <span className="text-[10px] text-slate-400 font-bold block">Tax & Registration</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                    {party.panNumber && (
                      <div className="mr-2">
                        <span className="text-[10px] text-slate-400 font-normal uppercase mr-1">PAN:</span>
                        <span className="font-mono font-bold uppercase">{party.panNumber}</span>
                      </div>
                    )}
                    {party.gstin && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-normal uppercase mr-1">GSTIN:</span>
                        <span className="font-mono font-bold uppercase">{party.gstin}</span>
                      </div>
                    )}
                    {!party.panNumber && !party.gstin && (
                      <span className="text-slate-400 italic">No registration registered</span>
                    )}
                  </div>
                </div>
              </div>



            </div>

            {/* Row 3: Remarks/Notes (full-width) */}
            {party.remark && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-start gap-2.5">
                <Info className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Remarks / Notes</span>
                  <p className="text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed">
                    "{party.remark}"
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      {/* Stats Highlight Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Active Bookings */}
        <div
          onClick={() => navigate(`/orders?partyId=${party.partyId}`, { state: { partyId: party.partyId } })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-blue-500/50 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
        >
          <div className="absolute top-1.5 right-3 text-[8px] font-bold text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <span>View Bookings</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </div>
          <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Active Bookings</span>
            <span className="font-extrabold text-base text-slate-800 dark:text-slate-100 block mt-0.5 truncate">
              {partyStats.totalBookedOrders}
            </span>
            <span className="text-[11px] text-slate-400 block">Total active bookings</span>
          </div>
        </div>
        {/* Last Payment */}
        <div
          onClick={() => navigate(`/payments?partyId=${party.partyId}`, { state: { partyId: party.partyId } })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
        >
          <div className="absolute top-1.5 right-3 text-[8px] font-bold text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <span>View Payments</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </div>
          <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Last Payment</span>
            <span className="font-extrabold text-base text-emerald-600 block mt-0.5 truncate">
              ₹{partyStats.lastPaymentAmount.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {partyStats.lastPaymentDate ? `Received on ${partyStats.lastPaymentDate}` : "No payments yet"}
            </span>
          </div>
        </div>
        {/* Outstanding Dues */}
        <div
          onClick={() => navigate(`/payments?partyId=${party.partyId}`, { state: { partyId: party.partyId } })}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-red-500/50 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
        >
          <div className="absolute top-1.5 right-3 text-[8px] font-bold text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <span>Collect / View</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </div>
          <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Outstanding Due</span>
            <span className="font-extrabold text-base block mt-0.5 truncate text-red-500 dark:text-red-400">
              ₹{outstandingBalance.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {outstandingBalance > 0 ? "Pending payment due" : outstandingBalance < 0 ? "Surplus advance credit" : "Settled"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
