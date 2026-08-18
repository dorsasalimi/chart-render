// components/linechartv2.tsx
"use client";

import ReactECharts from "echarts-for-react";
import { CHART_COLORS } from "../lib/chartTheme";
import { getThemeColors, ThemeKey } from "../lib/colorThemes";

// Define the chart types locally to avoid import conflicts
interface ChartDataItem {
  name: string;
  value: number;
}

interface ChartSeries {
  name: string;
  data: number[];
}

interface BaseChart {
  id: string;
  title: string;
  type: string;
  unit?: string;
  subtitle?: string;
}

interface CategoryChart extends BaseChart {
  categories: string[];
  series: ChartSeries[];
}

interface PieChartType extends BaseChart {
  data: ChartDataItem[];
}

type ChartDefinition = CategoryChart | PieChartType;

// Extend CategoryChart for line chart specific props
interface LineChartType extends CategoryChart {
  xAxisLabel?: string;
  yAxisLabel?: string;
}

interface Props {
  chart: LineChartType;
  customColors?: string[] | Record<string, string>;
  theme?: ThemeKey;
  height?: number;  // Added height prop
  showLegend?: boolean;  // Added showLegend prop
  showLabels?: boolean;  // Added showLabels prop
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

// Format numbers using Intl.NumberFormat like the second component
const formatNumber = (value: number) => {
  return new Intl.NumberFormat("fa-IR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

// Full number formatting without compact notation for tooltips
const formatFullNumber = (value: number) => {
  return new Intl.NumberFormat("fa-IR").format(value);
};

export default function LineChartNoCurve({ 
  chart, 
  customColors, 
  theme = "default",
  height = 920,  // Default height matching second chart
  showLegend = true,  // Default to true
  showLabels = true   // Default to true
}: Props) {
  // Guard against missing data
  if (!chart.series || chart.series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[820px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // Extract x-axis categories
  const categories = chart.categories;

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

  // Build series for ECharts
  const series = chart.series.map((s, index) => {
    const seriesColor = colors[index % colors.length];
    const data = s.data || [];

    const labelIndexes = new Set<number>();

    if (data.length > 0) {
      labelIndexes.add(0);
      labelIndexes.add(data.length - 1);
    }

    if (data.length <= 6) {
      data.forEach((_, i) => labelIndexes.add(i));
    }

    return {
      name: s.name,
      type: "line",
      data: s.data,
      smooth: false,  // Keeping the original smooth: false
      symbol: "circle",
      symbolSize: 7,  // Matching second chart
      lineStyle: {
        width: 2.5,  // Matching second chart
      },
      itemStyle: {
        color: seriesColor,
        borderColor: "#FFFFFF",
        borderWidth: 2,
        borderRadius: 8,
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
        distance: 8,  // Matching second chart
        formatter: (params: any) => {
          const index = params.dataIndex;
          if (!labelIndexes.has(index)) {
            return "";
          }
          // Unit after the number
          const formattedNumber = toPersianDigits(formatNumber(params.value));
          return chart.unit ?  formattedNumber :`${formattedNumber} ${chart.unit}` ;
        },
        fontSize: 11,
        fontFamily: "inherit",
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
      areaStyle: {
        opacity: 0.025,  // Matching second chart
      },
    };
  });

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
      bottom: 0,
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
      left: 80,  // Increased from 8% to match second chart
      right: 40,  // Increased from 6% to match second chart
      top: showLegend ? 72 : 40,  // Matching second chart
      bottom: 60,  // Matching second chart
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: categories.map(toPersianDigits),
      boundaryGap: false,  // Added to match second chart
      axisLine: {
        lineStyle: {
          color: "#E5E7EB",
        },
      },
      axisTick: {
        show: false,  // Added to match second chart
      },
      axisLabel: {
        fontSize: 12,
        fontFamily: "inherit",
        color: "#6B7280",  // Matching second chart
        margin: 14,  // Added to match second chart
        rotate: categories && categories.length > 8 ? 30 : 0,  // Added to match second chart
      },
      splitLine: {
        show: false,  // Added to match second chart
      },
    },
    yAxis: {
      type: "value",
      name: chart.yAxisLabel || chart.unit || "",
      nameLocation: "end",  // Added to match second chart
      nameGap: 12,  // Added to match second chart
      nameTextStyle: {
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 500,
        color: "#9CA3AF",
      },
      splitLine: {
        lineStyle: {
          color: "#F0F1F3",  // Matching second chart
          type: "solid",  // Changed from dashed to solid
        },
      },
      axisLine: {
        show: false,  // Added to match second chart
      },
      axisTick: {
        show: false,  // Added to match second chart
      },
      axisLabel: {
        fontSize: 11,
        fontFamily: "inherit",
        color: "#9CA3AF",  // Matching second chart
        formatter: (value: number) => {
          return toPersianDigits(formatNumber(value));
        },
      },
    },
    series: series,
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
        notMerge  // Added to match second chart
        lazyUpdate  // Added to match second chart
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