// components/TreemapChart.tsx
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

export default function TreemapChart({ chart, customColors, theme = "default" }: Props) {
  // Guard against missing data
  if (!chart.data || chart.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // Determine colors
  let colors: string[];
  
  if (Array.isArray(customColors) && customColors.length > 0) {
    colors = customColors;
  } else if (theme) {
    colors = getThemeColors(theme);
  } else {
    colors = CHART_COLORS;
  }

  // Process data for treemap - handle both flat and nested data
  const processedData = chart.data.map((item, index) => {
    // Check if item has children (nested treemap)
    if (item.children && item.children.length > 0) {
      return {
        name: item.name,
        children: item.children.map((child, childIndex) => ({
          name: child.name,
          value: child.value || 0,
          itemStyle: {
            color: colors[(index + childIndex) % colors.length],
          },
        })),
      };
    }
    
    // Flat treemap
    return {
      name: item.name,
      value: item.value || 0,
      itemStyle: {
        color: colors[index % colors.length],
      },
    };
  });

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params && params.data) {
          const value = params.data.value || 0;
          return `<strong>${params.data.name}</strong><br/>
                   مقدار: ${toPersianDigits(value)} ${chart.unit || ''}`;
        }
        return '';
      },
    },
    series: [{
      type: 'treemap',
      data: processedData,
      label: {
        show: true,
        formatter: (params: any) => {
          if (params && params.data) {
            const value = params.data.value || 0;
            return `${params.data.name}\n${toPersianDigits(value)}`;
          }
          return '';
        },
        fontSize: 12,
        color: '#fff',
        textShadowBlur: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textStyle: {
          fontFamily: "inherit",
        },
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2,
        shadowBlur: 4,
        shadowColor: 'rgba(0,0,0,0.2)',
      },
      levels: [
        {
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
          },
        },
        {
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
          },
        },
      ],
      nodeClick: true,
      roam: true,
      // Add these for better rendering
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      squareRatio: 0.75,
      leafDepth: 1,
    }],
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
          height: "100%",
          minHeight: "420px",
        }}
        opts={{
          renderer: "svg",
        }}
      />
    </div>
  );
}