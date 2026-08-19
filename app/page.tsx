"use client";

import { useState, useMemo, useCallback } from "react";
import { chartRegistry } from "./components/data/chartRegistry";
import ChartRenderer from "./components/ChartRenderer";
import DownloadButton from "./components/DownloadButton";
import GlobalColorPicker from "./components/GlobalColorPicker";
import { ThemeKey } from "./lib/colorThemes";
import { CHART_COLORS } from "./lib/chartTheme";

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
};

export default function ChartsPage() {
  const [seriesColors, setSeriesColors] = useState<Record<string, string>>({});
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("default");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChartType, setSelectedChartType] = useState<string>("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showConnectors, setShowConnectors] = useState(true);

  // Get all unique series names from all charts
  const allSeriesNames = useMemo(() => {
    const names = new Set<string>();

    chartRegistry.forEach((chart: any) => {
      if (isCategoryChart(chart)) {
        chart.series.forEach((series: SeriesData) => {
          if (series.name) {
            names.add(series.name);
          }
        });
      }

      if (isPieChart(chart)) {
        chart.data.forEach((item: PieItem) => {
          if (item.name) {
            names.add(item.name);
          }
        });
      }
    });

    return Array.from(names);
  }, []);

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
    return chartRegistry.filter((chart: any) => {
      const matchesSearch =
        searchQuery === "" ||
        chart.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chart.subtitle &&
          chart.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (chart.series &&
          chart.series.some((s: any) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      const matchesType =
        selectedChartType === "all" || chart.type === selectedChartType;

      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedChartType]);

  // Get total chart count
  const totalCharts = useMemo(() => chartRegistry.length, []);
  const filteredCount = useMemo(() => filteredCharts.length, [filteredCharts]);

  // Get current colors for a specific chart
  const getChartColors = useCallback(
    (chart: ChartDefinition) => {
      if (Object.keys(seriesColors).length === 0) {
        return undefined;
      }

      if (isPieChart(chart)) {
        const colorMap: Record<string, string> = {};

        chart.data.forEach((item: PieItem) => {
          if (item.name && seriesColors[item.name]) {
            colorMap[item.name] = seriesColors[item.name];
          }
        });

        return Object.keys(colorMap).length > 0 ? colorMap : undefined;
      }

      if (isCategoryChart(chart)) {
        return chart.series.map(
          (series: SeriesData, index: number) =>
            seriesColors[series.name] || CHART_COLORS[index % CHART_COLORS.length]
        );
      }

      return undefined;
    },
    [seriesColors]
  );

  // Helper to render a single chart - with improved compact layout
  const renderChartCard = useCallback(
    (chart: ChartDefinition, useCurved: boolean, variant: string) => {
      const chartWithSubtitle = chart as ChartDefinition & { subtitle?: string };
      const typeInfo = chartTypeInfo[chart.type as keyof typeof chartTypeInfo] || {
        icon: "📊",
        label: chart.type,
        color: "bg-gray-50 text-gray-700 border-gray-200",
        gradient: "from-gray-500 to-gray-600",
      };

      const uniqueKey = `${chart.id}-${variant}-${useCurved ? 'curved' : 'straight'}`;

      const displaySuffix =
        variant === "curved"
          ? " (Curved)"
          : variant === "straight"
          ? " (Straight)"
          : "";

      return (
        <section
          key={uniqueKey}
          className="
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
                    {displaySuffix && (
                      <span className="text-[10px] font-normal text-[#6B7A73] bg-[#F0F3F1] px-1.5 py-0.5 rounded-full">
                        {variant === "curved" ? "Curved" : "Straight"}
                      </span>
                    )}
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
              {/* Compact color indicators */}
              {Object.keys(seriesColors).length > 0 && (
                <div className="hidden items-center gap-1 sm:flex px-1.5 py-1 bg-[#F7F9F8] rounded-full border border-[#E6EBE8]">
                  {isCategoryChart(chart) &&
                    chart.series.slice(0, 3).map((series: SeriesData, index: number) => {
                      const color =
                        seriesColors[series.name] ||
                        CHART_COLORS[index % CHART_COLORS.length];

                      return (
                        <div
                          key={`${series.name}-${index}`}
                          className="
                            h-2.5 w-2.5
                            rounded-full
                            border border-white
                            shadow-sm
                            transition-transform duration-200
                            hover:scale-125 hover:ring-2 hover:ring-[#2B9E65]/30
                            cursor-help
                          "
                          style={{ backgroundColor: color }}
                          title={series.name}
                        />
                      );
                    })}
                  {isCategoryChart(chart) && chart.series.length > 3 && (
                    <span className="text-[9px] font-medium text-[#6B7A73] px-0.5">
                      +{chart.series.length - 3}
                    </span>
                  )}
                </div>
              )}

              <DownloadButton
                chartId={`chart-${chart.id}-${variant}`}
                chartTitle={`${chart.title} ${variant}`}
              />
            </div>
          </div>

          {/* Visualization with compact padding */}
          <div
            id={`chart-${chart.id}-${variant}`}
            className="p-3 sm:p-4 lg:p-6 bg-gradient-to-b from-white to-[#FAFCFB]"
            data-echarts-container
          >
            <ChartRenderer
              chart={chart}
              customColors={getChartColors(chart)}
              theme={selectedTheme}
              useCurvedLine={useCurved}
              showConnectors={showConnectors}
            />
          </div>
        </section>
      );
    },
    [getChartColors, selectedTheme, seriesColors, showConnectors]
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
      // Use grid layout for better organization
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {charts.map((chart: any, index: number) => {
            if (chart.type === "line") {
              return (
                <div key={`${chart.id}-group-${index}`} className="space-y-4 col-span-1 xl:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderChartCard(chart, true, "curved")}
                    {renderChartCard(chart, false, "straight")}
                  </div>
                </div>
              );
            }
            const variant = `${chart.type}-${index}`;
            return renderChartCard(chart, true, variant);
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
                  Total: <span className="font-semibold text-[#202522]">{totalCharts}</span> charts
                </span>
                {searchQuery || selectedChartType !== "all" ? (
                  <span className="text-sm text-[#6B7A73]">
                    Filtered: <span className="font-semibold text-[#2B9E65]">{filteredCount}</span> charts
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Connector Toggle Button */}
            <button
              type="button"
              onClick={() => setShowConnectors(!showConnectors)}
              className={`
                inline-flex items-center gap-1.5
                rounded-lg
                border
                px-3 py-1.5
                text-xs font-medium
                shadow-sm
                transition-all duration-200
                ${
                  showConnectors
                    ? "bg-[#2B9E65] text-white border-[#2B9E65] hover:bg-[#238D58]"
                    : "bg-white text-[#202522] border-[#E6EBE8] hover:bg-[#F7F9F8] hover:border-[#C5D0CA]"
                }
              `}
            >
              <span className="text-base">{showConnectors ? "🔗" : "🚫"}</span>
              <span className="hidden sm:inline">
                {showConnectors ? "Hide Connectors" : "Show Connectors"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`
                inline-flex items-center gap-1.5
                rounded-lg
                border
                px-3 py-1.5
                text-xs font-medium
                shadow-sm
                transition-all duration-200
                ${
                  showColorPicker
                    ? "bg-[#2B9E65] text-white border-[#2B9E65] hover:bg-[#238D58]"
                    : "bg-white text-[#202522] border-[#E6EBE8] hover:bg-[#F7F9F8] hover:border-[#C5D0CA]"
                }
              `}
            >
              <span className="text-base">🎨</span>
              <span className="hidden sm:inline">
                {showColorPicker ? "Hide Colors" : "Colors"}
              </span>
            </button>
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

        {/* Global Color Picker */}
        {showColorPicker && (
          <div
            className="
              rounded-xl
              border border-[#E6EBE8]
              bg-white/95
              backdrop-blur-sm
              p-5 sm:p-6
              shadow-lg
              animate-in slide-in-from-top-4 duration-300
            "
          >
            <GlobalColorPicker
              seriesNames={allSeriesNames}
              initialColors={seriesColors}
              onColorsChange={setSeriesColors}
              onThemeChange={setSelectedTheme}
              onReset={() => {
                setSeriesColors({});
                setSelectedTheme("default");
              }}
            />
          </div>
        )}

        {/* Charts Grid - Grouped by Type */}
        {Object.keys(groupedCharts).length === 0 ? (
          <div className="text-center py-16 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
            <div className="text-6xl mb-4 animate-bounce">🔍</div>
            <h3 className="text-lg font-semibold text-[#202522] mb-1">
              No charts found
            </h3>
            <p className="text-sm text-[#6B7A73] max-w-md mx-auto">
              Try adjusting your search or filter criteria
            </p>
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
                    {type === "line" && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[#6B7A73] bg-white/60 px-2.5 py-1 rounded-full border border-[#E6EBE8]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2B9E65] animate-pulse" />
                        Curved & Straight variants
                      </div>
                    )}
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