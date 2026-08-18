// app/charts/page.tsx
"use client";

import { useState, useMemo } from "react";
import { chartRegistry } from "./components/data/chartRegistry";
import ChartRenderer from "./components/ChartRenderer";
import DownloadButton from "./components/DownloadButton";
import GlobalColorPicker from "./components/GlobalColorPicker";
import { ThemeKey } from "./lib/colorThemes";
import { CHART_COLORS } from "./lib/chartTheme";

export default function ChartsPage() {
  const [seriesColors, setSeriesColors] = useState<Record<string, string>>({});
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("default");
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Get all unique series names from all charts
  const allSeriesNames = useMemo(() => {
    const names = new Set<string>();
    chartRegistry.forEach(chart => {
      if (chart.series) {
        chart.series.forEach(series => {
          if (series.name) {
            names.add(series.name);
          }
        });
      }
      // Handle pie chart data
      if (chart.data) {
        chart.data.forEach((item: any) => {
          if (item.name) {
            names.add(item.name);
          }
        });
      }
    });
    return Array.from(names);
  }, []);

  // Get current colors for a specific chart
  const getChartColors = (chart: any) => {
    if (Object.keys(seriesColors).length > 0) {
      // For pie charts
      if (chart.data) {
        const colorMap: Record<string, string> = {};
        chart.data.forEach((item: any) => {
          if (item.name && seriesColors[item.name]) {
            colorMap[item.name] = seriesColors[item.name];
          }
        });
        return Object.keys(colorMap).length > 0 ? colorMap : undefined;
      }
      
      // For charts with series
      if (chart.series) {
        return chart.series.map((series: any) => 
          seriesColors[series.name] || CHART_COLORS[chart.series.indexOf(series) % CHART_COLORS.length]
        );
      }
    }
    return undefined;
  };

  return (
    <main className="min-h-screen bg-[#F7F9F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        {/* Header with color controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#202522] tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-[#6B7A73] mt-1">
              {chartRegistry.length} charts • Customize colors below
            </p>
          </div>
          
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="
              inline-flex items-center gap-2
              px-4 py-2
              bg-white border border-[#E6EBE8]
              rounded-lg
              text-sm font-medium text-[#202522]
              hover:bg-[#F7F9F8]
              transition-colors
              shadow-sm
            "
          >
            <span className="text-lg">🎨</span>
            {showColorPicker ? "Hide Color Controls" : "Customize Colors"}
          </button>
        </div>

        {/* Global Color Picker */}
        {showColorPicker && (
          <div className="bg-white rounded-2xl border border-[#E6EBE8] p-6 shadow-sm">
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
        {chartRegistry.map((chart) => (
          <section
            key={chart.id}
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
                    {chart.title}
                  </h2>
                  {chart.subtitle && (
                    <p className="text-xs text-[#6B7A73] truncate">
                      {chart.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Show color indicator for this chart */}
                {Object.keys(seriesColors).length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    {chart.series ? (
                      chart.series.map((series: any, idx: number) => {
                        const color = seriesColors[series.name] || 
                          CHART_COLORS[idx % CHART_COLORS.length];
                        return (
                          <div
                            key={idx}
                            className="w-3 h-3 rounded-full border border-[#E6EBE8]"
                            style={{ backgroundColor: color }}
                            title={series.name}
                          />
                        );
                      })
                    ) : chart.data ? (
                      chart.data.slice(0, 5).map((item: any, idx: number) => {
                        const color = seriesColors[item.name] || 
                          CHART_COLORS[idx % CHART_COLORS.length];
                        return (
                          <div
                            key={idx}
                            className="w-3 h-3 rounded-full border border-[#E6EBE8]"
                            style={{ backgroundColor: color }}
                            title={item.name}
                          />
                        );
                      })
                    ) : null}
                  </div>
                )}
                
                {/* Download button */}
                <DownloadButton chartId={`chart-${chart.id}`} chartTitle={chart.title} />
              </div>
            </div>

            {/* Visualization */}
            <div 
              id={`chart-${chart.id}`} 
              className="p-22"
              data-echarts-container
            >
              <ChartRenderer 
                chart={chart} 
                customColors={getChartColors(chart)}
                theme={selectedTheme}
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}