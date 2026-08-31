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

const IMPORT_COLOR = "#1d3767";
const EXPORT_COLOR = "#a84b41";
const BALANCE_COLOR = "#c99a32";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const PERSIAN_DECIMAL = "٫"; // Persian decimal separator

function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

function toPersianDecimalSeparator(value: string): string {
  return value.replace(/\./g, PERSIAN_DECIMAL);
}

function formatValue(value: number): string {
  const formatted = toPersianDigits(value.toFixed(1));
  return `${toPersianDecimalSeparator(formatted)}B$`;
}

function formatAxisValue(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue === 0) {
    return "۰";
  }

  const formatted = toPersianDigits(absoluteValue.toFixed(0));
  return `${formatted}B$`;
}

function formatTotal(value: number): string {
  const formatted = toPersianDigits(value.toFixed(1));
  return `${toPersianDecimalSeparator(formatted)}B$`;
}

export default function MonthlyTradeChart({
  imports,
  exports,
  balance,
}: MonthlyTradeChartProps) {
  /*
   * ---------------------------------------------------------
   * DATA
   * ---------------------------------------------------------
   */

  const categories = useMemo(
    () => imports.data.map((item) => item.name).reverse(),
    [imports.data],
  );

  const importValues = useMemo(() => {
    const map = new Map(imports.data.map((item) => [item.name, item.value]));

    return categories.map((month) => -(map.get(month) ?? 0));
  }, [imports.data, categories]);

  const exportValues = useMemo(() => {
    const map = new Map(exports.data.map((item) => [item.name, item.value]));

    return categories.map((month) => map.get(month) ?? 0);
  }, [exports.data, categories]);

  const balanceValues = useMemo(() => {
    const map = new Map(balance.data.map((item) => [item.name, item.value]));

    return categories.map((month) => map.get(month) ?? 0);
  }, [balance.data, categories]);

  /*
   * ---------------------------------------------------------
   * TOTALS
   * ---------------------------------------------------------
   */

  const importTotal = useMemo(
    () => imports.data.reduce((sum, item) => sum + item.value, 0),
    [imports.data],
  );

  const exportTotal = useMemo(
    () => exports.data.reduce((sum, item) => sum + item.value, 0),
    [exports.data],
  );

  const balanceTotal = exportTotal - importTotal;

  /*
   * ---------------------------------------------------------
   * AXIS SCALE
   * ---------------------------------------------------------
   *
   * Both sides MUST use exactly the same scale.
   */

  const maxTradeValue = Math.max(
    ...imports.data.map((item) => item.value),
    ...exports.data.map((item) => item.value),
    1,
  );

  /*
   * Gives us a little breathing room above the largest bar.
   *
   * Example:
   * largest value = 6.1
   * axis max = 7
   */

  const tradeAxisMax = Math.ceil(maxTradeValue + 0.5);

  /*
   * ---------------------------------------------------------
   * CHART OPTION
   * ---------------------------------------------------------
   *
   * Everything is rendered in ONE ECharts instance.
   *
   * Negative values  -> imports -> LEFT
   * Positive values  -> exports -> RIGHT
   * Balance           -> yellow line
   */

  const chartOption = useMemo(
    () => ({
      animation: false,

      grid: {
        left: 5,
        right: 40,
        top: 25,
        bottom: 2,
        containLabel: true,
      },

      xAxis: {
        type: "value",

        min: -tradeAxisMax,
        max: tradeAxisMax,

        interval: 2,

       axisLine: {
          show: true,
          onZero: false,
          lineStyle: {
            color: "#b8b9b9",
            width: 1,
            type: [8, 8],
          },
        },

        axisTick: {
          show: false,
          alignWithLabel: true,
          inside: true, // Changed from false to true
          length: 8,
          lineStyle: {
            color: "#b8b9b9",
            width: 2,
          },
        },

        axisLabel: {
          show: true,

          fontFamily: FONT_FAMILY,
          fontSize: 40,
          color: "#808285",

          formatter: (value: number) => formatAxisValue(value),
        },

        splitLine: {
          show: true,

          lineStyle: {
            color: "#b8b9b9",
            type: [8, 8],
            width: 1,
          },
        },
      },

      yAxis: {
        type: "category",
        position: "left",
        data: categories,

        axisLine: {
          show: true,
          onZero: false,
          lineStyle: {
            color: "#b8b9b9",
            width: 1,
            type: [0, 20],
          },
        },

        axisTick: {
          show: true,
          alignWithLabel: true,
          inside: true,
          length: 10,
          lineStyle: {
            color: "#b8b9b9",
            width: 2,
          },
        },

        axisLabel: {
          show: true,
          fontFamily: FONT_FAMILY,
          fontSize: 40,
          fontWeight: 500,
          color: "#808285",
          margin: 12,
        },

        splitLine: {
          show: false,
        },
      },

      series: [
        /*
         * -----------------------------------------------------
         * IMPORTS
         * -----------------------------------------------------
         */

        {
          name: "واردات",

          type: "bar",

          data: importValues,

          barWidth: 50,

          // IMPORTANT:
          // Make import and export occupy the same row
          barGap: "-100%",

          itemStyle: {
            color: IMPORT_COLOR,
          },

          label: {
            show: true,

            position: "insideLeft",

            color: "#fff",

            fontFamily: FONT_FAMILY,
            fontSize: 40,

            formatter: ({ value }: { value: number }) =>
              formatValue(Math.abs(Number(value))),
          },

          emphasis: {
            disabled: true,
          },

          z: 2,
        },
        /*
         * -----------------------------------------------------
         * EXPORTS
         * -----------------------------------------------------
         */

        {
          name: "صادرات",

          type: "bar",

          data: exportValues,

          barWidth: 50,

          // IMPORTANT:
          // Make import and export occupy the same row
          barGap: "-100%",

          itemStyle: {
            color: EXPORT_COLOR,
          },

          label: {
            show: true,

            position: "insideRight",

            color: "#fff",

            fontFamily: FONT_FAMILY,
            fontSize: 40,

            formatter: ({ value }: { value: number }) =>
              formatValue(Number(value)),
          },

          emphasis: {
            disabled: true,
          },

          z: 2,
        },
        /*
         * -----------------------------------------------------
         * TRADE BALANCE
         * -----------------------------------------------------
         *
         * IMPORTANT:
         * This now uses the SAME x-axis as the bars.
         *
         * Therefore:
         *
         * -1.2 -> left
         *  0   -> center
         * +0.3 -> right
         */

        {
          name: "تراز تجاری",

          type: "line",

          data: balanceValues,

          smooth: false,

          symbol: "circle",

          symbolSize: 20,

          lineStyle: {
            color: BALANCE_COLOR,
            width: 5.5,
          },

          itemStyle: {
            color: BALANCE_COLOR,
            borderColor: BALANCE_COLOR,
          },

          emphasis: {
            disabled: true,
          },

          z: 10,
        },
      ],
    }),
    [categories, importValues, exportValues, balanceValues, tradeAxisMax],
  );

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "380 / 230",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* =====================================================
          CHART
          ===================================================== */}

      <div
        style={{
          position: "relative",

          width: "100%",

          flex: "1 1 auto",
          minHeight: 0,

          overflow: "hidden",
        }}
      >
        <ReactECharts
          option={chartOption}
          style={{
            width: "100%",
            height: "100%",
          }}
          opts={{
            renderer: "svg",
          }}
          onChartReady={(instance) => {
            instance.getDom().setAttribute("data-echarts-instance", "true");
          }}
          notMerge
          lazyUpdate={false}
        />

        {/* ===================================================
            CENTER ZERO LINE - REMOVED
            =================================================== */}

        {/* The center zero line overlay has been removed since
            the y-axis labels now show on the left */}

        {/* ===================================================
            MONTH LABELS - REMOVED
            =================================================== */}

        {/* The custom month labels overlay has been removed since
            the y-axis now handles this */}
      </div>
    </div>
  );
}
