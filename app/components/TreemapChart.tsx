"use client";

import ReactECharts from "echarts-for-react";
import type { TreemapChart as TreemapChartType } from "../types/charts";
import { CHART_COLORS_RANKED } from "../lib/colorThemes";

const TREEMAP_WIDTH = 500;
const TREEMAP_HEIGHT = 500;

// Treemap datasets currently contain 12 parent categories. Keep the shared
// ranked palette intact and add treemap-only colors for categories beyond it.
const TREEMAP_COLORS = [...CHART_COLORS_RANKED, "#694101", "#4e7f80"];

interface Props {
  chart: TreemapChartType;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

const formatNumber = (value: number) => {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

  return toPersianDigits(formatted);
};

// --------------------------------------------------
// GET COLOR BY RANK
// --------------------------------------------------

const getColorByRank = (
  value: number,
  itemIndex: number,
  allValues: number[],
): string => {
  if (!allValues || allValues.length === 0) {
    return TREEMAP_COLORS[0];
  }

  const rank = allValues
    .map((rankValue, index) => ({ rankValue, index }))
    .sort((a, b) => b.rankValue - a.rankValue || a.index - b.index)
    .findIndex((item) => item.index === itemIndex && item.rankValue === value);

  if (rank === -1) {
    return TREEMAP_COLORS[0];
  }

  if (rank < TREEMAP_COLORS.length) {
    return TREEMAP_COLORS[rank];
  }

  // Golden-angle spacing keeps any future extra categories visually distinct.
  const hue = Math.round((rank * 137.508) % 360);
  return `hsl(${hue} 52% 44%)`;
};

export default function TreemapChart({ chart }: Props) {
  // --------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------

  if (!chart.data || chart.data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-[#F7F9F8]"
        style={{
          width: `${TREEMAP_WIDTH}px`,
          height: `${TREEMAP_HEIGHT}px`,
        }}
      >
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // --------------------------------------------------
  // CHECK DATA TYPE
  // --------------------------------------------------

  const hasNestedData = chart.data.some((item: any) => {
    return Array.isArray(item.children) && item.children.length > 0;
  });

  // --------------------------------------------------
  // GET PARENT VALUES
  // --------------------------------------------------

  const getParentValue = (item: any): number => {
    if (Array.isArray(item.children) && item.children.length > 0) {
      return item.children.reduce(
        (sum: number, child: any) => sum + (Number(child.value) || 0),
        0,
      );
    }

    return Number(item.value) || 0;
  };

  const parentValues = chart.data.map((item: any) => getParentValue(item));

  // --------------------------------------------------
  // PROCESS DATA
  // --------------------------------------------------

  const processedData = chart.data.map((item: any, index: number) => {
    const parentValue = parentValues[index];

    const parentColor = getColorByRank(parentValue, index, parentValues);

    // -------------------------------
    // NESTED TREEMAP
    // -------------------------------

    if (Array.isArray(item.children) && item.children.length > 0) {
      return {
        name: item.name,

        itemStyle: {
          color: parentColor,
        },

        children: item.children.map((child: any) => ({
          name: child.name,
          value: Number(child.value) || 0,

          itemStyle: {
            color: parentColor,
          },
        })),
      };
    }

    // -------------------------------
    // SIMPLE TREEMAP
    // -------------------------------

    return {
      name: item.name,
      value: Number(item.value) || 0,

      itemStyle: {
        color: parentColor,
      },
    };
  });

  const legendData = processedData
    .map((item, index) => ({
      item,
      value: parentValues[index],
      originalIndex: index,
    }))
    .sort((a, b) => b.value - a.value || a.originalIndex - b.originalIndex);

  // --------------------------------------------------
  // ECHARTS OPTION
  // --------------------------------------------------

  const option = {
    animation: false,

    tooltip: {
      trigger: "item",

      backgroundColor: "rgba(255,255,255,0.98)",
      borderColor: "#E5E7EB",
      borderWidth: 0,
      padding: [0, 0],

      textStyle: {
        fontFamily: "Epsilon",
        color: "#111827",
        fontSize: "15px",
      },

      extraCssText: `
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      `,

      formatter: (params: any) => {
        if (!params?.data) return "";

        const value = Number(params.data.value) || 0;

        // Convert ANY digits inside the name to Persian digits
        const name = toPersianDigits(params.data.name || "");

        // Convert unit too, in case it contains numbers
        const unit = toPersianDigits(chart.unit || "");

        return `
          <div
            style="
              direction:rtl;
              text-align:right;
              font-family:Epsilon;
            "
          >
            <strong>${name}</strong>
            <br />
            مقدار: ${formatNumber(value)}
            ${unit}
          </div>
        `;
      },
    },

    series: [
      {
        type: "treemap",

        data: processedData,

        width: "100%",
        height: "100%",

        top: 0,
        right: 0,
        bottom: 0,
        left: 0,

        nodeClick: false,
        roam: false,

        breadcrumb: {
          show: false,
        },

        squareRatio: 1.1,

        visibleMin: 1,

        itemStyle: {
          borderColor: "transparent",
          borderWidth: 0,
          gapWidth: 4,
        },

        // --------------------------------------------------
        // SIMPLE TREEMAP LABELS
        // --------------------------------------------------

        label: {
          show: !hasNestedData,

          position: "insideTopLeft",
          align: "left",
          verticalAlign: "top",
          padding: 2,

          formatter: (params: any) => {
            const name = toPersianDigits(params?.data?.name || "");

            const value = Number(params?.data?.value) || 0;

            return `{name|${name}}\n{value|${formatNumber(value)}}`;
          },

          rich: {
            name: {
              fontSize: "15px",
              fontFamily: "Epsilon",
              fontWeight: 400,
              color: "#FFFFFF",
              lineHeight: 18,
            },

            value: {
              fontSize: 0,
              color: "rgba(255,255,255,0.9)",
              lineHeight: 16,
            },
          },

          textStyle: {
            fontFamily: "Epsilon",
          },
        },

        // --------------------------------------------------
        // HIERARCHY LEVELS
        // --------------------------------------------------

        levels: [
          // LEVEL 0
          {
            itemStyle: {
              borderColor: "transparent",
              borderWidth: 0,
              gapWidth: 1,
            },
          },

          // LEVEL 1
          {
            itemStyle: {
              borderColor: "transparent",
              borderWidth: 0,
              gapWidth: 1,
            },

            upperLabel: {
              show: false,
            },

            label: {
              show: false,
            },
          },

          // LEVEL 2
          {
            itemStyle: {
              borderColor: "transparent",
              borderWidth: 0,
              gapWidth: 1,
            },

            label: {
              show: true,

              position: "insideTopLeft",
              align: "left",
              verticalAlign: "top",
              padding: [2, 6],

              formatter: (params: any) => {
                const name = toPersianDigits(params?.data?.name || "");

                const value = Number(params?.data?.value) || 0;

                return `{name|${name}}\n{value|${formatNumber(value)}}`;
              },

              rich: {
                name: {
                  fontSize: 15,
                  fontWeight: 400,
                  color: "#FFFFFF",
                  lineHeight: 16,
                  fontFamily: "Epsilon",
                },

                value: {
                  fontSize: 0,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 14,
                },
              },

              textStyle: {
                fontFamily: "Epsilon",
              },
            },
          },
        ],
      },
    ],
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div style={{ width: `${TREEMAP_WIDTH}px` }}>
      <div
        data-echarts-container
        data-chart-export-width={TREEMAP_WIDTH}
        data-chart-export-height={TREEMAP_HEIGHT}
        data-chart-export-transparent="true"
        style={{
          width: `${TREEMAP_WIDTH}px`,
          height: `${TREEMAP_HEIGHT}px`,
          position: "relative",
        }}
      >
        <ReactECharts
          option={option}
          notMerge
          lazyUpdate={false}
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

      <div
        data-chart-screen-only="true"
        dir="rtl"
        aria-label="راهنمای رنگ‌های نمودار"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          gap: "20px 16px",
          marginTop: "16px",
        }}
      >
        {legendData.map(({ item, originalIndex }) => (
          <span
            key={`${item.name}-${originalIndex}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              maxWidth: "100%",
              color: "#4B5563",
              fontFamily: "Epsilon",
              fontSize: "25px",
              lineHeight: 1.5,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "50px",
                height: "50px",
                flex: "0 0 10px",
                borderRadius: "2px",
                backgroundColor: item.itemStyle.color,
              }}
            />
            <span>{toPersianDigits(item.name || "")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
