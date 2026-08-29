"use client";

import ReactECharts from "echarts-for-react";
import type { TreemapChart as TreemapChartType } from "../types/charts";
import { CHART_COLORS_RANKED } from "../lib/colorThemes";

interface Props {
  chart: TreemapChartType;
  height?: number;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toPersianDigits = (value: string | number) => {
  return String(value).replace(
    /\d/g,
    (digit) => PERSIAN_DIGITS[Number(digit)]
  );
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
  allValues: number[]
): string => {
  if (!allValues || allValues.length === 0) {
    return CHART_COLORS_RANKED[0];
  }

  const uniqueValues = [...new Set(allValues)].sort(
    (a, b) => b - a
  );

  const rank = uniqueValues.indexOf(value);

  if (rank === -1) {
    return CHART_COLORS_RANKED[0];
  }

  const colorIndex = Math.min(
    rank,
    CHART_COLORS_RANKED.length - 1
  );

  return CHART_COLORS_RANKED[colorIndex];
};

export default function TreemapChart({
  chart,
  height = 310,
}: Props) {
  // --------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------

  if (!chart.data || chart.data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-[#F7F9F8]"
        style={{
          width: "100%",
          aspectRatio: "510 / 310",
          minHeight: `${height}px`,
        }}
      >
        <p className="text-sm text-[#6B7A73]">
          No data available
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // CHECK DATA TYPE
  // --------------------------------------------------

  const hasNestedData = chart.data.some((item: any) => {
    return (
      Array.isArray(item.children) &&
      item.children.length > 0
    );
  });

  // --------------------------------------------------
  // GET PARENT VALUES
  // --------------------------------------------------

  const getParentValue = (item: any): number => {
    if (
      Array.isArray(item.children) &&
      item.children.length > 0
    ) {
      return item.children.reduce(
        (sum: number, child: any) =>
          sum + (Number(child.value) || 0),
        0
      );
    }

    return Number(item.value) || 0;
  };

  const parentValues = chart.data.map(
    (item: any) => getParentValue(item)
  );

  // --------------------------------------------------
  // PROCESS DATA
  // --------------------------------------------------

  const processedData = chart.data.map(
    (item: any, index: number) => {
      const parentValue = parentValues[index];

      const parentColor = getColorByRank(
        parentValue,
        parentValues
      );

      // -------------------------------
      // NESTED TREEMAP
      // -------------------------------

      if (
        Array.isArray(item.children) &&
        item.children.length > 0
      ) {
        return {
          name: item.name,

          itemStyle: {
            color: parentColor,
          },

          children: item.children.map(
            (child: any) => ({
              name: child.name,
              value: Number(child.value) || 0,

              itemStyle: {
                color: parentColor,
              },
            })
          ),
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
    }
  );

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
      padding: [12, 14],

      textStyle: {
        fontFamily: "Epsilon",
        color: "#111827",
          fontSize: "40px",
      },

      extraCssText: `
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      `,

      formatter: (params: any) => {
        if (!params?.data) return "";

        const value = Number(params.data.value) || 0;

        // Convert ANY digits inside the name to Persian digits
        const name = toPersianDigits(
          params.data.name || ""
        );

        // Convert unit too, in case it contains numbers
        const unit = toPersianDigits(
          chart.unit || ""
        );

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
          borderColor: "#FFFFFF",
          borderWidth: 2,
          gapWidth: 2,
        },

        // --------------------------------------------------
        // SIMPLE TREEMAP LABELS
        // --------------------------------------------------

        label: {
          show: !hasNestedData,

          position: "inside",

          formatter: (params: any) => {
            const name = toPersianDigits(
              params?.data?.name || ""
            );

            const value =
              Number(params?.data?.value) || 0;

            return `{name|${name}}\n{value|${formatNumber(
              value
            )}}`;
          },

          rich: {
            name: {
          fontSize: "40px",
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
              borderColor: "#FFFFFF",
              borderWidth: 2,
              gapWidth: 0,
            },
          },

          // LEVEL 1
          {
            itemStyle: {
              borderColor: "#FFFFFF",
              borderWidth: 0,
              gapWidth: 0,
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
              borderColor: "rgba(255,255,255,0.9)",
              borderWidth: 2,
              gapWidth: 0,
            },

            label: {
              show: true,

              position: "inside",

              formatter: (params: any) => {
                const name = toPersianDigits(
                  params?.data?.name || ""
                );

                const value =
                  Number(params?.data?.value) || 0;

                return `{name|${name}}\n{value|${formatNumber(
                  value
                )}}`;
              },

              rich: {
                name: {
                  fontSize: 40,
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
    <div
      data-echarts-container
      style={{
        width: "100%",
        aspectRatio: "510 / 310",
        minHeight: `${height}px`,
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

          dom.setAttribute(
            "data-echarts-instance",
            "true"
          );
        }}
      />
    </div>
  );
}