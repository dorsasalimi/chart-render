"use client";

import ReactECharts from "echarts-for-react";
import type { TreemapChart as TreemapChartType } from "../types/charts";
import { CHART_COLORS_RANKED } from "../lib/colorThemes";

interface Props {
  chart: TreemapChartType;
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

// Helper to get color by rank for parent items
const getColorByRank = (value: number, allValues: number[]): string => {
  if (!allValues || allValues.length === 0) return CHART_COLORS_RANKED[0];
  
  // Get unique values sorted descending
  const uniqueValues = [...new Set(allValues)].sort((a, b) => b - a);
  
  // Find the rank of this value (0 = largest)
  const rank = uniqueValues.indexOf(value);
  if (rank === -1) return CHART_COLORS_RANKED[0];
  
  // Map rank to color index
  const colorIndex = Math.min(rank, CHART_COLORS_RANKED.length - 1);
  return CHART_COLORS_RANKED[colorIndex];
};

export default function TreemapChart({ chart }: Props) {
  if (!chart.data || chart.data.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg bg-[#F7F9F8]">
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
  // GET PARENT VALUES FOR RANKING
  // --------------------------------------------------
  
  // For nested data, get parent values (sum of children or direct parent value)
  const getParentValue = (item: any): number => {
    if (Array.isArray(item.children) && item.children.length > 0) {
      // Sum of children values
      return item.children.reduce((sum: number, child: any) => sum + (Number(child.value) || 0), 0);
    }
    return Number(item.value) || 0;
  };

  // Get all parent values for ranking
  const parentValues = chart.data.map((item: any) => getParentValue(item));

  // --------------------------------------------------
  // PROCESS DATA
  // --------------------------------------------------

  const processedData = chart.data.map((item: any, index: number) => {
    const parentValue = parentValues[index];
    // Get color based on parent's rank
    const parentColor = getColorByRank(parentValue, parentValues);

    // DETAILED TREEMAP
    if (Array.isArray(item.children) && item.children.length > 0) {
      return {
        name: item.name,
        itemStyle: {
          color: parentColor,
        },
        children: item.children.map((child: any) => {
          return {
            name: child.name,
            value: Number(child.value) || 0,
            itemStyle: {
              color: parentColor, // Same color as parent, NO variation
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

        // SIMPLE TREEMAP LABELS - show names on items
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

        // HIERARCHY LEVELS
        levels: [
          // LEVEL 0 = ROOT
          {
            itemStyle: {
              borderColor: "#FFFFFF",
              borderWidth: 0,
              gapWidth: 0,
            },
          },
          // LEVEL 1 = MAIN INDUSTRIES - hide parent labels
          {
            itemStyle: {
              borderColor: "#FFFFFF",
              borderWidth: 1,
              gapWidth: 0,
            },
            upperLabel: {
              show: false, // Hide parent section names
            },
            label: {
              show: false, // Also hide any labels on parent items
            },
          },
          // LEVEL 2 = CHAPTERS / DETAILS - show labels only on children
          {
            itemStyle: {
              borderColor: "rgba(255,255,255,0.9)",
              borderWidth: 1,
              gapWidth: 0,
            },
            label: {
              show: true, // Show labels on children
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