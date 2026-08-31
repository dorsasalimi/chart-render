"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface AgriculturalTradeData {
  year: string;
  imports: number;
  exports: number;
  importShare: number;
  exportShare: number;
}

interface AgriculturalTradeChartProps {
  data: AgriculturalTradeData[];
}

const IMPORT_COLOR = "#1d3767";
const EXPORT_COLOR = "#a84b41";
const AXIS_COLOR = "#808285";
const GRID_COLOR = "#b8b9b9";
const FONT_FAMILY = "Epsilon";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function toPersianDigits(value: string | number) {
  return String(value)
    .replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)])
    .replace(/\./g, "٫");
}

function formatNumber(value: number) {
  return toPersianDigits(value.toFixed(1));
}

function formatPercent(value: number) {
  return `٪${formatNumber(value)}`;
}

export default function AgriculturalTradeChart({ data }: AgriculturalTradeChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const years = data.map((item) => item.year);
    const imports = data.map((item) => ({ value: item.imports, original: item.imports }));
    const importShares = data.map((item) => ({
      value: item.imports * (item.importShare / 100),
      share: item.importShare,
    }));
    const exports = data.map((item) => ({ value: -item.exports, original: item.exports }));
    const exportShares = data.map((item) => ({
      value: -(item.exports * (item.exportShare / 100)),
      share: item.exportShare,
    }));
    const maxValue = Math.max(
      ...data.flatMap((item) => [item.imports, item.exports]),
      1,
    );
    const axisMax = Math.max(80, Math.ceil(maxValue / 20) * 20);

    const totalLabel = (position: "top" | "bottom", color: string) => ({
      show: true,
      position,
      distance: 7,
      color,
      fontSize: 40,
      fontFamily: FONT_FAMILY,
      fontWeight: 500,
      formatter: (params: unknown) => {
        const point = params as {
          data: { original: number };
          dataIndex: number;
        };
        return formatNumber(point.data.original);
      },
    });

    const shareLabel = (position: "top" | "bottom", color: string) => ({
      show: true,
      position,
      distance: 6,
      color,
      fontSize: 40,
      fontFamily: FONT_FAMILY,
      fontWeight: 500,
      formatter: (params: unknown) => {
        const point = params as {
          data: { share: number };
          dataIndex: number;
        };
        return formatPercent(point.data.share);
      },
    });

    return {
      animation: false,
      backgroundColor: "transparent",
      color: [IMPORT_COLOR, IMPORT_COLOR, EXPORT_COLOR, EXPORT_COLOR],
      textStyle: { fontFamily: FONT_FAMILY },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderColor: "#E5E7EB",
        borderWidth: 0,
        padding: [12, 14],
        textStyle: { fontFamily: FONT_FAMILY, color: "#111827", fontSize: 40 },
        extraCssText: "border-radius:12px; direction:rtl; text-align:right;",
        axisPointer: {
          type: "line",
          lineStyle: { color: "#D1D5DB", width: 1, type: [8, 8] },
        },
        formatter: (params: unknown) => {
          const index = (params as Array<{ dataIndex?: number }>)?.[0]?.dataIndex;
          const item = typeof index === "number" ? data[index] : undefined;
          if (!item) return "";

          return [
            `<strong>${toPersianDigits(item.year)}</strong>`,
            `کل واردات: ${formatNumber(item.imports)} B$`,
            `سهم کشاورزی واردات: ${formatPercent(item.importShare)}`,
            `کل صادرات: ${formatNumber(item.exports)} B$`,
            `سهم کشاورزی صادرات: ${formatPercent(item.exportShare)}`,
          ].join("<br/>");
        },
      },
      legend: { show: false },
      grid: {
        left: 72,
        right: 72,
        top: 24,
        bottom: 48,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: years.map(toPersianDigits),
        boundaryGap: true,
        axisLine: { show: true, onZero: false, lineStyle: { color: "#aeb7c9", width: 1 } },
        axisTick: {
          show: true,
          alignWithLabel: true,
          inside: true,
          length: 8,
          lineStyle: { color: "#aeb7c9", width: 1.5 },
        },
        axisLabel: {
          show: true,
          fontSize: 40,
          fontFamily: FONT_FAMILY,
          color: AXIS_COLOR,
          margin: 10,
          rotate: 0,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: -axisMax,
        max: axisMax,
        interval: 20,
        axisLine: { show: true, lineStyle: { color: "#aeb7c9", width: 1 } },
        axisTick: {
          show: true,
          inside: true,
          length: 8,
          lineStyle: { color: "#aeb7c9", width: 1.5 },
        },
        splitLine: {
          show: true,
          lineStyle: { color: GRID_COLOR, width: 0.7, opacity: 0.42 },
        },
        axisLabel: {
          fontSize: 40,
          fontFamily: FONT_FAMILY,
          color: AXIS_COLOR,
          margin: 20,
          formatter: (value: number) =>
            value === 0 ? "۰" : `${toPersianDigits(Math.abs(value))} B$`,
        },
      },
      series: [
        {
          name: "کل واردات",
          type: "line",
          data: imports,
          smooth: false,
          symbol: "circle",
          symbolSize: 20,
          lineStyle: { color: IMPORT_COLOR, width: 5.5 },
          itemStyle: { color: IMPORT_COLOR, borderWidth: 0 },
          areaStyle: { color: IMPORT_COLOR, opacity: 0.22 },
          label: totalLabel("top", IMPORT_COLOR),
          markLine: {
            silent: true,
            symbol: ["none", "none"],
            label: { show: false },
            lineStyle: { color: "#687085", width: 1.25, type: "solid" },
            data: [{ yAxis: 0 }],
          },
        },
        {
          name: "سهم کشاورزی واردات",
          type: "line",
          data: importShares,
          smooth: false,
          symbol: "circle",
          symbolSize: 20,
          lineStyle: { color: "#f8fafc", width: 5.5 },
          itemStyle: { color: "#ffffff", borderColor: "#d8deea", borderWidth: 1 },
          areaStyle: { color: IMPORT_COLOR, opacity: 0.86 },
          label: shareLabel("top", IMPORT_COLOR),
        },
        {
          name: "کل صادرات",
          type: "line",
          data: exports,
          smooth: false,
          symbol: "circle",
          symbolSize: 20,
          lineStyle: { color: EXPORT_COLOR, width: 5.5 },
          itemStyle: { color: EXPORT_COLOR, borderWidth: 0 },
          areaStyle: { color: EXPORT_COLOR, opacity: 0.4 },
          label: totalLabel("bottom", EXPORT_COLOR),
        },
        {
          name: "سهم کشاورزی صادرات",
          type: "line",
          data: exportShares,
          smooth: false,
          symbol: "circle",
          symbolSize: 20,
          lineStyle: { color: "#ffffff", width: 5.5 },
          itemStyle: { color: "#ffffff", borderColor: "#d8deea", borderWidth: 1 },
          areaStyle: { color: EXPORT_COLOR, opacity: 0.9 },
          label: shareLabel("bottom", EXPORT_COLOR),
        },
      ],
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex aspect-[380/230] items-center justify-center bg-[#F7F9F8]">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", aspectRatio: "380 / 230" }}>
      <ReactECharts
        option={option}
        notMerge
        lazyUpdate={false}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "svg" }}
        onChartReady={(instance) => {
          instance.getDom().setAttribute("data-echarts-instance", "true");
        }}
      />
    </div>
  );
}