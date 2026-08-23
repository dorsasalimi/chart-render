"use client";

import ReactECharts from "echarts-for-react";
import { getRankedColorsForChart } from "../lib/colorThemes";
import { useRef, useEffect } from "react";

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
  onChartReady?: (instance: any) => void;
  downloadRef?: React.MutableRefObject<(() => void) | null>;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

const toPersianLabel = (text: string) => {
  return text.replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

const formatFullNumber = (value: number) => {
  return new Intl.NumberFormat("fa-IR").format(value);
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

export default function PieChart({ chart, onChartReady, downloadRef }: Props) {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const normalizedData = normalizeChartData(chart);

  if (!normalizedData || normalizedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // Get ranked colors for pie chart data
  const colors = getRankedColorsForChart({ data: normalizedData });

  // Calculate dynamic values based on data length
  const dataLength = normalizedData.length;
  const legendItemGap = dataLength <= 4 ? 60 : dataLength <= 6 ? 40 : 25;
  const containerMinHeight = dataLength <= 4 ? 460 : 460 + Math.min((dataLength - 4) * 20, 80);
  const pieRadius = dataLength <= 4 ? ["40%", "72%"] : dataLength <= 6 ? ["38%", "68%"] : ["35%", "62%"];
  const pieCenter = dataLength <= 4 ? ["50%", "42%"] : ["50%", "40%"];

  // Apply ranked colors to data items
  const dataWithColors = normalizedData.map((item, index) => ({
    ...item,
    name: toPersianLabel(item.name),
    itemStyle: {
      color: colors[index % colors.length]
    }
  }));

  const option = {
    color: colors,
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "#E5E7EB",
      borderWidth: 0,
      padding: [12, 14],
      textStyle: {
        fontFamily: "Epsilon",
        color: "#111827",
        fontSize: '16px',
      },
      extraCssText: `
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      `,
      formatter: (params: any) => {
        const value = toPersianDigits(formatFullNumber(params.value));
        const percentDisplay = `٪${toPersianDigits(params.percent)}`;
        const name = toPersianLabel(params.name);
        return `
          <div style="min-width:160px; font-family: Epsilon; direction: rtl;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
              <span style="width:10px; height:10px; border-radius:50%; background:${params.color}; display:inline-block;"></span>
              <strong style="color:#111827; font-weight:600; font-size:16px;">${name}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; gap:24px; padding:4px 0;">
              <span style="color:#6B7280; font-size:14px;">مقدار</span>
              <strong style="color:#111827; font-weight:600; direction:rtl;">${value} ${chart.unit ?? ""}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; gap:24px; padding:4px 0;">
              <span style="color:#6B7280; font-size:14px;">سهم</span>
              <strong style="color:#111827; font-weight:600; direction:rtl;">${percentDisplay}</strong>
            </div>
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
        fontFamily: "Epsilon",
        fontSize: '16px',
        fontWeight: 500,
        color: "#4B5563",
      },
      padding: [8, 5, 5, 5],
      type: "scroll",
      icon: "circle",
      align: "right",
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
            const percentDisplay = `٪${toPersianDigits(params.percent)}`;
            return `${toPersianLabel(params.name)}\n\n${percentDisplay}`;
          },
          fontSize: '16px',
          fontWeight: 400,
          fontFamily: "Epsilon",
          color: "#333",
          position: "outside",
          distanceToLabelLine: 2,
          lineHeight: 10,
        },
        labelLine: {
          show: true,
          length: dataLength <= 4 ? 20 : 60,
          length2: dataLength <= 4 ? 18 : 60,
          smooth: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16px',
            fontWeight: "bold",
            fontFamily: "Epsilon",
            formatter: (params: any) => {
              const value = toPersianDigits(formatFullNumber(params.value));
              const percentDisplay = `٪${toPersianDigits(params.percent)}`;
              return `${toPersianLabel(params.name)}\n\n${value} ${chart.unit ?? ""}\n\n${percentDisplay}`;
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

  // Handle chart ready and setup download function
  const handleChartReady = (instance: any) => {
    chartRef.current = instance;
    
    // Set the data-echarts-instance attribute on the DOM element
    const dom = instance.getDom();
    dom.setAttribute("data-echarts-instance", "true");
    
    // Set up download function if downloadRef is provided
    if (downloadRef) {
      downloadRef.current = () => {
        if (chartRef.current && containerRef.current) {
          // Get the SVG data
          const svgData = chartRef.current.getDataURL({
            type: 'svg',
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          });
          
          // Create download link
          const link = document.createElement('a');
          link.download = `chart-${chart.title || 'pie-chart'}.svg`;
          link.href = svgData;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };
    }

    // Call onChartReady if provided
    if (onChartReady) {
      onChartReady(instance);
    }
  };

  // Clean up download ref on unmount
  useEffect(() => {
    return () => {
      if (downloadRef) {
        downloadRef.current = null;
      }
    };
  }, [downloadRef]);

  return (
  <div
    style={{
      width: "100%",
      aspectRatio: "510 / 310",
      minHeight: `310px`,
    }}
  >
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{
          width: "100%",
          height: "100%",
          minHeight: `${containerMinHeight}px`,
        }}
        opts={{
          renderer: "svg",
        }}
        onChartReady={handleChartReady}
      />
    </div>
  );
}