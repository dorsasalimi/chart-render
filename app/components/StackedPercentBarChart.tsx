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

const toPersianDigits = (value: string | number) => {
  return String(value).replace(
    /\d/g,
    (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]
  );
};

const formatTooltipValue = (value: number) => {
  if (value >= 1e12) {
    return `${toPersianDigits((value / 1e12).toFixed(1))} تریلیون`;
  }

  if (value >= 1e9) {
    return `${toPersianDigits((value / 1e9).toFixed(1))} میلیارد`;
  }

  if (value >= 1e6) {
    return `${toPersianDigits((value / 1e6).toFixed(1))} میلیون`;
  }

  if (value >= 1e3) {
    return `${toPersianDigits((value / 1e3).toFixed(1))} هزار`;
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
        fontSize: "14px",
      },

      formatter: (params: any[]) => {
        if (!params?.length) return "";

        const categoryIndex = params[0]?.dataIndex;

        if (categoryIndex === undefined || categoryIndex === null) {
          return "";
        }

        let html = `
          <div style="font-weight:700;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid #F0F0F0;">
            ${toPersianDigits(categories[categoryIndex] ?? "")}
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
                <span>${p.seriesName}</span>
              </div>
              <span style="font-weight:700;">
                ${toPersianDigits(Number(p.value).toFixed(1))}٪${
            rawValue !== undefined
              ? ` (${formatTooltipValue(rawValue)} ${rawUnit})`
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
        fontFamily: "Epsilon",
        color: "#9CA3AF",
        formatter: (value: number) => `${toPersianDigits(value)}٪`,
      },
      splitLine: {
        lineStyle: { color: "#F0F1F3" },
      },
    },

    yAxis: {
      type: "category",
      inverse: true,
      data: categories.map(toPersianDigits),
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisTick: { show: false },
      axisLabel: {
        fontFamily: "Epsilon",
        color: "#374151",
        fontSize: 13,
      },
    },

    barCategoryGap: "22%",

    series: sortedSeries.map((series, seriesIndex) => ({
      name: series.name,
      type: "bar",
      stack: "total",
      data: series.data,
      itemStyle: {
        color: colors[seriesIndex],
      },
      label: { show: false },
    })),
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
          className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2"
          dir="rtl"
        >
          {chart.series.map((series, seriesIndex) => (
            <div
              key={`${series.name}-${seriesIndex}`}
              className="inline-flex items-center gap-2 text-xs"
            >
              <span
                className="h-2.5 w-4 shrink-0 rounded-[3px]"
                style={{ backgroundColor: colors[seriesIndex] }}
              />
              <span
                className="text-[#5F6368]"
                style={{
                  fontSize: "13px",
                  fontFamily: "Epsilon",
                  fontWeight: 500,
                }}
              >
                {toPersianDigits(series.name)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
