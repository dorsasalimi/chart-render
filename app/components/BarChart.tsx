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

// Format large numbers with Persian digits
const formatValue = (value: number, unit: string = "") => {
  if (value >= 1e12) {
    return `${toPersianDigits((value / 1e12).toFixed(1))} تریلیون`;
  } else if (value >= 1e9) {
    return `${toPersianDigits((value / 1e9).toFixed(1))} میلیارد`;
  } else if (value >= 1e6) {
    return `${toPersianDigits((value / 1e6).toFixed(1))} میلیون`;
  } else if (value >= 1e3) {
    return `${toPersianDigits((value / 1e3).toFixed(1))} هزار`;
  } else {
    return `${toPersianDigits(value)}`;
  }
};

// Check if data needs percentage conversion (values > 100 or not summing to 100)
const needsPercentageConversion = (chart: CategoryChart): boolean => {
  if (!chart.series || chart.series.length === 0) return false;
  
  // Check if any value is > 100 (absolute values) or if all values are <= 100 but don't sum to 100
  for (let i = 0; i < chart.series.length; i++) {
    const data = chart.series[i].data || [];
    for (let j = 0; j < data.length; j++) {
      if (data[j] > 100) return true;
    }
  }
  
  // Check if data sums to ~100 for each category
  const categories = chart.categories || [];
  for (let catIndex = 0; catIndex < categories.length; catIndex++) {
    let sum = 0;
    for (let seriesIndex = 0; seriesIndex < chart.series.length; seriesIndex++) {
      sum += Number(chart.series[seriesIndex]?.data?.[catIndex] ?? 0);
    }
    // If sum is not close to 100 (within 5% tolerance), convert to percentages
    if (Math.abs(sum - 100) > 5) {
      return true;
    }
  }
  
  return false;
};

