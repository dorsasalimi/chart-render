// components/LineChart.tsx
"use client";

import ReactECharts from "echarts-for-react";
import type { CategoryChart } from "../types/charts";
import { CHART_COLORS } from "../lib/chartTheme";
import { getThemeColors, ThemeKey } from "../lib/colorThemes";

interface Props {
  chart: CategoryChart;
  customColors?: string[] | Record<string, string>;
  theme?: ThemeKey;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("fa-IR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const formatFullNumber = (value: number) => {
  return new Intl.NumberFormat("fa-IR").format(value);
};

export default function LineChart({ 
  chart, 
  customColors, 
  theme = "default",
  height = 920,
  showLegend = true,
  showLabels = true
}: Props) {
  // Guard against missing series
  if (!chart.series || chart.series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[820px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // Determine colors
  let colors: string[];
  
  if (customColors && typeof customColors === 'object' && !Array.isArray(customColors)) {
    colors = chart.series.map((series, index) => 
      customColors[series.name] || CHART_COLORS[index % CHART_COLORS.length]
    );
  } else if (Array.isArray(customColors) && customColors.length > 0) {
    colors = customColors;
  } else if (theme) {
    colors = getThemeColors(theme);
  } else {
    colors = CHART_COLORS;
  }

  while (colors.length < chart.series.length) {
    colors = [...colors, ...CHART_COLORS];
  }

  const option = {
    color: colors,

    tooltip: {
      trigger: "axis",

      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      padding: [12, 14],

      textStyle: {
        fontFamily: "inherit",
        color: "#111827",
        fontSize: 13,
      },

      extraCssText: `
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      `,

      axisPointer: {
        type: "line",
        lineStyle: {
          color: "#D1D5DB",
          width: 1,
          type: "dashed",
        },
      },

      formatter: (params: any[]) => {
        if (!params?.length) return "";

        const category = params[0]?.axisValue ?? "";

        const rows = params
          .map((item) => {
            const value =
              typeof item.value === "number"
                ? formatFullNumber(item.value)
                : item.value;

            return `
              <div
                style="
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  gap:24px;
                  margin:8px;
                "
              >
                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:7px;
                    color:#374151;
                  "
                >
                  <span
                    style="
                      width:8px;
                      height:8px;
                      border-radius:50%;
                      background:${item.color};
                      display:inline-block;
                    "
                  ></span>

                  <span>${item.seriesName}</span>
                </div>

                <strong
                  style="
                    color:#111827;
                    font-weight:600;
                    direction:rtl;
                  "
                >
                  ${toPersianDigits(value)}
                  ${chart.unit ? ` ${chart.unit}` : ""}
                </strong>
              </div>
            `;
          })
          .join("");

        return `
          <div style="min-width:190px;">
            <div
              style="
                font-size:12px;
                color:#6B7280;
                margin-bottom:6px;
                font-weight:500;
              "
            >
              ${toPersianDigits(category)}
            </div>

            ${rows}
          </div>
        `;
      },
    },

    legend: showLegend ? {
      top: 4,
      left: 'center',
      right: 'center',

      orient: "horizontal",

      itemWidth: 9,
      itemHeight: 9,
      itemGap: 18,

      icon: "circle",

      selectedMode: true,

      textStyle: {
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 500,
        color: "#4B5563",
      },

      formatter: (name: string) => {
        return name;
      },

      width: "92%",
    } : { show: false },

    grid: {
      left: 80,  // Increased from 64 to give more room for y-axis labels
      right: 40,  // Increased from 24 to prevent right-side cutting
      top: showLegend ? 72 : 40,  // Increased top margin
      bottom: 60,  // Increased from 48 to give more room for x-axis labels
      containLabel: true,  // This ensures labels are always contained within the grid
    },

    xAxis: {
      type: "category",

      boundaryGap: false,

      data: chart.categories ? chart.categories.map(toPersianDigits) : [],

      axisLine: {
        lineStyle: {
          color: "#E5E7EB",
        },
      },

      axisTick: {
        show: false,
      },

      axisLabel: {
        fontFamily: "inherit",
        fontSize: 12,
        color: "#6B7280",
        margin: 14,
        // Add rotation for long labels if needed
        rotate: chart.categories && chart.categories.length > 8 ? 30 : 0,
      },

      splitLine: {
        show: false,
      },
    },

    yAxis: {
      type: "value",

      name: chart.unit || "",

      nameLocation: "end",

      nameGap: 12,

      nameTextStyle: {
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 500,
        color: "#9CA3AF",
      },

      axisLine: {
        show: false,
      },

      axisTick: {
        show: false,
      },

      axisLabel: {
        fontFamily: "inherit",
        fontSize: 11,
        color: "#9CA3AF",

        formatter: (value: number) => {
          return toPersianDigits(formatNumber(value));
        },
      },

      splitLine: {
        show: true,

        lineStyle: {
          color: "#F0F1F3",
          width: 1,
          type: "solid",
        },
      },
    },

    series: chart.series.map((series, index) => {
      const seriesColor = colors[index % colors.length];
      const data = series.data || [];

      const labelIndexes = new Set<number>();

      if (data.length > 0) {
        labelIndexes.add(0);
        labelIndexes.add(data.length - 1);
      }

      if (data.length <= 6) {
        data.forEach((_, i) => labelIndexes.add(i));
      }

      return {
        name: series.name,
        type: "line",

        smooth: 0.35,

        showSymbol: true,

        symbol: "circle",
        symbolSize: 7,

        itemStyle: {
          color: seriesColor,
          borderColor: "#FFFFFF",
          borderWidth: 2,
        },

        lineStyle: {
          width: 2.5,
          color: seriesColor,
        },

        emphasis: {
          focus: "series",
          scale: true,
          itemStyle: {
            borderWidth: 3,
          },
          lineStyle: {
            width: 3,
          },
        },

        label: showLabels ? {
          show: true,
          position: "top",
          distance: 8,
          formatter: (params: any) => {
            const index = params.dataIndex;
            if (!labelIndexes.has(index)) {
              return "";
            }
            return toPersianDigits(formatNumber(params.value));
          },
          fontFamily: "inherit",
          fontSize: 11,
          fontWeight: 600,
          color: seriesColor,
          padding: [4, 7],
          borderRadius: 5,
          borderColor: `${seriesColor}22`,
          borderWidth: 1,
        } : {
          show: false
        },

        labelLayout: {
          hideOverlap: true,
        },

        data,

        areaStyle: {
          opacity: 0.025,
        },
      };
    }),
  };

  return (
    <div
      data-echarts-container
      style={{
        width: "100%",
        height: "100%",
        minHeight: `${height}px`,
      }}
    >
      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
        style={{
          width: "100%",
          height: "820px",
          minHeight: `${height}px`,
        }}
        opts={{
          renderer: "svg",
        }}
      />
    </div>
  );
}