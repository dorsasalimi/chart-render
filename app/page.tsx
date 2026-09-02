"use client";

import { useState, useMemo, useCallback } from "react";
import { chartRegistry } from "./components/data/chartRegistry";
import ChartRenderer from "./components/ChartRenderer";
import DownloadButton from "./components/DownloadButton";
import IranProvinceMap from "./components/IranProvinceMap";
import MapDownloadButton from "./components/MapDownloadButton";
import iranProvinceExports from "./components/data/charts/map/iran-province-exports.json";
import {
  MapPinned,
  Menu,
  Search,
  X,
} from "lucide-react";

import type { ChartDefinition } from "../app/types/charts";

// Chart type icons and labels with enhanced styling
const chartTypeInfo = {
  line: {
    icon: "📈",
    label: "نمودارهای خطی",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    gradient: "from-blue-500 to-blue-600",
  },
  bar: {
    icon: "📊",
    label: "نمودارهای میله‌ای",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-500 to-emerald-600",
  },
  area: {
    icon: "📉",
    label: "نمودارهای سطحی",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    gradient: "from-purple-500 to-purple-600",
  },
  pie: {
    icon: "🍩",
    label: "نمودارهای دایره‌ای",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    gradient: "from-amber-500 to-amber-600",
  },
  treemap: {
    icon: "🗺️",
    label: "نمودارهای درختی",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    gradient: "from-rose-500 to-rose-600",
  },
  sankey: {
    icon: "🔀",
    label: "نمودارهای جریان",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    gradient: "from-cyan-500 to-cyan-600",
  },
  waffle: {
    icon: "▦",
    label: "نمودارهای شبکه‌ای",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    gradient: "from-indigo-500 to-indigo-600",
  },
};

