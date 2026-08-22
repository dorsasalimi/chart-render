"use client";

import ReactECharts from "echarts-for-react";
import { CHART_COLORS } from "../lib/chartTheme";
import { getThemeColors, ThemeKey } from "../lib/colorThemes";

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

const toPersianLabel = (text: string) => {
  return text.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
};

const normalizeChartData = (chart: PieChartType): PieChartDataItem[] => {
  if (chart.data && chart.data.length > 0) {
    return chart.data;
  }

  if (chart.categories && chart.series && chart.series.length > 0) {
    const seriesData = chart.series[0].data;
    return chart.categories.map((name, index) => ({
      name: toPersianLabel(name),
      value: seriesData[index] || 0,
    }));
  }

  return [];
};

export default function PieChart({ chart, customColors, theme = "default" }: Props) {
  const normalizedData = normalizeChartData(chart);

  if (!normalizedData || normalizedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // Calculate dynamic values based on data length
  const dataLength = normalizedData.length;
  const legendItemGap = dataLength <= 4 ? 60 : dataLength <= 6 ? 40 : 25;
  const legendFontSize = dataLength <= 4 ? 15 : dataLength <= 6 ? 14 : 13;
  const containerMinHeight = dataLength <= 4 ? 460 : 460 + Math.min((dataLength - 4) * 20, 80);
  const pieRadius = dataLength <= 4 ? ["40%", "72%"] : dataLength <= 6 ? ["38%", "68%"] : ["35%", "62%"];
  const pieCenter = dataLength <= 4 ? ["50%", "42%"] : ["50%", "40%"];

  // Determine colors
  let colors: string[];
  
  if (customColors && typeof customColors === 'object' && !Array.isArray(customColors)) {
    const colorMap = customColors;
    const dataWithColors = normalizedData.map((item) => ({
      ...item,
      name: toPersianLabel(item.name),
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
          const name = toPersianLabel(params.name);
          return `
            <div style="font-family: inherit; direction: rtl;">
              <strong>${name}</strong>
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
        bottom: 20,
        itemWidth: 14,
        itemHeight: 14,
        itemGap: legendItemGap,
        textStyle: {
          fontFamily: "inherit",
          fontSize: 15,
          fontWeight: 400,
        },
        padding: [8, 5, 5, 5],
        type: "scroll",
        icon: "circle",
        align: "left",
        itemStyle: {
          borderWidth: 0,
        },
        formatter: (name: string) => {
          return toPersianLabel(name);
        },
      },
      series: [
        {
          name: chart.title ? toPersianLabel(chart.title) : undefined,
          type: "pie",
          radius: pieRadius,
          center: pieCenter,
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: "#ffffff",
            borderWidth: 1,
          },
          label: {
            show: true,
            formatter: (params: any) => {
              return `${toPersianLabel(params.name)}\n\n٪${toPersianDigits(params.percent)}`;
            },
            fontSize: 15,
            fontWeight: 400,
            fontFamily: "inherit",
            color: "#333",
            position: "outside",
            distanceToLabelLine: 2,
            lineHeight: 10,
          },
          labelLine: {
            show: true,
            length: dataLength <= 4 ? 20 : 15,
            length2: dataLength <= 4 ? 18 : 12,
            smooth: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 15,
              fontWeight: "bold",
              fontFamily: "inherit",
              formatter: (params: any) => {
                const value = toPersianDigits(params.value);
                return `${toPersianLabel(params.name)}\n\n${value} ${chart.unit ?? ""}\n\n٪${toPersianDigits(params.percent)}`;
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
        bottom: dataLength > 5 ? 80 : 60,
      },
    };

    return (
      <div
        data-echarts-container
        style={{
          width: "100%",
          height: "100%",
          minHeight: `${containerMinHeight}px`,
        }}
      >
        <ReactECharts
          option={option}
          style={{
            width: "100%",
          height: "850px",
            minHeight: `${containerMinHeight}px`,
          }}
          opts={{
            renderer: "svg",
          }}
        />
      </div>
    );
  }

  // Handle array colors or theme
  if (Array.isArray(customColors) && customColors.length > 0) {
    colors = customColors;
  } else if (theme) {
    colors = getThemeColors(theme);
  } else {
    colors = CHART_COLORS;
  }

  const dataWithPersianLabels = normalizedData.map((item) => ({
    ...item,
    name: toPersianLabel(item.name),
  }));

  const option = {
    color: colors,
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const value = toPersianDigits(params.value);
        const percent = toPersianDigits(params.percent);
        const name = toPersianLabel(params.name);
        return `
          <div style="font-family: inherit; direction: rtl;">
            <strong>${name}</strong>
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
      itemWidth: 20,
      itemHeight: 14,
      itemGap: legendItemGap,
      textStyle: {
        fontFamily: "inherit",
        fontSize: 15,
        fontWeight: 400,
      },
      type: "scroll",
      icon: "circle",
      align: "left",
      itemStyle: {
        borderWidth: 0,
      },
      formatter: (name: string) => {
        return toPersianLabel(name);
      },
    },
    series: [
      {
        name: chart.title ? toPersianLabel(chart.title) : undefined,
        type: "pie",
        radius: pieRadius,
        center: pieCenter,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#ffffff",
          borderWidth: 1,
        },
        label: {
          show: true,
          formatter: (params: any) => {
            return `${toPersianLabel(params.name)}\n\n٪${toPersianDigits(params.percent)}`;
          },
          fontSize: 15,
          fontWeight: 400,
          fontFamily: "inherit",
          color: "#333",
          position: "outside",
          distanceToLabelLine: 5,
          lineHeight: 10,
        },
        labelLine: {
          show: true,
          length: dataLength <= 4 ? 50 : 35,
          length2: dataLength <= 4 ? 40 : 25,
          smooth: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 15,
            fontWeight: "bold",
            fontFamily: "inherit",
            formatter: (params: any) => {
              const value = toPersianDigits(params.value);
              return `${toPersianLabel(params.name)}\n\n${value} ${chart.unit ?? ""}\n\n${toPersianDigits(params.percent)}٪`;
            },
          },
          itemStyle: {
            shadowBlur: 8,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
        data: dataWithPersianLabels,
      },
    ],
    grid: {
      containLabel: true,
      bottom: dataLength > 5 ? 80 : 60,
    },
  };

  return (
    <div
      data-echarts-container
      style={{
        width: "100%",
        height: "100%",
        minHeight: `${containerMinHeight}px`,
      }}
    >
      <ReactECharts
        option={option}
        style={{
          width: "100%",
          height: "850px",
          minHeight: `${containerMinHeight}px`,
        }}
        opts={{
          renderer: "svg",
        }}
      />
    </div>
  );
}