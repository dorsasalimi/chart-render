"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";

interface ChartDataItem {
  name: string;
  value: number;
}

interface TradeChartData {
  id: string;
  title: string;
  type: string;
  unit?: string;
  data: ChartDataItem[];
}

interface MonthlyTradeChartProps {
  imports: TradeChartData;
  exports: TradeChartData;
  balance: TradeChartData;

  width?: number;
  height?: number;
}

const FONT_FAMILY =
  "Epsilon, IRANSansX, IRANSans, Vazirmatn, Tahoma, Arial, sans-serif";

const IMPORT_COLOR = "#1d245f";
const EXPORT_COLOR = "#ef542d";
const BALANCE_COLOR = "#c99a32";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

function formatValue(value: number): string {
  return `${toPersianDigits(value.toFixed(1))}B$`;
}

function formatTotal(value: number): string {
  return `${toPersianDigits(value.toFixed(1))}B$`;
}

function getMaxValue(data: ChartDataItem[]): number {
  return Math.max(...data.map((item) => Math.abs(item.value)), 1);
}

export default function MonthlyTradeChart({
  imports,
  exports,
  balance,
  width = 900,
  height = 600,
}: MonthlyTradeChartProps) {
  const categories = useMemo(
    () => imports.data.map((item) => item.name),
    [imports.data]
  );

  const importValues = useMemo(
    () => imports.data.map((item) => item.value),
    [imports.data]
  );

  const exportValues = useMemo(
    () => exports.data.map((item) => item.value),
    [exports.data]
  );

  const balanceValues = useMemo(
    () => balance.data.map((item) => item.value),
    [balance.data]
  );

  const importTotal = useMemo(
    () => importValues.reduce((sum, value) => sum + value, 0),
    [importValues]
  );

  const exportTotal = useMemo(
    () => exportValues.reduce((sum, value) => sum + value, 0),
    [exportValues]
  );

  const balanceTotal = useMemo(
    () => exportTotal - importTotal,
    [exportTotal, importTotal]
  );

  const maxTradeValue = Math.max(
    getMaxValue(imports.data),
    getMaxValue(exports.data)
  );

  /*
   * Keep both bar charts on exactly the same scale.
   */
  const tradeAxisMax = Math.ceil(maxTradeValue + 0.5);

  /*
   * Balance axis is intentionally much smaller.
   * This controls how far the yellow line can move away
   * from the center.
   */
  const balanceAbsMax = Math.max(
    ...balanceValues.map((value) => Math.abs(value)),
    1
  );

  const balanceAxisMax = Math.max(
    Math.ceil(balanceAbsMax * 10) / 10,
    1.2
  );

  /*
   * Common category configuration.
   *
   * ECharts categories are rendered top -> bottom,
   * so we reverse the data visually to match the
   * reference chart.
   */
  const categoryAxis = {
    type: "category" as const,
    data: [...categories].reverse(),
    inverse: false,
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: false,
    },
    splitLine: {
      show: false,
    },
  };

  /*
   * LEFT — IMPORTS
   *
   * The x-axis is reversed so bars grow from the
   * center toward the left.
   */
  const importOption = {
    animation: false,

    grid: {
      left: 0,
      right: 0,
      top: 72,
      bottom: 65,
      containLabel: false,
    },

    xAxis: {
      type: "value",
      min: 0,
      max: tradeAxisMax,
      inverse: true,

      axisLine: {
        show: true,
        lineStyle: {
          color: "#777",
          width: 1,
          type: "dotted",
        },
      },

      axisTick: {
        show: true,
        length: 5,
        lineStyle: {
          color: "#777",
        },
      },

      axisLabel: {
        show: true,
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        color: "#222",
        formatter: (value: number) => `${toPersianDigits(value)}B$`,
      },

      splitLine: {
        show: true,
        lineStyle: {
          color: "#d4d4d4",
          type: "dotted",
          width: 1,
        },
      },
    },

    yAxis: categoryAxis,

    series: [
      {
        type: "bar",
        data: [...importValues].reverse(),

        barWidth: 22,

        itemStyle: {
          color: IMPORT_COLOR,
        },

        label: {
          show: true,
          position: "insideRight",

          color: "#fff",
          fontFamily: FONT_FAMILY,
          fontSize: 13,

          formatter: ({ value }: { value: number }) =>
            formatValue(Number(value)),
        },

        emphasis: {
          disabled: true,
        },
      },
    ],
  };

  /*
   * RIGHT — EXPORTS
   */
  const exportOption = {
    animation: false,

    grid: {
      left: 0,
      right: 0,
      top: 72,
      bottom: 65,
      containLabel: false,
    },

    xAxis: {
      type: "value",
      min: 0,
      max: tradeAxisMax,

      axisLine: {
        show: true,
        lineStyle: {
          color: "#777",
          width: 1,
          type: "dotted",
        },
      },

      axisTick: {
        show: true,
        length: 5,
        lineStyle: {
          color: "#777",
        },
      },

      axisLabel: {
        show: true,
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        color: "#222",
        formatter: (value: number) => `${toPersianDigits(value)}B$`,
      },

      splitLine: {
        show: true,
        lineStyle: {
          color: "#d4d4d4",
          type: "dotted",
          width: 1,
        },
      },
    },

    yAxis: categoryAxis,

    series: [
      {
        type: "bar",
        data: [...exportValues].reverse(),

        barWidth: 22,

        itemStyle: {
          color: EXPORT_COLOR,
        },

        label: {
          show: true,
          position: "insideLeft",

          color: "#fff",
          fontFamily: FONT_FAMILY,
          fontSize: 13,

          formatter: ({ value }: { value: number }) =>
            formatValue(Number(value)),
        },

        emphasis: {
          disabled: true,
        },
      },
    ],
  };

  /*
   * CENTER — TRADE BALANCE
   *
   * This chart has a transparent background and sits
   * on top of the two bar charts.
   *
   * Negative = left
   * Positive = right
   */
  const balanceOption = {
    animation: false,

    grid: {
      left: 0,
      right: 0,
      top: 72,
      bottom: 65,
    },

    xAxis: {
      type: "value",

      min: -balanceAxisMax,
      max: balanceAxisMax,

      axisLine: {
        show: false,
      },

      axisTick: {
        show: false,
      },

      axisLabel: {
        show: false,
      },

      splitLine: {
        show: false,
      },
    },

    yAxis: {
      type: "category",
      data: [...categories].reverse(),

      axisLine: {
        show: false,
      },

      axisTick: {
        show: false,
      },

      axisLabel: {
        show: false,
      },

      splitLine: {
        show: false,
      },
    },

    series: [
      {
        type: "line",

        data: [...balanceValues].reverse().map((value, index) => [
          value,
          index,
        ]),

        smooth: false,

        symbol: "circle",
        symbolSize: 8,

        lineStyle: {
          color: BALANCE_COLOR,
          width: 2,
        },

        itemStyle: {
          color: BALANCE_COLOR,
          borderColor: BALANCE_COLOR,
        },

        emphasis: {
          disabled: true,
        },

        z: 20,
      },
    ],
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: width,
        margin: "0 auto",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "relative",
          height: 75,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        {/* Import total */}
        <div
          style={{
            position: "absolute",
            left: "20%",
            top: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: IMPORT_COLOR,
              fontSize: 24,
              fontWeight: 700,
              direction: "rtl",
            }}
          >
            {formatTotal(importTotal)}
          </div>

          <div
            style={{
              color: IMPORT_COLOR,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            مجموع واردات
          </div>
        </div>

        {/* Balance total */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: 15,
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: BALANCE_COLOR,
              fontSize: 19,
              fontWeight: 700,
              direction: "rtl",
            }}
          >
            {balanceTotal < 0 ? "−" : "+"}
            {toPersianDigits(Math.abs(balanceTotal).toFixed(1))}B$
          </div>

          <div
            style={{
              color: BALANCE_COLOR,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            تراز تجاری
          </div>
        </div>

        {/* Export total */}
        <div
          style={{
            position: "absolute",
            right: "20%",
            top: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: EXPORT_COLOR,
              fontSize: 24,
              fontWeight: 700,
              direction: "rtl",
            }}
          >
            {formatTotal(exportTotal)}
          </div>

          <div
            style={{
              color: EXPORT_COLOR,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            مجموع صادرات
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {/* IMPORTS */}
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <ReactECharts
            option={importOption}
            style={{
              width: "100%",
              height: "100%",
            }}
            opts={{
              renderer: "svg",
            }}
            notMerge
            lazyUpdate={false}
          />
        </div>

        {/* EXPORTS */}
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <ReactECharts
            option={exportOption}
            style={{
              width: "100%",
              height: "100%",
            }}
            opts={{
              renderer: "svg",
            }}
            notMerge
            lazyUpdate={false}
          />
        </div>

        {/* BALANCE OVERLAY */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <ReactECharts
            option={balanceOption}
            style={{
              width: "100%",
              height: "100%",
            }}
            opts={{
              renderer: "svg",
            }}
            notMerge
            lazyUpdate={false}
          />
        </div>

        {/* Center zero line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 72,
            bottom: 65,
            width: 1,
            transform: "translateX(-50%)",
            borderLeft: "1px dotted #999",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* Month labels */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 72,
            bottom: 65,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          {[...categories].reverse().map((month) => (
            <div
              key={month}
              style={{
                width: 42,
                textAlign: "center",
                fontFamily: FONT_FAMILY,
                fontSize: 13,
                fontWeight: 500,
                color: "#222",
                background: "#fff",
                lineHeight: 1,
              }}
            >
              {toPersianDigits(month)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}