"use client";

import { useState, useMemo, useCallback } from "react";
import { chartRegistry } from "./components/data/chartRegistry";
import ChartRenderer from "./components/ChartRenderer";
import DownloadButton from "./components/DownloadButton";

import type {
  ChartDefinition,
  CategoryChart,
  PieChartData,
  SeriesData,
  PieItem,
} from "../app/types/charts";

// Type guard to check if chart has subtitle
function hasSubtitle(chart: ChartDefinition): chart is ChartDefinition & { subtitle: string } {
  return "subtitle" in chart && typeof (chart as any).subtitle === "string";
}

// Type guard for CategoryChart
function isCategoryChart(
  chart: ChartDefinition
): chart is CategoryChart {
  return "series" in chart && Array.isArray(chart.series);
}

// Type guard for PieChart
function isPieChart(
  chart: ChartDefinition
): chart is PieChartData {
  return "data" in chart && Array.isArray(chart.data);
}

// Chart type icons and labels with enhanced styling
const chartTypeInfo = {
  line: {
    icon: "📈",
    label: "Line Charts",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    gradient: "from-blue-500 to-blue-600",
  },
  bar: {
    icon: "📊",
    label: "Bar Charts",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-500 to-emerald-600",
  },
  area: {
    icon: "📉",
    label: "Area Charts",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    gradient: "from-purple-500 to-purple-600",
  },
  pie: {
    icon: "🍩",
    label: "Pie Charts",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    gradient: "from-amber-500 to-amber-600",
  },
  treemap: {
    icon: "🗺️",
    label: "Treemaps",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    gradient: "from-rose-500 to-rose-600",
  },
  sankey: {
    icon: "🔀",
    label: "Sankey Charts",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    gradient: "from-cyan-500 to-cyan-600",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChartType, setSelectedChartType] = useState<string>("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showConnectors, setShowConnectors] = useState(true);

  // Get unique chart types from registry
  const chartTypes = useMemo(() => {
    const types = new Set<string>();
    chartRegistry.forEach((chart: any) => {
      if (chart.type) {
        types.add(chart.type);
      }
    });
    return Array.from(types);
  }, []);

  // Filter charts based on search and type
  const filteredCharts = useMemo(() => {
    const searchTerms = normalizeSearchText(searchQuery).split(" ").filter(Boolean);

    return chartRegistry.filter((chart: any) => {
      const searchableName = normalizeSearchText(
        [
          chart.title,
          chart.subtitle,
          ...(Array.isArray(chart.series)
            ? chart.series.map((series: any) => series.name)
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
  }, [searchQuery, selectedChartType]);

  // Get total chart count
  const totalCharts = useMemo(() => chartRegistry.length, []);
  const filteredCount = useMemo(() => filteredCharts.length, [filteredCharts]);

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
                  bg-gradient-to-b from-[#2B9E65] to-[#1E7A4D]
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
                      text-sm font-semibold
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
                    <span className="inline-block w-1 h-1 rounded-full bg-[#2B9E65]/40" />
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
    const groups: Record<string, any[]> = {};

    filteredCharts.forEach((chart: any) => {
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
    (charts: any[]) => {
      return (
        <div className="">
          {charts.map((chart: any, index: number) => {
            return renderChartCard(chart);
          })}
        </div>
      );
    },
    [renderChartCard]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F7F9F8] via-[#F0F4F2] to-[#E8EDEA] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        {/* Enhanced Header with chart count */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-lg font-semibold text-[#202522]">📊 Charts Dashboard</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-sm text-[#6B7A73]">
                  تعداد کل: <span className="font-semibold text-[#202522]">{totalCharts}</span> چارت
                </span>
                {searchQuery || selectedChartType !== "all" ? (
                  <span className="text-sm text-[#6B7A73]">
                    فیلتر شده: <span className="font-semibold text-[#2B9E65]">{filteredCount}</span> چارت
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="flex flex-wrap gap-3 items-center bg-white/40 backdrop-blur-sm rounded-lg border border-white/60 px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm">
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
                  text-sm
                  text-[#202522]
                  placeholder:text-[#6B7A73]
                  transition-all duration-200
                  focus:border-[#2B9E65]
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#2B9E65]/10
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
                    ? "bg-[#2B9E65] text-white border-[#2B9E65] shadow-md shadow-[#2B9E65]/20"
                    : "bg-white text-[#202522] border-[#E6EBE8] hover:bg-[#F7F9F8] hover:border-[#C5D0CA]"
                }
              `}
            >
              <span className="flex items-center gap-1">
                <span className="text-sm">📋</span>
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
                        ? "bg-[#2B9E65] text-white border-[#2B9E65] shadow-md shadow-[#2B9E65]/20"
                        : "bg-white text-[#202522] border-[#E6EBE8] hover:bg-[#F7F9F8] hover:border-[#C5D0CA]"
                    }
                  `}
                >
                  <span className="flex items-center gap-1">
                    <span className="text-sm">{info?.icon}</span>
                    <span className="hidden sm:inline">{info?.label || type}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Charts Grid - Grouped by Type */}
        {Object.keys(groupedCharts).length === 0 ? (
          <div className="text-center py-16 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
            <div className="text-6xl mb-4 animate-bounce">🔍</div>
            <h3 className="text-lg font-semibold text-[#202522] mb-1">
              چارتی پیدا نشد
            </h3>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedChartType("all");
              }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2B9E65] hover:text-[#1E7A4D] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
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
    </main>
  );
}
