"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { CategoryChart } from "../types/charts";

interface Props {
  chart: CategoryChart;
  height?: number;
  showLegend?: boolean;
}

const SERIES_COLORS = ["#2f4b9e", "#8ea0d8", "#a4cdb6", "#fba919"];

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

// Fixes character mirroring for ECharts vectorizer by swapping mirrored glyphs
const fixMirroredChars = (text: string) => {
  return text
    .replace(/\(/g, "___OPEN_PAREN___")
    .replace(/\)/g, "(")
    .replace(/___OPEN_PAREN___/g, ")");
};

const toPersianLabel = (text: string) => {
  if (!text) return "";
  const withDigits = String(text).replace(
    /\d/g,
    (digit) => PERSIAN_DIGITS[Number(digit)]
  );
  return fixMirroredChars(withDigits);
};

// Matches formatPrice() in persian.js: Persian digits with the Arabic
// decimal separator (U+066B ٫) instead of a period, trimming a bare ".0".
const formatDecimal = (value: number) => {
  const fixed = value.toFixed(1);
  const trimmed = fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
  return toPersianDigits(trimmed.replace(".", "٫"));
};

const formatPercent = formatDecimal;

const formatTooltipValue = (value: number) => {
  if (value >= 1e12) {
    return `${formatDecimal(value / 1e12)} تریلیون`;
  }

  if (value >= 1e9) {
    return `${formatDecimal(value / 1e9)} میلیارد`;
  }

  if (value >= 1e6) {
    return `${formatDecimal(value / 1e6)} میلیون`;
  }

  if (value >= 1e3) {
    return `${formatDecimal(value / 1e3)} هزار`;
  }

  return toPersianDigits(value);
};

