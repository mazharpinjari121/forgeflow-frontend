import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common";
import { TrendingUp, ArrowDownCircle, Clock, AlertTriangle, AlertCircle, Plus, FileText, Landmark, ShieldAlert, ChevronRight, User, Users, PieChart, BarChart3 } from "lucide-react";
import { dashboardService, type DashboardSummary, type LowStockProduct, type ChartDataItem } from "@/services/dashboard.service";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dynamic Dashboard Time Filter State
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year">("week");

  // API Data States
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [summaryRes, stockRes, chartRes] = await Promise.all([
        dashboardService.getDashboard(today),
        dashboardService.getProductLowStockAlert(),
        loadChartData(),
      ]);

      if (summaryRes.data.responseStatus === "Success") {
        setDashboardSummary(summaryRes.data.data || null);
      }
      if (stockRes.data.responseStatus === "Success") {
        setLowStockProducts(stockRes.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load Chart Data
  const loadChartData = async () => {
    try {
      const today = new Date();
      let fromDate: string;
      let type = timeFilter;

      if (timeFilter === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        fromDate = oneWeekAgo.toISOString().split("T")[0];
      } else if (timeFilter === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        fromDate = oneMonthAgo.toISOString().split("T")[0];
      } else {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        fromDate = oneYearAgo.toISOString().split("T")[0];
      }

      const res = await dashboardService.getSalesReturnChart({
        type,
        fromDate,
        toDate: today.toISOString().split("T")[0],
      });

      if (res.data.responseStatus === "Success") {
        setChartData(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load chart data:", error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [timeFilter]);

  // Helper function to clean strings with currency symbols/commas into numbers safely
  const parseToNumber = (val: any): number => {
    if (typeof val === "string") {
      return Number(val.replace(/[^0-9.-]+/g, "")) || 0;
    }
    return Number(val) || 0;
  };

  // Determine maximum ceiling tier dynamically from your custom validation intervals
  const getAxisCeiling = () => {
    const absoluteMax = Math.max(
      ...chartData.flatMap(d => [parseToNumber(d.salesAmount), parseToNumber(d.returnAmount)]),
      10000 // Fallback base limit
    );

    if (absoluteMax <= 10000) return 10000;       // 10k
    if (absoluteMax <= 50000) return 50000;       // 50k
    if (absoluteMax <= 100000) return 100000;     // 1L
    if (absoluteMax <= 500000) return 500000;     // 5L
    if (absoluteMax <= 1000000) return 1000000;   // 10L
    if (absoluteMax <= 5000000) return 5000000;   // 50L
    return 10000000;                              // 1Cr
  };

  const yMaxCeiling = getAxisCeiling();

  // Format labels for standard Indian numbering
  const formatIndianLabel = (value: number) => {
    if (value >= 10000000) return `${value / 10000000}Cr`;
    if (value >= 100000) return `${value / 100000}L`;
    if (value >= 1000) return `${value / 1000}k`;
    return value.toString();
  };

  // Generate 5 equidistant threshold intervals based on current dynamic ceiling max
  const yAxisTicks = [
    yMaxCeiling,
    yMaxCeiling * 0.75,
    yMaxCeiling * 0.5,
    yMaxCeiling * 0.25,
    0
  ];

  return (
    <div className="space-y-6 text-xs text-slate-800">
      <PageHeader title="Dashboard" />

      {/* Header Grid: Greetings + Quick Actions (Side-by-side & Compact) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Greetings & Role Banner */}
        <div className="lg:col-span-2 space-y-3.5 flex flex-col justify-between">
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex-1 flex flex-col justify-center">
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                  Super Steel Works
                </span>
                <h1 className="text-lg font-black tracking-tight sm:text-xl">
                  Welcome back, {user?.name || "Operator"}!
                </h1>
                <p className="text-[11px] text-slate-300 max-w-md">
                  Here is your role-customized corporate control panel. Live stock tallies and dues ledgers have been synchronized successfully.
                </p>
              </div>
              <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                <User className="h-5 w-5 text-blue-300" />
              </div>
            </div>
            {/* Abstract steel structure background */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-y-6 translate-x-6">
              <svg width="150" height="150" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 22h20L12 2zM12 6l7.5 13h-15L12 6z" />
              </svg>
            </div>
          </div>

          {/* Role Adaptation Information Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/60 p-2.5 rounded-xl flex items-center justify-between text-[10px] font-semibold text-blue-700 dark:text-blue-400">
            <span>Active User Role: <strong>{user?.role}</strong></span>
            <span>{user?.role === "Admin" ? "Full Access" : user?.role === "Manager" ? "Managerial Access" : "Restricted Staff View"}</span>
          </div>
        </div>

        {/* Quick Actions Card */}
        {user?.role !== "Staff" ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <span className="text-slate-800 dark:text-slate-200 font-bold block border-b border-slate-100 dark:border-slate-800 pb-2">
              Quick Action Shortcuts
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 flex-grow justify-center mt-2.5">
              <button
                onClick={() => navigate("/orders")}
                className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-855 rounded-xl group transition-all text-left cursor-pointer"
              >
                <div className="h-6.5 w-6.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded flex items-center justify-center shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] group-hover:text-blue-600 transition-colors">+ New Booking</span>
                  <span className="text-[8.5px] text-slate-450 block">Book order form</span>
                </div>
              </button>

              <button
                onClick={() => navigate("/payments")}
                className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-slate-855 rounded-xl group transition-all text-left cursor-pointer"
              >
                <div className="h-6.5 w-6.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded flex items-center justify-center shrink-0">
                  <Landmark className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] group-hover:text-emerald-600 transition-colors">+ New Payment</span>
                  <span className="text-[8.5px] text-slate-450 block">Record collection</span>
                </div>
              </button>

              {user?.role === "Admin" ? (
                <button
                  onClick={() => navigate("/masters/parties")}
                  className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-855 rounded-xl group transition-all text-left cursor-pointer"
                >
                  <div className="h-6.5 w-6.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded flex items-center justify-center shrink-0">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] group-hover:text-purple-600 transition-colors">+ New Party</span>
                    <span className="text-[8.5px] text-slate-450 block">Register customer</span>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl opacity-60 select-none">
                  <div className="h-6.5 w-6.5 bg-slate-100 text-slate-455 rounded flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-455 block text-[10px]">+ New Party</span>
                    <span className="text-[8.5px] text-slate-455 block">Admin restricted</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-slate-455 font-semibold text-[10px] space-y-2">
            <ShieldAlert className="h-6 w-6 text-slate-455 animate-pulse" />
            <span>Staff Dashboard View</span>
            <span className="text-[8px] text-slate-455 font-normal">Contact Admin for action shortcuts access</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid (API Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Today's Sales */}
        <div
          onClick={() => {
            const todayDate = new Date().toISOString().split("T")[0];
            navigate(`/orders?fromDate=${todayDate}&toDate=${todayDate}`);
          }}
          className="p-4 rounded-xl cursor-pointer group bg-gradient-to-br from-blue-50/80 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20 border border-blue-100 dark:border-indigo-900/40 shadow-sm hover:-translate-y-1 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden"
        >
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 uppercase block font-bold tracking-wider">Today's Sales</span>
              <span className="font-black text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                ₹{(dashboardSummary?.todayOrderSale || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-8 w-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-[9.5px] text-blue-600 dark:text-blue-400 font-extrabold mt-3 group-hover:translate-x-1.5 transition-transform relative z-10">
            <span>View Today's Sales</span>
            <ChevronRight className="h-3 w-3" />
          </div>
          <div className="absolute -right-3 -bottom-3 h-12 w-12 rounded-full bg-blue-500/5 group-hover:scale-150 transition-transform duration-500" />
        </div>

        {/* KPI 2: Today's Returns */}
        <div
          onClick={() => {
            const todayDate = new Date().toISOString().split("T")[0];
            navigate(`/returns?fromDate=${todayDate}&toDate=${todayDate}`);
          }}
          className="p-4 rounded-xl cursor-pointer group bg-gradient-to-br from-orange-50/80 to-red-50/30 dark:from-slate-900 dark:to-red-950/20 border border-orange-100 dark:border-red-900/40 shadow-sm hover:-translate-y-1 hover:shadow-md hover:shadow-orange-500/10 transition-all duration-300 relative overflow-hidden"
        >
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 uppercase block font-bold tracking-wider">Today's Returns</span>
              <span className="font-black text-base text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                ₹{(dashboardSummary?.todayOrderReturn || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-8 w-8 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-orange-500/30">
              <ArrowDownCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-[9.5px] text-orange-600 dark:text-orange-400 font-extrabold mt-3 group-hover:translate-x-1.5 transition-transform relative z-10">
            <span>View Returns</span>
            <ChevronRight className="h-3 w-3" />
          </div>
          <div className="absolute -right-3 -bottom-3 h-12 w-12 rounded-full bg-orange-500/5 group-hover:scale-150 transition-transform duration-500" />
        </div>

        {/* KPI 3: Active Bookings */}
        <div
          onClick={() => navigate("/orders")}
          className="p-4 rounded-xl cursor-pointer group bg-gradient-to-br from-amber-50/80 to-orange-50/30 dark:from-slate-900 dark:to-orange-950/20 border border-amber-100 dark:border-orange-900/40 shadow-sm hover:-translate-y-1 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden"
        >
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 uppercase block font-bold tracking-wider">Active Bookings</span>
              <span className="font-black text-base text-amber-600 dark:text-amber-400">
                {dashboardSummary?.activeBookings || 0} Bookings
              </span>
            </div>
            <div className="h-8 w-8 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-amber-500/30">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-[9.5px] text-amber-600 dark:text-amber-400 font-extrabold mt-3 group-hover:translate-x-1.5 transition-transform relative z-10">
            <span>View All Orders</span>
            <ChevronRight className="h-3 w-3" />
          </div>
          <div className="absolute -right-3 -bottom-3 h-12 w-12 rounded-full bg-amber-500/5 group-hover:scale-150 transition-transform duration-500" />
        </div>

        {/* KPI 4: Overdue Orders */}
        {user?.role !== "Staff" ? (
          <div
            onClick={() => navigate("/orders", { state: { filter: "overdue" } })}
            className="p-4 rounded-xl cursor-pointer group bg-gradient-to-br from-rose-50/80 to-red-50/30 dark:from-slate-900 dark:to-rose-950/20 border border-rose-100 dark:border-rose-900/40 shadow-sm hover:-translate-y-1 hover:shadow-md hover:shadow-rose-500/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 uppercase block font-bold tracking-wider">Overdue Orders</span>
                <span className={`font-black text-base ${(dashboardSummary?.overdueOrder || 0) > 0 ? "text-rose-600 dark:text-rose-455 animate-pulse" : "text-slate-900 dark:text-slate-100"}`}>
                  {dashboardSummary?.overdueOrder || 0} Overdue
                </span>
              </div>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shadow-md ${(dashboardSummary?.overdueOrder || 0) > 0 ? "bg-rose-600 text-white shadow-rose-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-550"}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-[9.5px] text-slate-450 dark:text-slate-500 mt-3 font-semibold">Orders past expected date</p>
            <div className="absolute -right-3 -bottom-3 h-12 w-12 rounded-full bg-rose-500/5" />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-450 font-semibold text-[10px]">
            <ShieldAlert className="h-4 w-4 mr-1 text-slate-400" />
            <span>Overdue Metrics Restricted</span>
          </div>
        )}

        {/* KPI 5: Total Outstanding Balance */}
        {user?.role !== "Staff" ? (
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-red-50/30 dark:from-slate-900 dark:to-red-950/20 border border-amber-100 dark:border-red-900/40 shadow-sm hover:-translate-y-1 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 uppercase block font-bold tracking-wider">Total Outstanding</span>
                <span className="font-black text-base text-amber-600 dark:text-amber-400">
                  ₹{(dashboardSummary?.outstandingBalance || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-8 w-8 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-amber-500/30">
                <Landmark className="h-4 w-4" />
              </div>
            </div>
            <p className="text-[9.5px] text-slate-450 dark:text-slate-500 mt-3 font-semibold">Total running credit exposure</p>
            <div className="absolute -right-3 -bottom-3 h-12 w-12 rounded-full bg-amber-500/5" />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-455 font-semibold text-[10px]">
            <ShieldAlert className="h-4 w-4 mr-1 text-slate-400" />
            <span>Outstanding Restricted</span>
          </div>
        )}
      </div>

      {user?.role !== "Staff" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs animate-fade-in">
          {/* Chart 1: Interactive Sales Trend (Bar Chart) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-4 flex flex-col justify-between">
            {/* Interactive Time Filter Segment */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Range:</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  {(["week", "month", "year"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`px-3 py-1.5 text-[9px] font-extrabold rounded-md transition-all uppercase tracking-wider cursor-pointer ${timeFilter === filter
                        ? "bg-primary text-primary-foreground shadow-sm scale-102"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                      {filter === "year" ? "Year" : filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between ">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BarChart3 className="h-4.5 w-4.5 text-blue-600" />
                Sales & Returns Trend


              </h3>
              <span className="text-blue-600 dark:text-blue-400 font-black text-[11px] uppercase">
                {timeFilter === "week" ? "Last 7 Days" : timeFilter === "month" ? "Last 30 Days" : "Last 12 Months"}
              </span>
            </div>


            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Sales</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>Returns</span>
              </div>
            </div>

            {/* Custom Plot Workspace Wrapper */}
            <div className="w-full flex gap-3 pt-4 items-stretch select-none">

              {/* Dynamic Y-Axis Labels Column */}
              <div className="flex flex-col justify-between text-[8px] font-extrabold text-slate-400 dark:text-slate-500 text-right w-8 pr-1.5 h-44 pb-4">
                {yAxisTicks.map((tick, tIdx) => (
                  <span key={tIdx}>{formatIndianLabel(tick)}</span>
                ))}
              </div>

              {/* Chart Plot Graphic Frame */}
              <div className="flex-1 h-44 flex items-end justify-between gap-2 border-l border-b border-slate-200 dark:border-slate-800 px-2 relative pb-4">

                {/* Visual Horizontal Gridlines Layer */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-1 pb-4">
                  <div className="border-t border-dashed border-slate-100 dark:border-slate-800/40 w-full h-0" />
                  <div className="border-t border-dashed border-slate-100 dark:border-slate-800/40 w-full h-0" />
                  <div className="border-t border-dashed border-slate-100 dark:border-slate-800/40 w-full h-0" />
                  <div className="border-t border-dashed border-slate-100 dark:border-slate-800/40 w-full h-0" />
                  <div className="h-0" />
                </div>

                {/* Bars Array Renderer */}
                {chartData.map((item, idx) => {
                  const salesAmt = parseToNumber(item.salesAmount);
                  const returnAmt = parseToNumber(item.returnAmount);

                  // Calculate proportional height percentages relative to max validation ceiling
                  const salesPercentage = salesAmt > 0 ? Math.min(100, (salesAmt / yMaxCeiling) * 100) : 0;
                  const returnPercentage = returnAmt > 0 ? Math.min(100, (returnAmt / yMaxCeiling) * 100) : 0;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end z-10">
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-md">
                        {item.label}<br />
                        Sales: ₹{Math.round(salesAmt).toLocaleString("en-IN")}<br />
                        Returns: ₹{Math.round(returnAmt).toLocaleString("en-IN")}
                      </div>

                      {/* Bars Container - Fixed with h-full layout validation */}
                      <div className="flex gap-1 w-full items-end h-full">
                        {/* Sales Bar */}
                        <div
                          className={`flex-1 bg-blue-600 dark:bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-pointer ${salesPercentage > 0 ? "min-h-[4px]" : ""
                            }`}
                          style={{ height: `${salesPercentage}%` }}
                        />
                        {/* Returns Bar */}
                        <div
                          className={`flex-1 bg-orange-500 dark:bg-orange-400 rounded-t transition-all duration-300 hover:bg-orange-400 dark:hover:bg-orange-300 cursor-pointer ${returnPercentage > 0 ? "min-h-[4px]" : ""
                            }`}
                          style={{ height: `${returnPercentage}%` }}
                        />
                      </div>

                      {/* X-axis Label */}
                      <span className="absolute top-full mt-1 text-[7px] font-semibold text-slate-400 block truncate max-w-full text-center w-full">
                        {chartData.length > 12 ? (idx % 2 === 0 ? item.label : "") : item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>


          </div>

          {/* Column 3: Low Stock Alerts Widgets */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                Low Stock Warnings
              </span>
            </div>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {lowStockProducts.length === 0 ? (
                <div className="text-center p-6 text-slate-400 font-semibold border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No low stock warnings. All items are sufficiently stocked.
                </div>
              ) : (
                lowStockProducts.map((p) => {
                  return (
                    <div
                      key={p.productId}
                      onClick={() => navigate("/stock")}
                      className="flex justify-between items-center border border-red-100 dark:border-red-900/30 p-2.5 bg-red-50/30 dark:bg-red-900/10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-all duration-300 animate-fade-in"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs truncate max-w-[130px]">{p.productName}</span>
                        <span className="text-[9.5px] text-slate-440 mt-0.5 block">Minimum Stock Alert: {p.minimumStockAlert} Qty</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xs text-red-600 block">{p.availableQty} Qty</span>
                        <span className="text-[8.5px] font-bold text-red-500">Available</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )
      }

    </div >
  );
}