const normalizeSearchText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("fa")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/[أإٱ]/g, "ا")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u200C\u200D\u2060]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function ChartsPage() {
  const charts = chartRegistry as ChartDefinition[];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChartType, setSelectedChartType] = useState<string>("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const showConnectors = true;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Get unique chart types from registry
  const chartTypes = useMemo(() => {
    const types = new Set<string>();
    charts.forEach((chart) => {
      if (chart.type) {
        types.add(chart.type);
      }
    });
    return Array.from(types);
  }, [charts]);

  // Filter charts based on search and type
  const filteredCharts = useMemo(() => {
    const searchTerms = normalizeSearchText(searchQuery).split(" ").filter(Boolean);

    return charts.filter((chart) => {
      const searchableName = normalizeSearchText(
        [
          chart.title,
          "subtitle" in chart ? chart.subtitle : undefined,
          ...("series" in chart && Array.isArray(chart.series)
            ? chart.series.map((series) => series.name)
            : []),
        ]
          .filter(Boolean)
          .join(" "),
      );

      const matchesSearch = searchTerms.every((term) =>
        searchableName.includes(term),
      );

      const matchesType =
        selectedChartType === "all" || chart.type === selectedChartType;

      return matchesSearch && matchesType;
    });
  }, [charts, searchQuery, selectedChartType]);

  // Get total chart count
  const totalCharts = charts.length;
  const filteredCount = useMemo(() => filteredCharts.length, [filteredCharts]);
  const showMap = useMemo(() => {
    if (selectedChartType !== "all" && selectedChartType !== "map") return false;

    const terms = normalizeSearchText(searchQuery).split(" ").filter(Boolean);
    const mapText = normalizeSearchText("نقشه استان‌های ایران ارزش صادرات گمرک‌ها");
    return terms.every((term) => mapText.includes(term));
  }, [searchQuery, selectedChartType]);
  const visibleResultCount = filteredCount + (showMap ? 1 : 0);

  // Helper to render a single chart - with improved compact layout
  const renderChartCard = useCallback(
    (chart: ChartDefinition) => {
      const chartWithSubtitle = chart as ChartDefinition & { subtitle?: string };
      const typeInfo = chartTypeInfo[chart.type as keyof typeof chartTypeInfo] || {
        icon: "📊",
        label: chart.type,
        color: "bg-gray-50 text-gray-700 border-gray-200",
        gradient: "from-gray-500 to-gray-600",
      };

      const uniqueKey = `${chart.id}`;

      return (
        <section
          key={uniqueKey}
          className="
          mb-6
            group
            overflow-hidden
            rounded-xl
            border border-[#E6EBE8]
            bg-white/80
            backdrop-blur-sm
            shadow-[0_2px_10px_rgba(20,40,30,0.025)]
            transition-all duration-300 ease-out
            hover:shadow-[0_8px_30px_rgba(20,40,30,0.06)]
            hover:border-[#D0D9D4]
            hover:bg-white
          "
        >
          {/* Compact Chart header */}
          <div
            className="
              flex flex-wrap items-center justify-between
              gap-2
              border-b border-[#EEF1EF]
              px-4 py-3
              sm:px-5 sm:py-4
              bg-gradient-to-r from-white to-[#FAFCFB]
              group-hover:from-white group-hover:to-[#F5F8F6]
              transition-all duration-300
            "
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
                  h-8 w-1
                  shrink-0
                  rounded-full
                  bg-gradient-to-b from-[#1d3767] to-[#1E7A4D]
                  shadow-sm
                "
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg transition-transform duration-300 group-hover:scale-110">
                    {typeInfo.icon}
                  </span>
                  <h2
                    className="
                      truncate
                      text-md font-semibold
                      tracking-[-0.01em]
                      text-[#202522]
                      sm:text-base
                      flex items-center gap-2
                    "
                  >
                    {chart.title}
                  </h2>
                </div>
                {chartWithSubtitle.subtitle && (
                  <p className="truncate text-[11px] text-[#6B7A73] flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1 h-1 rounded-full bg-[#1d3767]/40" />
                    {chartWithSubtitle.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <DownloadButton
                chartId={`chart-${chart.id}`}
                chartTitle={chart.title}
              />
            </div>
          </div>

          {/* Visualization with compact padding */}
  <div
  id={`chart-${chart.id}`}
  className="p-3 sm:p-4 lg:p-6 bg-gradient-to-b from-white to-[#FAFCFB]"
>
            <ChartRenderer
              chart={chart}
              useCurvedLine={false}
              showConnectors={showConnectors}
            />
          </div>
        </section>
      );
    },
    [showConnectors]
  );

  // Group charts by type
  const groupedCharts = useMemo(() => {
    const groups: Record<string, ChartDefinition[]> = {};

    filteredCharts.forEach((chart) => {
      const type = chart.type || "other";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(chart);
    });

    return groups;
  }, [filteredCharts]);

  // Render chart group with improved layout
  const renderChartGroup = useCallback(
    (charts: ChartDefinition[]) => {
      return (
        <div className="">
          {charts.map((chart) => {
            return renderChartCard(chart);
          })}
        </div>
      );
    },
    [renderChartCard]
  );

  return (
    <div className="min-h-screen bg-[#F3F6F4]">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="بستن منوی داشبورد"
          className="fixed inset-0 z-40 bg-[#10261B]/35 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        dir="rtl"
        aria-label="فیلتر نمودارها"
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-slate-200 bg-white text-slate-800 shadow-xl shadow-slate-900/10 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button type="button" aria-label="بستن منو" onClick={() => setIsSidebarOpen(false)} className="absolute left-3 top-3 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden">
            <X className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-200 px-5 pb-5 pt-16 lg:pt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="sidebar-chart-search">جست‌وجو</label>
          <div className={`relative transition ${isSearchFocused ? "scale-[1.01]" : ""}`}>
            <input
              id="sidebar-chart-search"
              type="text"
              placeholder="عنوان یا موضوع نمودار"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pr-10 pl-9 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#1d3767] focus:bg-white focus:ring-2 focus:ring-[#1d3767]/15"
            />
            <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            {searchQuery && (
              <button type="button" aria-label="پاک کردن جست‌وجو" onClick={() => setSearchQuery("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-950">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div>
            <div className="mb-2 flex items-center justify-between px-3">
              <p className="text-xs font-semibold text-slate-700">نوع نمایش</p>
              <span className="text-xs text-slate-500">{visibleResultCount} نتیجه</span>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedChartType("all");
                  setIsSidebarOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right text-sm transition ${selectedChartType === "all" ? "bg-[#1d3767] font-medium text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}
              >
                <span>همه موارد</span>
                <span className="text-xs opacity-75">{totalCharts + 1}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedChartType("map");
                  setIsSidebarOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right text-sm transition ${selectedChartType === "map" ? "bg-[#1d3767] font-medium text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}
              >
                <span className="flex items-center gap-2"><MapPinned className="h-4 w-4" />نقشه استان‌ها</span>
                <span className="text-xs opacity-75">۱</span>
              </button>
              {chartTypes.map((type) => {
                const info = chartTypeInfo[type as keyof typeof chartTypeInfo];
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => {
                      setSelectedChartType(type);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right text-sm transition ${selectedChartType === type ? "bg-[#1d3767] font-medium text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}
                  >
                    <span>{info?.label || type}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>

      <button
        type="button"
        aria-label="باز کردن منوی داشبورد"
        onClick={() => setIsSidebarOpen(true)}
        className="fixed right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#24543B] shadow-lg ring-1 ring-[#DCE5E0] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <main dir="rtl" className="min-h-screen lg:pr-72">
        <div className="px-4 pb-6 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <div id="overview" className="mx-auto w-full max-w-[1600px] scroll-mt-24 space-y-6">
        {/* Enhanced Header with chart count */}
        <div className="hidden">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-semibold text-[#202522] sm:text-2xl">Charts Dashboard</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-md text-[#6B7A73]">
                  تعداد کل: <span className="font-semibold text-[#202522]">{totalCharts}</span> چارت
                </span>
                {searchQuery || selectedChartType !== "all" ? (
                  <span className="text-md text-[#6B7A73]">
                    فیلتر شده: <span className="font-semibold text-[#1d3767]">{filteredCount}</span> چارت
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="hidden">
          {/* Search Input */}
          <div className="flex-1 min-w-[180px]">
            <div
              className={`relative transition-all duration-200 ${
                isSearchFocused ? "scale-[1.01]" : ""
              }`}
            >
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search charts by name or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="
                  w-full
                  rounded-lg
                  border-2
                  bg-white
                  px-9 py-2
                  text-md
                  text-[#202522]
                  placeholder:text-[#6B7A73]
                  transition-all duration-200
                  focus:border-[#1d3767]
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#1d3767]/10
                  hover:border-[#C5D0CA]
                "
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    text-gray-400 hover:text-gray-600
                    transition-all duration-200
                    hover:bg-gray-100 rounded-full p-0.5
                  "
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Type Filter Buttons - Compact */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedChartType("all")}
              className={`
                px-2.5 py-1.5
                text-xs font-medium
                rounded-lg
                border-2
                transition-all duration-200
                ${
                  selectedChartType === "all"
                    ? "bg-[#1d3767] text-white border-[#1d3767] shadow-md shadow-[#1d3767]/20"
                    : "bg-white text-[#202522] border-[#E6EBE8] hover:bg-[#F7F9F8] hover:border-[#C5D0CA]"
                }
              `}
            >
              <span className="flex items-center gap-1">
                <span className="text-md">📋</span>
                <span className="hidden sm:inline">All</span>
              </span>
            </button>
            {chartTypes.map((type) => {
              const info = chartTypeInfo[type as keyof typeof chartTypeInfo];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedChartType(type)}
                  className={`
                    px-2.5 py-1.5
                    text-xs font-medium
                    rounded-lg
                    border-2
                    transition-all duration-200
                    ${
                      selectedChartType === type
                        ? "bg-[#1d3767] text-white border-[#1d3767] shadow-md shadow-[#1d3767]/20"
                        : "bg-white text-[#202522] border-[#E6EBE8] hover:bg-[#F7F9F8] hover:border-[#C5D0CA]"
                    }
                  `}
                >
                  <span className="flex items-center gap-1">
                    <span className="text-md">{info?.icon}</span>
                    <span className="hidden sm:inline">{info?.label || type}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The map participates in the same sidebar filtering as registry charts. */}
        {showMap && (
        <section id="province-map" className="scroll-mt-24 overflow-hidden rounded-xl border border-[#E6EBE8] bg-white shadow-[0_2px_10px_rgba(20,40,30,0.025)]">
          <div className="flex justify-end px-4 pt-4 sm:px-6 sm:pt-6">
            <MapDownloadButton
              mapId="chart-iran-province-map"
              mapTitle="نقشه-ارزش-صادرات-استان‌ها"
            />
          </div>
          <div id="chart-iran-province-map" className="px-2 pb-4 sm:px-3 sm:pb-6">
            <IranProvinceMap
              data={iranProvinceExports}
              title="ارزش صادرات گمرک‌های استان‌ها"
              unit="میلیون دلار"
              height={900}
            />
          </div>
        </section>
        )}

        {/* Charts Grid - Grouped by Type */}
        {Object.keys(groupedCharts).length === 0 ? (
          !showMap && (
          <div className="text-center py-16 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
            <h3 className="text-lg font-semibold text-[#202522] mb-1">
              نموداری پیدا نشد
            </h3>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedChartType("all");
              }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-md font-medium text-[#1d3767] hover:text-[#1E7A4D] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              پاک کردن فیلترها
            </button>
          </div>
          )
        ) : (
          <div id="chart-library" className="scroll-mt-24 space-y-8">
            {Object.entries(groupedCharts).map(([type, charts]) => {
              const info = chartTypeInfo[type as keyof typeof chartTypeInfo] || {
                icon: "📊",
                label: type.charAt(0).toUpperCase() + type.slice(1),
                color: "bg-gray-50 text-gray-700 border-gray-200",
                gradient: "from-gray-500 to-gray-600",
              };

              return (
                <div key={type} className="space-y-4">
                  {/* Section Header with count */}
                  <div className="flex items-center gap-3 px-1">
                    <div
                      className={`
                        inline-flex items-center gap-2
                        px-3.5 py-1.5
                        rounded-full
                        border
                        ${info.color}
                        font-medium
                        shadow-sm
                        transition-all duration-200
                        hover:shadow-md
                      `}
                    >
                      <span className="text-base">{info.icon}</span>
                      <span className="text-xs font-semibold">{info.label}</span>
                      <span className="text-[10px] opacity-75 bg-white/50 px-1.5 py-0.5 rounded-full">
                        {charts.length}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#E6EBE8] to-transparent" />
                  </div>

                  {/* Charts in this group - using grid */}
                  {renderChartGroup(charts)}
                </div>
              );
            })}
          </div>
        )}
          </div>
        </div>
      </main>
    </div>
  );
}