export default function StackedPercentBarChart({
  chart,
  height = 420,
  showLegend = true,
}: Props) {
  if (!chart.series?.length || !chart.categories?.length) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg bg-[#F7F9F8]">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  const rawUnit = chart.rawUnit ?? chart.unit ?? "";

  const sortSeries = chart.series.find((s) => s.name === "صادرات") ?? chart.series[0];

  const sortedIndices = useMemo(
    () =>
      chart.categories
        .map((_, index) => index)
        .sort((a, b) => Number(sortSeries.data[b] ?? 0) - Number(sortSeries.data[a] ?? 0)),
    [chart.categories, sortSeries]
  );

  const categories = sortedIndices.map((index) => chart.categories[index]);

  const sortedSeries = useMemo(
    () =>
      chart.series.map((series) => ({
        ...series,
        data: sortedIndices.map((index) => series.data[index]),
        rawData: series.rawData
          ? sortedIndices.map((index) => series.rawData![index])
          : undefined,
      })),
    [chart.series, sortedIndices]
  );

  const colors = useMemo(
    () =>
      sortedSeries.map(
        (_, index) => SERIES_COLORS[index % SERIES_COLORS.length]
      ),
    [sortedSeries]
  );

  const exportSeriesData =
    sortedSeries.find((s) => s.name === "صادرات")?.data ?? [];
  const importSeriesData =
    sortedSeries.find((s) => s.name === "واردات")?.data ?? [];

  const bandarIndex = categories.indexOf("م.و.ا. بندر امام خمینی (ره)");
  const meshhadIndex = categories.indexOf("مشهد");

  const bandarExportValue = Number(exportSeriesData[bandarIndex] ?? 0);
  const meshhadExportValue = Number(exportSeriesData[meshhadIndex] ?? 0);
  const meshhadImportValue = Number(importSeriesData[meshhadIndex] ?? 0);

  const targetExportX = bandarExportValue / 2;
  const targetImportX = meshhadExportValue + meshhadImportValue / 2;

  const exportLabelPercent = (value: number) =>
    value > 0 ? `${(100 * targetExportX) / value}%` : "50%";

  const importLabelPercent = (dataIndex: number, value: number) => {
    if (value <= 0) return "50%";
    const rowExportValue = Number(exportSeriesData[dataIndex] ?? 0);
    return `${(100 * (targetImportX - rowExportValue)) / value}%`;
  };

  // Convert categories to Persian with proper parentheses handling
  const persianCategories = categories.map(toPersianLabel);

  const option = {
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut",

    backgroundColor: "transparent",

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      padding: [12, 14],

      textStyle: {
        fontFamily: "Epsilon",
        color: "#374151",
        fontSize: "40px",
      },

      formatter: (params: any[]) => {
        if (!params?.length) return "";

        const categoryIndex = params[0]?.dataIndex;

        if (categoryIndex === undefined || categoryIndex === null) {
          return "";
        }

        const categoryName = toPersianLabel(categories[categoryIndex] ?? "");

        let html = `
          <div style="font-weight:700;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid #F0F0F0;">
            ${categoryName}
          </div>
        `;

        params.forEach((p) => {
          const seriesIndex = sortedSeries.findIndex(
            (s) => s.name === p.seriesName
          );
          const rawValue = sortedSeries[seriesIndex]?.rawData?.[
            categoryIndex
          ];

          html += `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;padding:4px 0;">
              <div style="display:flex;align-items:center;gap:7px;">
                ${p.marker}
                <span>${toPersianLabel(p.seriesName)}</span>
              </div>
              <span style="font-weight:700;">
                ٪${formatPercent(Number(p.value))}${
            rawValue !== undefined
              ? ` (${formatTooltipValue(rawValue)} ${toPersianLabel(rawUnit)})`
              : ""
          }
              </span>
            </div>
          `;
        });

        return html;
      },
    },

    legend: {
      show: false,
    },

    grid: {
      left: 24,
      right: 40,
      top: 16,
      bottom: 16,
      containLabel: true,
    },

    xAxis: {
      type: "value",
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
            margin: 20, // Adjust this value to control the gap

        fontFamily: "Epsilon",
        color: "#4B5563",
        fontSize: 40,

        formatter: (value: number) => `٪${toPersianDigits(value)}`,
      },
      splitLine: {
        show: false,
      },
    },

yAxis: {
  type: "category",
  inverse: true,
  data: persianCategories,
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: {
    fontFamily: "Epsilon",
    color: "#4B5563",
    fontSize: 40,
    // Add margin to control gap between label and bars
    margin: 30, // Adjust this value to control the gap
    // Or use rich text for more precise positioning
    rich: {
      label: {
        align: 'right',
        verticalAlign: 'middle',
        padding: [0, 8, 0, 0] // [top, right, bottom, left]
      }
    }
  },
  splitLine: {
    show: false,
  },
},

    barCategoryGap: "22%",

    series: sortedSeries.map((series, seriesIndex) => {
      const isExport = series.name === "صادرات";
      const isImport = series.name === "واردات";
      const categoryCount = categories.length;

      return {
        name: toPersianLabel(series.name),
        type: "bar",
        stack: "total",
        data: series.data.map((value, dataIndex) => {
          const show = isExport
            ? dataIndex < 7
            : isImport
            ? dataIndex >= categoryCount - 8
            : false;

          const numericValue = Number(value);
          
          // Set position, alignment, and padding based on series type
          let position;
          let align;
          let padding: [number, number, number, number] | undefined;
          
          if (isExport) {
            // صادرات - left aligned with spacing from left edge
            position = "left";
            align = "left";
            padding = [0, 0, 0, 12]; // [top, right, bottom, left] - 12px spacing from left
          } else if (isImport) {
            // واردات - right aligned with spacing from right edge
            position = "right";
            align = "right";
            padding = [0, 12, 0, 0]; // [top, right, bottom, left] - 12px spacing from right
          } else {
            // Default for any other series
            position = "inside";
            align = "center";
            padding = undefined;
          }

          return {
            value,
            label: {
              show,
              position: position,
              align: align,
              padding: padding,
            },
          };
        }),
        itemStyle: {
          color: colors[seriesIndex],
        },
        label: {
          show: false,
          position: "inside", // Default position
          color: "#FFFFFF",
          fontFamily: "Epsilon",
          fontSize: 40,
          fontWeight: 400,
          formatter: (params: any) => `٪${formatPercent(Number(params.value))}`,
        },
      };
    }),
  };

  return (
    <div className="w-full">
      <div
        style={{
          width: "100%",
          aspectRatio: "380 / 230",
          minHeight: `${height}px`,
        }}
      >
        <ReactECharts
          option={option}
          notMerge={true}
          lazyUpdate={true}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer: "svg" }}
          onChartReady={(instance) => {
            const dom = instance.getDom();
            dom.setAttribute("data-echarts-instance", "true");
          }}
        />
      </div>

      {showLegend && (
        <div
          data-chart-custom-legend="true"
          className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2"
          dir="rtl"
        >
          {chart.series.map((series, seriesIndex) => (
            <div
              key={`${series.name}-${seriesIndex}`}
              className="inline-flex items-center gap-2 text-xs"
            >
              <span
                className="h-3.5 w-6 shrink-0 rounded-[3px]"
                style={{ backgroundColor: colors[seriesIndex] }}
              />
              <span
                className="text-[#5F6368]"
                style={{
                  fontSize: "40px",
                  fontFamily: "Epsilon",
                  fontWeight: 400,
                }}
              >
                {toPersianLabel(series.name)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}