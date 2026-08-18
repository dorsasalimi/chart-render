// components/AreaChart.tsx
"use client";

import ReactECharts from "echarts-for-react";
import type { CategoryChart } from "../types/charts";
import { CHART_COLORS } from "../lib/chartTheme";
import { getThemeColors, ThemeKey } from "../lib/colorThemes";

interface Props {
  chart: CategoryChart;
  customColors?: string[] | Record<string, string>;
  theme?: ThemeKey;
}

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
};

export default function AreaChart({ chart, customColors, theme = "default" }: Props) {
  // Guard against missing series
  if (!chart.series || chart.series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
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
    },

    legend: {
      data: chart.series.map(s => s.name),
      top: 0,
      left: 'center',
      right: 'center',
      textStyle: {
        fontFamily: "inherit",
      },
    },

    grid: {
      left: 80,  // Increased from 50
      right: 40,  // Increased from 30
      top: 65,  // Increased from 60
      bottom: 60,  // Increased from 50
      containLabel: true,
    },

    xAxis: {
      type: "category",
      boundaryGap: false,
      data: chart.categories ? chart.categories.map(toPersianDigits) : [],
      axisLabel: {
        fontFamily: "inherit",
        rotate: chart.categories && chart.categories.length > 8 ? 30 : 0,
      },
    },

    yAxis: {
      type: "value",
      axisLabel: {
        fontFamily: "inherit",
        formatter: (value: number) => toPersianDigits(value),
      },
    },

    series: chart.series.map((series, index) => ({
      name: series.name,
      type: "line",
      stack: "total",
      areaStyle: {},
      emphasis: {
        focus: "series",
      },
      data: series.data || [],
      itemStyle: {
        color: colors[index % colors.length],
      },
      lineStyle: {
        color: colors[index % colors.length],
      },
    })),
  };

  return (
    <div 
      data-echarts-container 
      style={{
        width: "100%",
        height: "100%",
        minHeight: "420px",
      }}
    >
      <ReactECharts
        option={option}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "420px",
        }}
        opts={{
          renderer: "svg",
        }}
      />
    </div>
  );
}