"use client";

import ReactECharts from "echarts-for-react";
import type { TreemapChart as TreemapChartType } from "../types/charts";
import { CHART_COLORS } from "../lib/chartTheme";
import { getThemeColors, ThemeKey } from "../lib/colorThemes";

interface Props {
  chart: TreemapChartType;
  customColors?: string[] | Record<string, string>;
  theme?: ThemeKey;
}

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
};

const formatNumber = (value: number) => {
  return toPersianDigits(
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value),
  );
};

const adjustColor = (hex: string, amount: number) => {
  // Safety fallback
  if (!hex || typeof hex !== "string") {
    return "#688EC9";
  }

  const cleanHex = hex.replace("#", "");

  // Only process normal 6-character hex colors
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return hex;
  }

  const num = parseInt(cleanHex, 16);

  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));

  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));

  const b = Math.max(0, Math.min(255, (num & 255) + amount));

  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
};

export default function TreemapChart({
  chart,
  customColors,
  theme = "default",
}: Props) {
  if (!chart.data || chart.data.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg bg-[#F7F9F8]">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // --------------------------------------------------
  // SAFE COLOR RESOLUTION
  // --------------------------------------------------

  let colors: string[] = [];

  if (Array.isArray(customColors) && customColors.length > 0) {
    colors = customColors.filter(
      (color): color is string => typeof color === "string" && color.length > 0,
    );
  }

  if (colors.length === 0 && theme) {
    const themeColors = getThemeColors(theme);

    if (Array.isArray(themeColors) && themeColors.length > 0) {
      colors = themeColors.filter(
        (color): color is string =>
          typeof color === "string" && color.length > 0,
      );
    }
  }

  // Final fallback
  if (colors.length === 0) {
    colors =
      Array.isArray(CHART_COLORS) && CHART_COLORS.length > 0
        ? CHART_COLORS
        : ["#1C439C", "#688EC9", "#B4C4DA", "#EF4136", "#EE7D7D", "#52B787"];
  }

  // --------------------------------------------------
  // CHECK DATA TYPE
  // --------------------------------------------------

  const hasNestedData = chart.data.some((item: any) => {
    return Array.isArray(item.children) && item.children.length > 0;
  });

  // --------------------------------------------------
  // PROCESS DATA
  // --------------------------------------------------

  const processedData = chart.data.map((item: any, index: number) => {
    const parentColor = colors[index % colors.length] || "#688EC9";

    // DETAILED TREEMAP
    if (Array.isArray(item.children) && item.children.length > 0) {
      const childrenCount = item.children.length;

      return {
        name: item.name,

        // Do NOT manually set parent value.
        // ECharts calculates it from children.
        itemStyle: {
          color: parentColor,
        },

        children: item.children.map((child: any, childIndex: number) => {
          const variation =
            childrenCount === 1
              ? 0
              : -30 + (childIndex / Math.max(childrenCount - 1, 1)) * 60;

          return {
            name: child.name,
            value: Number(child.value) || 0,

            itemStyle: {
              color: adjustColor(parentColor, Math.round(variation)),
            },
          };
        }),
      };
    }

    // SIMPLE TREEMAP
    return {
      name: item.name,
      value: Number(item.value) || 0,

      itemStyle: {
        color: parentColor,
      },
    };
  });

  // --------------------------------------------------
  // ECHARTS OPTION
  // --------------------------------------------------

  const option = {
    animation: false,

    tooltip: {
      trigger: "item",

      formatter: (params: any) => {
        if (!params?.data) return "";

        const value = Number(params.data.value) || 0;

        return `
          <div style="direction: rtl; text-align: right;">
            <strong>${params.data.name || ""}</strong>
            <br />
            مقدار: ${formatNumber(value)} ${chart.unit || ""}
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

        top: 4,
        right: 4,
        bottom: 4,
        left: 4,

        // Disable interaction/drill-down
        nodeClick: false,
        roam: false,

        breadcrumb: {
          show: false,
        },

        squareRatio: 1.1,

        visibleMin: 1,

        itemStyle: {
          borderColor: "#FFFFFF",
          borderWidth: 2,
          gapWidth: 2,
        },

        // -------------------------------
        // SIMPLE TREEMAP LABELS
        // -------------------------------

        label: {
          show: !hasNestedData,

          position: "inside",

          formatter: (params: any) => {
            const name = params?.data?.name || "";
            const value = Number(params?.data?.value) || 0;

            return `${name}\n{value|${formatNumber(value)}}`;
          },

          rich: {
            name: {
              fontSize: 17,
              fontFamily: "inherit",
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
            fontFamily: "inherit",
          },
        },

        // -------------------------------
        // HIERARCHY LEVELS
        // -------------------------------

        levels: [
          // LEVEL 0 = ROOT
          {
            itemStyle: {
              borderColor: "#FFFFFF",
              borderWidth: 0,
              gapWidth: 0,
              
            },
          },

          // LEVEL 1 = MAIN INDUSTRIES
          {
            itemStyle: {
              borderColor: "#FFFFFF",
              borderWidth: 1,
              gapWidth: 0,
              
            },

            upperLabel: {
              show: hasNestedData,
              height: 35,

              color: "#1F2937",
              fontSize: 15,
              fontWeight: 400,
              fontFamily: "inherit",

              padding: [6, 8],
            },
          },

          // LEVEL 2 = CHAPTERS / DETAILS
          {
            itemStyle: {
              borderColor: "rgba(255,255,255,0.9)",
              borderWidth: 1,
              gapWidth: 0,
            },

            label: {
              show: true,

              position: "inside",

              formatter: (params: any) => {
                const name = params?.data?.name || "";
                const value = Number(params?.data?.value) || 0;

                return `{name|${name}}\n{value|${formatNumber(value)}}`;
              },

              rich: {
                name: {
                  fontSize: 17,
                  fontWeight: 400,
                  color: "#FFFFFF",
                  lineHeight: 16,
                  fontFamily: "inherit",
                },

                value: {
                  fontSize: 0,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 14,
                },
              },

              textStyle: {
                fontFamily: "inherit",
              },
            },
          },
        ],
      },
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
          height: "850px",
          minHeight: "420px",
        }}
        opts={{
          renderer: "svg",
        }}
        notMerge
        lazyUpdate={false}
      />
    </div>
  );
}
