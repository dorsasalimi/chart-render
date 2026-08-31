"use client";

import { useMemo } from "react";
import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
  EChartsOption,
} from "echarts";
import ReactECharts from "echarts-for-react";

interface PercentageWaffleChartProps {
  value: number;
  precision?: number;
  activeColor?: string;
  inactiveColor?: string;
}

const CELL_COUNT = 100;
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const PERSIAN_DECIMAL_SEPARATOR = "٫";
const PERSIAN_PERCENT_SIGN = "٪";

const LINE_CHART_RED = "#a84b41";
const LINE_CHART_GRID = "#b8b9b9";
const LINE_CHART_TEXT = "#808285";
const LINE_CHART_FONT = "Epsilon";

function formatPersianPercentage(value: number, precision: number): string {
  return value
    .toFixed(Math.max(0, precision))
    .replace(".", PERSIAN_DECIMAL_SEPARATOR)
    .replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export default function PercentageWaffleChart({
  value,
  precision = 1,
  activeColor = LINE_CHART_RED,
  inactiveColor = LINE_CHART_GRID,
}: PercentageWaffleChartProps) {
  const percentage = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const filledCells = Math.round(percentage);
  const formattedPercentage = formatPersianPercentage(percentage, precision);
  const percentageLabel = `${PERSIAN_PERCENT_SIGN}${formattedPercentage}`;

  const option = useMemo<EChartsOption>(
    () => ({
      animation: false,
      aria: {
        enabled: true,
        description: percentageLabel,
      },
      grid: {
        left: "19%",
        width: "42%",
        top: "15%",
        height: "70%",
      },
      graphic: [
        {
          type: "text",
          left: "66%",
          top: "68%",
          silent: true,
          style: {
            fill: LINE_CHART_TEXT,
            font: `500 40px ${LINE_CHART_FONT}`,
            text: percentageLabel,
            textAlign: "left",
            textVerticalAlign: "middle",
          },
        },
      ],
      xAxis: {
        type: "value",
        min: -0.5,
        max: 9.5,
        show: false,
      },
      yAxis: {
        type: "value",
        min: -0.5,
        max: 9.5,
        show: false,
      },
      series: [
        {
          type: "custom",
          coordinateSystem: "cartesian2d",
          silent: true,
          data: Array.from({ length: CELL_COUNT }, (_, index) => [
            index % 10,
            Math.floor(index / 10),
            index < filledCells ? 1 : 0,
          ]),
          renderItem: (
            params: CustomSeriesRenderItemParams,
            api: CustomSeriesRenderItemAPI,
          ) => {
            const point = api.coord([api.value(0), api.value(1)]);
            const measuredSize = api.size?.([1, 1]) ?? 0;
            const cellSize = Array.isArray(measuredSize)
              ? measuredSize
              : [measuredSize, measuredSize];
            const width = Math.abs(cellSize[0]) * 0.86;
            const height = Math.abs(cellSize[1]) * 0.86;

            return {
              type: "rect",
              shape: {
                x: point[0] - width / 2,
                y: point[1] - height / 2,
                width,
                height,
                r: 3,
              },
              style: {
                fill: api.value(2) ? activeColor : inactiveColor,
              },
            };
          },
        },
      ],
    }),
    [activeColor, filledCells, inactiveColor, percentageLabel],
  );

  return (
    <div
      aria-label={percentageLabel}
      data-chart-type="waffle"
      role="img"
      style={{ aspectRatio: "380 / 230", minHeight: 0, width: "100%" }}
    >
      <ReactECharts
        option={option}
        opts={{ renderer: "svg" }}
        style={{ height: "100%", width: "100%" }}
        onChartReady={(instance) => {
          instance.getDom().setAttribute("data-echarts-instance", "true");
        }}
        notMerge
        lazyUpdate={false}
      />
    </div>
  );
}
