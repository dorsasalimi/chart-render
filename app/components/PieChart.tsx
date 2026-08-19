// components/PieChart.tsx
"use client";

import ReactECharts from "echarts-for-react";
import { CHART_COLORS } from "../lib/chartTheme";
import { getThemeColors, ThemeKey } from "../lib/colorThemes";

// Define PieChart type locally
interface PieChartDataItem {
  name: string;
  value: number;
  itemStyle?: {
    color?: string;
  };
}

interface PieChartType {
  title?: string;
  unit?: string;
  data?: PieChartDataItem[];
  categories?: string[];
  series?: Array<{ name?: string; data: number[] }>;
}

interface Props {
  chart: PieChartType;
  customColors?: string[] | Record<string, string>;
  theme?: ThemeKey;
}

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
};

// Helper function to normalize chart data
const normalizeChartData = (chart: PieChartType): PieChartDataItem[] => {
  // If data already exists in the expected format
  if (chart.data && chart.data.length > 0) {
    return chart.data;
  }

  // If using categories + series format
  if (chart.categories && chart.series && chart.series.length > 0) {
    const seriesData = chart.series[0].data;
    return chart.categories.map((name, index) => ({
      name,
      value: seriesData[index] || 0,
    }));
  }

  return [];
};

export default function PieChart({ chart, customColors, theme = "default" }: Props) {
  // Normalize the data
  const normalizedData = normalizeChartData(chart);

  // Guard against missing data
  if (!normalizedData || normalizedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // Determine colors
  let colors: string[];

  // For pie charts with customColors as an object (per-item mapping)
  if (customColors && typeof customColors === 'object' && !Array.isArray(customColors)) {
    const colorMap = customColors;
    const dataWithColors = normalizedData.map((item) => ({
      ...item,
      itemStyle: {
        color: colorMap[item.name] || undefined
      }
    }));

    const option = {
      color: getThemeColors(theme),
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const value = toPersianDigits(params.value);
          const percent = toPersianDigits(params.percent);
          return `
            <div style="font-family: inherit; direction: rtl;">
              <strong>${params.name}</strong>
              <br />
              ${value} ${chart.unit ?? ""}
              <br />
              سهم: ${percent}٪
            </div>
          `;
        },
      },
      legend: {
        orient: "horizontal",
        left: "center",
        top: "bottom",
        bottom: 0,
        itemWidth: 14,
        itemHeight: 14,
        itemGap: 60,
        textStyle: {
          fontFamily: "inherit",
          fontSize: 12,
          fontWeight: 400,
        },
        padding: [8, 16, 16, 16],
        type: "scroll",
        icon: "circle",
        align: "left",
        itemStyle: {
          borderWidth: 0,
        },
      },
      series: [
        {
          name: chart.title,
          type: "pie",
          radius: ["40%", "72%"],
          center: ["50%", "42%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: "#ffffff",
            borderWidth: 3,
          },
          label: {
            show: true,
            formatter: (params: any) => {
              return `${params.name}\n\n٪${toPersianDigits(params.percent)}`;
            },
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "inherit",
            color: "#333",
            position: "outside",
            distanceToLabelLine: 2,
            lineHeight: 10,
          },
          labelLine: {
            show: true,
            length: 12,
            length2: 10,
            smooth: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: "bold",
              fontFamily: "inherit",
              formatter: (params: any) => {
                const value = toPersianDigits(params.value);
                return `${params.name}\n\n${value} ${chart.unit ?? ""}\n\n٪${toPersianDigits(params.percent)}`;
              },
            },
            itemStyle: {
              shadowBlur: 8,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
          data: dataWithColors,
        },
      ],
      grid: {
        containLabel: true,
      },
    };

    return (
      <div
        data-echarts-container
        style={{
          width: "100%",
          height: "100%",
          minHeight: "460px",
        }}
      >
        <ReactECharts
          option={option}
          style={{
            width: "100%",
            height: "600px",
            minHeight: "460px",
          }}
          opts={{
            renderer: "svg",
          }}
        />
      </div>
    );
  }

  // For pie charts with array colors or theme
  if (Array.isArray(customColors) && customColors.length > 0) {
    colors = customColors;
  } else if (theme) {
    colors = getThemeColors(theme);
  } else {
    colors = CHART_COLORS;
  }

  const option = {
    color: colors,
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const value = toPersianDigits(params.value);
        const percent = toPersianDigits(params.percent);
        return `
          <div style="font-family: inherit; direction: rtl;">
            <strong>${params.name}</strong>
            <br />
            ${value} ${chart.unit ?? ""}
            <br />
            سهم: ${percent}٪
          </div>
        `;
      },
    },
    legend: {
      orient: "horizontal",
      left: "center",
      top: "bottom",
      bottom: 0,
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 60,
      textStyle: {
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 400,
        width: "auto",
      },
      padding: [8, 16, 16, 16],
      type: "scroll",
      icon: "circle",
      align: "left",
      itemStyle: {
        borderWidth: 0,
      },
    },
    series: [
      {
        name: chart.title,
        type: "pie",
        radius: ["40%", "72%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#ffffff",
          borderWidth: 3,
        },
        label: {
          show: true,
          formatter: (params: any) => {
            return `${params.name}\n\n٪${toPersianDigits(params.percent)}`;
          },
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "inherit",
          color: "#333",
          position: "outside",
          distanceToLabelLine: 2,
          lineHeight: 10,
        },
        labelLine: {
          show: true,
          length: 12,
          length2: 10,
          smooth: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
            fontFamily: "inherit",
            formatter: (params: any) => {
              const value = toPersianDigits(params.value);
              return `${params.name}\n\n${value} ${chart.unit ?? ""}\n\n${toPersianDigits(params.percent)}٪`;
            },
          },
          itemStyle: {
            shadowBlur: 8,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
        data: normalizedData,
      },
    ],
    grid: {
      containLabel: true,
    },
  };

  return (
    <div
      data-echarts-container
      style={{
        width: "100%",
        height: "100%",
        minHeight: "460px",
      }}
    >
      <ReactECharts
        option={option}
        style={{
          width: "100%",
          height: "820px",
          minHeight: "460px",
        }}
        opts={{
          renderer: "svg",
        }}
      />
    </div>
  );
}