import { useState } from "react";
import { useSteelStore, Product, Party } from "@/store/steelStore";
import { Send, Users, ShieldAlert, Sparkles, Plus, AlertCircle, Calendar, MessageSquare, Tag, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { PageHeader } from "@/components/common";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default function WhatsAppMarketingPage() {
  const { promotions, products, parties, addWhatsAppPromo, categories } = useSteelStore();
  const { user } = useAuth();

  // Campaign Builder States
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [targetType, setTargetType] = useState<"Wholesaler" | "Retailer" | "Direct Customer" | "All">("All");
  const [customText, setCustomText] = useState("");
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  // Role Access Guard: WhatsApp Marketing is restricted to Admin only!
  if (user?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          WhatsApp Marketing promotions are confidential and restricted to **Administrator** accounts only.
        </p>
      </div>
    );
  }

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setCustomText(
        `*EXCLUSIVE STEEL DEAL!* \n\nWe have a fresh batch of *${prod.name}* available ready for immediate loading.\n\n*Specifications:*\n- ${prod.specifications}\n- Special Offer Rate: *₹${prod.price.toLocaleString("en-IN")}/Unit*\n\n📞 Reply back immediately to book your batch or call us now!`
      );
    }
  };

  const handleGenerateTemplate = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;
    setCustomText(
      `*SUPER STEEL BUSINESS DIRECT!* 🚀\n\n*New Stock Arrival Alert!*\n\nProduct: *${prod.name}*\nDimensions: ${prod.specifications}\nRate: ₹${prod.price.toLocaleString("en-IN")}/Unit (Standard trade terms)\n\nDimensions fit for heavy engineering & fabrication.\n\nType *BOOK ${prod.sku}* to block your quantities now!`
    );
    toast.success("AI steel marketing template generated!");
  };

  // Get targeted customer list based on type
  const getTargetedParties = () => {
    return parties.filter((p) => {
      if (p.status !== "Active") return false;
      if (targetType === "All") return true;
      return p.type === targetType;
    });
  };

  const targets = getTargetedParties();

  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return setError("Please select a product to promote");
    if (!customText.trim()) return setError("Campaign body text cannot be empty");
    if (targets.length === 0) return setError("No active target customers found for selected filters");

    setIsSending(true);

    // Simulate marketing delay
    setTimeout(() => {
      addWhatsAppPromo({
        productId: selectedProductId,
        messageText: customText.trim(),
        sentToPartyTypes: targetType === "All" ? ["Wholesaler", "Retailer", "Direct Customer"] : [targetType],
        sentCount: targets.length,
      });

      setIsSending(false);
      Swal.fire({
        icon: "success",
        title: "Campaign Broadcasted!",
        text: `WhatsApp promotional text has been queued & broadcasted successfully to ${targets.length} active business accounts!`,
        confirmButtonColor: "hsl(var(--accent))",
      });

      // Reset
      const firstProd = products[0];
      if (firstProd) {
        setSelectedProductId(firstProd.id);
        setCustomText("");
      }
      setSelectedCategoryId("all");
      setTargetType("All");
      setError("");
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Marketing"
        description="Build and broadcast targeted pricing alerts, specs, and promos directly to customers."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Campaign Builder */}
        <div className="lg:col-span-2  ">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                  WhatsApp Promotional Campaign Builder
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Build and broadcast targeted pricing alerts, specs, and promos directly to customers.</p>
              </div>
            </div>

            <form onSubmit={handleSendCampaign} className="p-5 space-y-4 text-xs">
              {error && (
                <div className="flex items-center gap-1.5 p-2.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">Filter by Category</label>
                  <SearchableSelect
                    value={selectedCategoryId}
                    onChange={(val) => {
                      setSelectedCategoryId(val);
                      setSelectedProductId("");
                      setCustomText("");
                    }}
                    options={[
                      { value: "all", label: "All Categories" },
                      ...categories.filter(c => c.status === "Active").map((c) => ({
                        value: c.id,
                        label: c.name
                      }))
                    ]}
                    className="w-full text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">Select Product to Promote *</label>
                  <SearchableSelect
                    value={selectedProductId}
                    onChange={(val) => handleProductChange(val)}
                    placeholder="-- Choose Steel Product --"
                    options={products
                      .filter(p => p.status === "Active" && (selectedCategoryId === "all" || p.categoryId === selectedCategoryId))
                      .map((p) => ({
                        value: p.id,
                        label: `${p.sku} — ${p.name}`
                      }))}
                    className="w-full text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">Target Segment Type *</label>
                  <SearchableSelect
                    value={targetType}
                    onChange={(val) => setTargetType(val as any)}
                    options={[
                      { value: "All", label: `All Active Parties (${parties.filter(p => p.status === "Active").length} accounts)` },
                      { value: "Wholesaler", label: `Wholesalers only (${parties.filter(p => p.type === "Wholesaler" && p.status === "Active").length})` },
                      { value: "Retailer", label: `Retailers only (${parties.filter(p => p.type === "Retailer" && p.status === "Active").length})` },
                      { value: "Direct Customer", label: `Direct Parties only (${parties.filter(p => p.type === "Direct Customer" && p.status === "Active").length})` },
                    ]}
                    className="w-full text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                    WhatsApp Message Draft *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateTemplate}
                    disabled={!selectedProductId}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline disabled:opacity-50"
                  >
                    Generate Professional Draft
                  </button>
                </div>
                <textarea
                  placeholder="Draft your wholesale promotion text here. Markdown stars (*) are supported for bolding WhatsApp texts..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="input-base min-h-[140px] font-sans"
                  rows={6}
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Tip: Standard emojis and bold triggers like *Bold* are fully compatible with WhatsApp broadcast networks.
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                  Target Broadcast Audience ({targets.length} Accounts Selected)
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pt-1">
                  {targets.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold text-[10px]"
                    >
                      {t.name} ({t.mobile})
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSending || targets.length === 0}
                  loading={isSending}
                  className="h-10 w-full justify-center sm:w-auto px-6 shadow-md shadow-blue-500/10"
                >
                  {!isSending && <Send className="h-4 w-4 mr-1.5" />}
                  <span>{isSending ? "Broadcasting message batch..." : "Launch WhatsApp Campaign"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Broadcast History log */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-emerald-600" />
              Sent Campaign Logs
            </h3>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {promotions.length === 0 ? (
                <div className="text-center p-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No promotions broadcasted yet.
                </div>
              ) : (
                [...promotions].reverse().map((promo) => {
                  const prod = products.find((p) => p.id === promo.productId);
                  return (
                    <div key={promo.id} className="border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg space-y-2 text-[11px] hover:border-slate-200 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs truncate max-w-[120px]">
                          {prod?.name || "Steel Promo"}
                        </span>
                        <span className="text-[9px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(promo.sentAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                        <span>Targets: {promo.sentToPartyTypes.join(", ")}</span>
                        <span className="text-blue-600">Sent: {promo.sentCount} Deliveries</span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-[10px] text-slate-600 dark:text-slate-400 font-mono whitespace-pre-line max-h-[100px] overflow-y-auto leading-relaxed border border-slate-200 dark:border-slate-700">
                        {promo.messageText}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
