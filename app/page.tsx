"use client";

import { useState, useMemo } from "react";
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

export default function ChartsPage() {
  const [seriesColors, setSeriesColors] = useState<
    Record<string, string>
  >({});

  const [selectedTheme, setSelectedTheme] =
    useState<ThemeKey>("default");

  const [showColorPicker, setShowColorPicker] =
    useState(false);

  const [showBothLineTypes, setShowBothLineTypes] =
    useState(true);

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

  // Get current colors for a specific chart
  const getChartColors = (chart: ChartDefinition) => {
    if (Object.keys(seriesColors).length === 0) {
      return undefined;
    }

    // Pie chart
    if (isPieChart(chart)) {
      const colorMap: Record<string, string> = {};

      chart.data.forEach((item: PieItem) => {
        if (item.name && seriesColors[item.name]) {
          colorMap[item.name] = seriesColors[item.name];
        }
      });

      return Object.keys(colorMap).length > 0
        ? colorMap
        : undefined;
    }

    // Category chart
    if (isCategoryChart(chart)) {
      return chart.series.map(
        (series: SeriesData, index: number) =>
          seriesColors[series.name] ||
          CHART_COLORS[index % CHART_COLORS.length]
      );
    }

    return undefined;
  };

  // Helper to render a single chart
  const renderChartCard = (
    chart: ChartDefinition,
    useCurved: boolean,
    suffix: string
  ) => {
    const chartWithSubtitle = chart as ChartDefinition & { subtitle?: string };
    
    return (
      <section
        key={`${chart.id}-${suffix}`}
        className="
          overflow-hidden
          rounded-2xl
          border border-[#E6EBE8]
          bg-white
          shadow-[0_2px_10px_rgba(20,40,30,0.025)]
          transition-shadow duration-300
          hover:shadow-[0_8px_28px_rgba(20,40,30,0.055)]
        "
      >
        {/* Chart header */}
        <div
          className="
            flex flex-wrap items-center justify-between
            gap-3
            border-b border-[#EEF1EF]
            px-5 py-4
            sm:px-6 sm:py-5
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                h-8 w-1
                shrink-0
                rounded-full
                bg-[#2B9E65]
              "
            />
            <div className="min-w-0">
              <h2
                className="
                  truncate
                  text-base font-semibold
                  tracking-[-0.01em]
                  text-[#202522]
                  sm:text-lg
                "
              >
                {chart.title}{" "}
                {suffix === "curved"
                  ? "(Curved)"
                  : suffix === "straight"
                    ? "(Straight)"
                    : ""}
              </h2>
              {chartWithSubtitle.subtitle && (
                <p className="truncate text-xs text-[#6B7A73]">
                  {chartWithSubtitle.subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Show color indicator for this chart */}
            {Object.keys(seriesColors).length > 0 && (
              <div className="hidden items-center gap-1.5 sm:flex">
                {isCategoryChart(chart) &&
                  chart.series.map(
                    (
                      series: SeriesData,
                      index: number
                    ) => {
                      const color =
                        seriesColors[series.name] ||
                        CHART_COLORS[
                          index % CHART_COLORS.length
                        ];

                      return (
                        <div
                          key={`${series.name}-${index}`}
                          className="
                            h-3 w-3
                            rounded-full
                            border border-[#E6EBE8]
                          "
                          style={{
                            backgroundColor: color,
                          }}
                          title={series.name}
                        />
                      );
                    }
                  )}
                {isPieChart(chart) &&
                  chart.data
                    .slice(0, 5)
                    .map(
                      (
                        item: PieItem,
                        index: number
                      ) => {
                        const color =
                          seriesColors[item.name] ||
                          CHART_COLORS[
                            index % CHART_COLORS.length
                          ];

                        return (
                          <div
                            key={`${item.name}-${index}`}
                            className="
                              h-3 w-3
                              rounded-full
                              border border-[#E6EBE8]
                            "
                            style={{
                              backgroundColor: color,
                            }}
                            title={item.name}
                          />
                        );
                      }
                    )}
              </div>
            )}
            <DownloadButton
              chartId={`chart-${chart.id}-${suffix}`}
              chartTitle={`${chart.title} ${suffix}`}
            />
          </div>
        </div>

        {/* Visualization */}
        <div
          id={`chart-${chart.id}-${suffix}`}
          className="p-6 sm:p-8"
          data-echarts-container
        >
          <ChartRenderer
            chart={chart}
            customColors={getChartColors(chart)}
            theme={selectedTheme}
            useCurvedLine={useCurved}
          />
        </div>
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-[#F7F9F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#202522]">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-sm text-[#6B7A73]">
              {chartRegistry.length} charts • Customize colors below
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setShowColorPicker(!showColorPicker)
              }
              className="
                inline-flex items-center gap-2
                rounded-lg
                border border-[#E6EBE8]
                bg-white
                px-4 py-2
                text-sm font-medium
                text-[#202522]
                shadow-sm
                transition-colors
                hover:bg-[#F7F9F8]
              "
            >
              <span className="text-lg">🎨</span>
            </button>
          </div>
        </div>

        {/* Global Color Picker */}
        {showColorPicker && (
          <div
            className="
              rounded-2xl
              border border-[#E6EBE8]
              bg-white
              p-6
              shadow-sm
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

        {/* Charts Grid */}
        <div className="space-y-6">
          {chartRegistry.map(
            (chart: any) => {
              // Show both versions for line charts
              if (
                chart.type === "line" &&
                showBothLineTypes
              ) {
                return (
                  <div
                    key={chart.id}
                    className="space-y-6"
                  >
                    {renderChartCard(
                      chart,
                      true,
                      "curved"
                    )}
                    {renderChartCard(
                      chart,
                      false,
                      "straight"
                    )}
                  </div>
                );
              }
              // Normal single chart
              return renderChartCard(
                chart,
                true,
                "single"
              );
            }
          )}
        </div>
      </div>
    </main>
  );
}