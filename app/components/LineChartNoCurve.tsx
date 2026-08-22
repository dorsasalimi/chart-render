"use client";

import ReactECharts from "echarts-for-react";
import { getRankedColorsForChart } from "../lib/colorThemes";

interface ChartSeries {
  name: string;
  data: number[];
}

interface CategoryChart {
  id: string;
  title: string;
  type: string;
  unit?: string;
  subtitle?: string;
  categories: string[];
  series: ChartSeries[];
}

interface LineChartType extends CategoryChart {
  xAxisLabel?: string;
  yAxisLabel?: string;
}

interface Props {
  chart: LineChartType;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

const formatNumber = (value: number) => {
  // If the absolute value is less than 1 and not zero, format without leading zero
  if (Math.abs(value) < 1 && value !== 0) {
    // Convert to Persian digits and remove the leading zero
    const formatted = toPersianDigits(value.toString());
    // Remove the leading zero and the decimal point, keep only the decimal part
    return formatted.replace(/^۰\./, '۰٫');
  }
  
  // For other values, use compact notation
  return new Intl.NumberFormat("fa-IR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const formatFullNumber = (value: number) => {
  return new Intl.NumberFormat("fa-IR").format(value);
};

// New function to format number without unit text (just the number part)
const formatNumberWithoutUnit = (value: number) => {
  const formatted = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
  // Remove any non-digit, non-decimal, non-separator characters
  // This removes suffixes like "B", "M", "K" etc.
  return formatted.replace(/[^0-9.\u0660-\u0669]/g, '').trim();
};

export default function LineChartNoCurve({
  chart,
  height = 310,
  showLegend = true,
  showLabels = true
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

  // Get ranked colors for line chart
  const colors = getRankedColorsForChart({ series: chart.series });

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
      smooth: false,
      symbol: "circle",
      symbolSize: 7,
      lineStyle: {
        width: 2.5,
      },
      itemStyle: {
        color: seriesColor,
        borderColor: "#FFFFFF",
        borderWidth: 0,
        borderRadius: 8,
      },
      emphasis: {
        focus: "series",
        scale: true,
        itemStyle: {
          borderWidth: 0,
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
          // Show just the number without any unit text
          const formattedNumber = toPersianDigits(formatNumberWithoutUnit(params.value));
          return formattedNumber;
        },
        fontSize: '16px',
fontFamily: "Epsilon",        fontWeight: 600,
        color: seriesColor,
        borderRadius: 5,
        borderColor: `${seriesColor}22`,
        borderWidth: 0,
      } : {
        show: false
      },
      labelLayout: {
        hideOverlap: true,
      },
      areaStyle: {
        opacity: 0.025,
      },
    };
  });

  const option = {
    color: colors,
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "#E5E7EB",
      borderWidth: 0,
      padding: [12, 14],
      textStyle: {
        fontFamily: "Epsilon",
        color: "#111827",
        fontSize: '16px',
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
 legend: showLegend
  ? {
      bottom: 8,
      left: "center",
      right: 12,
      orient: "horizontal",
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 20,
      icon: "circle",
      selectedMode: true,
      textStyle: {
        fontFamily: "Epsilon",
        fontSize: '16px',
        fontWeight: 500,
        color: "#4B5563",
      },
      width: "94%",
    }
  : {
      show: false,
    },
grid: {
  left: 56,
  right: 24,
  top: showLegend ? 48 : 24,
  bottom: showLegend ? 90 : 34,  // Even more space
  containLabel: true,
},
    xAxis: {
      type: "category",
      data: categories.map(toPersianDigits),
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: "#E5E7EB",
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        fontSize: '16px',
        fontFamily: "Epsilon",
        color: "#6B7280",
        margin: 14,
        rotate: categories && categories.length > 8 ? 30 : 0,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          color: "#F0F1F3",
          type: "solid",
        },
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        fontSize: '16px',
        fontFamily: "Epsilon",
        color: "#9CA3AF",
        formatter: (value: number) => {
          return toPersianDigits(formatNumber(value));
        },
      },
    },
    series: series,
  };
return (
  <div
    style={{
      width: "100%",
      aspectRatio: "510 / 310",
      minHeight: `${height}px`,
    }}
  >
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{
        width: "100%",
        height: "100%",
      }}
      opts={{
        renderer: "svg",
      }}
      onChartReady={(instance) => {
        const dom = instance.getDom();
        dom.setAttribute("data-echarts-instance", "true");
      }}
    />
  </div>
);
}