export default function BarChart({
  chart,
  customColors,
  theme = "default",
}: Props) {
  // ------------------------------------------------------------
  // Guard
  // ------------------------------------------------------------

  if (!chart.series || chart.series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Colors
  // ------------------------------------------------------------

  let colors: string[];

  if (
    customColors &&
    typeof customColors === "object" &&
    !Array.isArray(customColors)
  ) {
    colors = chart.series.map(
      (series, index) =>
        customColors[series.name] ||
        CHART_COLORS[index % CHART_COLORS.length]
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

  // ------------------------------------------------------------
  // Data transformation
  // ------------------------------------------------------------

  // Clone the chart data to avoid mutating the original
  let processedData = chart.series.map(series => ({
    ...series,
    data: [...(series.data || [])]
  }));

  const isPercentage = !needsPercentageConversion(chart);
  const categories = chart.categories || [];
  
  // If data is in absolute values, convert to percentages
  if (!isPercentage) {
    // Calculate totals for each category
    const categoryTotals: number[] = [];
    for (let catIndex = 0; catIndex < categories.length; catIndex++) {
      let total = 0;
      for (let seriesIndex = 0; seriesIndex < chart.series.length; seriesIndex++) {
        total += Number(chart.series[seriesIndex]?.data?.[catIndex] ?? 0);
      }
      categoryTotals.push(total);
    }
    
    // Convert each value to percentage
    processedData = processedData.map((series, seriesIndex) => ({
      ...series,
      data: series.data.map((value, catIndex) => {
        const total = categoryTotals[catIndex] || 1;
        return (Number(value) / total) * 100;
      })
    }));
  }

  // Store original values for tooltip display
  const originalData = chart.series.map(series => series.data || []);

  // ------------------------------------------------------------
  // Data helpers
  // ------------------------------------------------------------

  const getValue = (seriesIndex: number, categoryIndex: number) => {
    return Number(processedData[seriesIndex]?.data?.[categoryIndex] ?? 0);
  };

  const getOriginalValue = (seriesIndex: number, categoryIndex: number) => {
    return Number(originalData[seriesIndex]?.[categoryIndex] ?? 0);
  };

  const getSegmentBounds = (
    seriesIndex: number,
    categoryIndex: number
  ) => {
    let bottom = 0;

    for (let i = 0; i < seriesIndex; i++) {
      bottom += getValue(i, categoryIndex);
    }

    const value = getValue(seriesIndex, categoryIndex);

    return {
      bottom,
      top: bottom + value,
    };
  };

  // ------------------------------------------------------------
  // Smooth ribbon generator
  // ------------------------------------------------------------

  const createRibbonPoints = (
    x1: number,
    top1: number,
    bottom1: number,
    x2: number,
    top2: number,
    bottom2: number
  ) => {
    const points: [number, number][] = [];

    const distance = x2 - x1;
    const curve = distance * 0.42;

    const topControl1X = x1 + curve;
    const topControl2X = x2 - curve;
    const bottomControl1X = x1 + curve;
    const bottomControl2X = x2 - curve;

    const steps = 18;

    // Top curve: left -> right
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;

      const x =
        mt * mt * mt * x1 +
        3 * mt * mt * t * topControl1X +
        3 * mt * t * t * topControl2X +
        t * t * t * x2;

      const y =
        mt * mt * mt * top1 +
        3 * mt * mt * t * top1 +
        3 * mt * t * t * top2 +
        t * t * t * top2;

      points.push([x, y]);
    }

    // Bottom curve: right -> left
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const mt = 1 - t;

      const x =
        mt * mt * mt * x1 +
        3 * mt * mt * t * bottomControl1X +
        3 * mt * t * t * bottomControl2X +
        t * t * t * x2;

      const y =
        mt * mt * mt * bottom1 +
        3 * mt * mt * t * bottom1 +
        3 * mt * t * t * bottom2 +
        t * t * t * bottom2;

      points.push([x, y]);
    }

    return points;
  };

  // ------------------------------------------------------------
  // Connector data
  // ------------------------------------------------------------

  const connectorData: [number, number][] = [];

  for (let categoryIndex = 0; categoryIndex < categories.length - 1; categoryIndex++) {
    for (let seriesIndex = 0; seriesIndex < chart.series.length; seriesIndex++) {
      connectorData.push([categoryIndex, seriesIndex]);
    }
  }

  // ------------------------------------------------------------
  // Chart option
  // ------------------------------------------------------------

  const option = {
    color: colors,

    animation: true,
    animationDuration: 700,
    animationEasing: "cubicOut",

    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (params: any) => {
        const param = params[0];
        if (!param) return "";
        
        const categoryIndex = param.dataIndex;
        const categoryName = categories[categoryIndex] || "";
        
        let html = `<div style="font-weight:bold;margin-bottom:8px;">${toPersianDigits(categoryName)}</div>`;
        
        // Sort by value descending for better readability
        const sortedSeries = chart.series.map((s, i) => ({
          name: s.name,
          index: i,
          value: getOriginalValue(i, categoryIndex),
          percentage: getValue(i, categoryIndex)
        })).sort((a, b) => b.value - a.value);
        
        sortedSeries.forEach((item) => {
          if (item.percentage > 0.5) { // Only show items with > 0.5%
            const color = colors[item.index % colors.length];
            const formattedValue = isPercentage 
              ? `${toPersianDigits(item.percentage.toFixed(1))}٪`
              : formatValue(item.value, chart.unit || "");
            
            html += `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;padding:2px 0;">
                <span>
                  <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:8px;"></span>
                  ${item.name}
                </span>
                <span style="font-weight:bold;">${formattedValue}</span>
              </div>
            `;
          }
        });
        
        return html;
      },
    },

    legend: {
      bottom: 0,
      left: "center",
      right: "center",
      itemGap: 60,
      textStyle: {
        fontFamily: "inherit",
      },
      data: chart.series.map(series => series.name),
    },

    grid: {
      left: 80,
      right: 40,
      top: 65,
      bottom: 60,
      containLabel: true,
    },

    xAxis: {
      type: "category",
      data: categories.map(toPersianDigits),
      axisLabel: {
        fontFamily: "inherit",
        rotate: categories.length > 8 ? 30 : 0,
      },
      axisTick: {
        show: false,
      },
    },

    yAxis: {
      type: "value",
      max: 100,
      axisLabel: {
        formatter: (value: number) => {
          return `${toPersianDigits(value)}٪`;
        },
        fontFamily: "inherit",
      },
    },

    series: [
      // ========================================================
      // CONNECTING RIBBONS
      // ========================================================

      {
        name: "__connectors__",
        type: "custom",
        coordinateSystem: "cartesian2d",
        silent: true,
        z: 1,
        data: connectorData,
        legendHoverLink: false,

        renderItem: (params: any, api: any) => {
          const categoryIndex = Number(api.value(0));
          const seriesIndex = Number(api.value(1));

          const nextCategoryIndex = categoryIndex + 1;

          const source = getSegmentBounds(
            seriesIndex,
            categoryIndex
          );

          const target = getSegmentBounds(
            seriesIndex,
            nextCategoryIndex
          );

          const sourceCenter = api.coord([
            categoryIndex,
            0,
          ])[0];

          const targetCenter = api.coord([
            nextCategoryIndex,
            0,
          ])[0];

          const categoryWidth = Math.abs(
            api.size([1, 0])[0]
          );

          const barWidth = categoryWidth * 0.55;

          const x1 = sourceCenter + barWidth / 2;
          const x2 = targetCenter - barWidth / 2;

          const top1 = api.coord([
            categoryIndex,
            source.top,
          ])[1];

          const bottom1 = api.coord([
            categoryIndex,
            source.bottom,
          ])[1];

          const top2 = api.coord([
            nextCategoryIndex,
            target.top,
          ])[1];

          const bottom2 = api.coord([
            nextCategoryIndex,
            target.bottom,
          ])[1];

          const points = createRibbonPoints(
            x1,
            top1,
            bottom1,
            x2,
            top2,
            bottom2
          );

          return {
            type: "polygon",
            shape: {
              points,
            },
            style: {
              fill: colors[seriesIndex % colors.length],
              opacity: 0.42,
            },
          };
        },
      },

      // ========================================================
      // STACKED BARS
      // ========================================================

      ...processedData.map((series, index) => ({
        name: series.name,
        type: "bar",
        stack: "total",
        z: 3,
        barWidth: "55%",
        itemStyle: {
          color: colors[index % colors.length],
          borderColor: "#ffffff",
          borderWidth: 1,
        },
        emphasis: {
          focus: "series",
          itemStyle: {
            opacity: 0.9,
          },
        },
        data: series.data || [],
      })),
    ],
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
          height: "820px",
          minHeight: "420px",
        }}
        opts={{
          renderer: "svg",
        }}
      />
    </div>
  );
}