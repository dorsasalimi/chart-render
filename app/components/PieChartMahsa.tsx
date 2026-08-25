"use client";

import ReactECharts from "echarts-for-react";
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
  series?: Array<{
    name?: string;
    data: number[];
  }>;
}

interface Props {
  chart: PieChartType;
  onChartReady?: (instance: any) => void;
  downloadRef?: React.MutableRefObject<(() => void) | null>;
}

const IMPORT_COLORS = [
  "#a84b41",
  "#db978a",
  "#fabfb7",
  "#db978a",
  "#e7b2a8",
  "#f0cdc6",
];

const EXPORT_COLORS = [
  "#1d3767",
  "#6675a9",
  "#87bad2",
  "#8795bd",
  "#aab5d1",
  "#ccd3e3",
];

const OTHERS_COLOR = "#b8b9b9";

const isOthers = (name: string) => {
  const normalized = String(name || "").trim().toLowerCase();

  return (
    normalized === "سایر" ||
    normalized === "سائر" ||
    normalized === "others" ||
    normalized === "other"
  );
};

const getMahsaColors = (
  title: string | undefined,
  data: PieChartDataItem[],
): string[] => {
  const normalizedTitle = String(title || "").trim();

  let palette: string[];

  if (normalizedTitle.includes("واردات")) {
    palette = IMPORT_COLORS;
  } else if (normalizedTitle.includes("صادرات")) {
    palette = EXPORT_COLORS;
  } else {
    // Default fallback
    palette = EXPORT_COLORS;
  }

  // "سایر" must not consume a rank/color.
  const rankedItems = data
    .map((item, index) => ({
      ...item,
      originalIndex: index,
    }))
    .filter((item) => !isOthers(item.name))
    .sort((a, b) => b.value - a.value);

  const colorByIndex = new Map<number, string>();

  rankedItems.forEach((item, rank) => {
    const colorIndex = Math.min(rank, palette.length - 1);

    colorByIndex.set(
      item.originalIndex,
      palette[colorIndex],
    );
  });

  return data.map((item, index) => {
    if (isOthers(item.name)) {
      return OTHERS_COLOR;
    }

    return colorByIndex.get(index) ?? palette[0];
  });
};


const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

// Fixes character mirroring for ECharts vectorizer by swapping mirrored glyphs
const fixMirroredChars = (text: string) => {
  return text
    .replace(/\(/g, "___OPEN_PAREN___")
    .replace(/\)/g, "(")
    .replace(/___OPEN_PAREN___/g, ")");
};

const toPersianLabel = (text: string) => {
  if (!text) return "";
  const withDigits = String(text).replace(
    /\d/g,
    (digit) => PERSIAN_DIGITS[Number(digit)],
  );
  return fixMirroredChars(withDigits);
};

const formatFullNumber = (value: number) => {
  return new Intl.NumberFormat("fa-IR").format(value);
};

// Always show percentage with exactly ONE decimal place
const formatPercent = (value: number) => {
  return toPersianDigits(Number(value).toFixed(1));
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

// Sort data with "others" always at the left (first position)
const sortPieData = (data: PieChartDataItem[]): PieChartDataItem[] => {
  // Separate "others" from the rest
  const othersItems = data.filter(item => isOthers(item.name));
  const regularItems = data.filter(item => !isOthers(item.name));
  
  // Sort regular items by value (descending)
  const sortedRegular = regularItems.sort((a, b) => b.value - a.value);
  
  // Return: others first, then regular items sorted descending
  return [ ...sortedRegular,...othersItems];
};

//function for breaking the text label
const wrapLabel = (text: string, maxChars = 12) => {
  if (!text) return "";

  const words = text.split(/\s+/);

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine
      ? `${currentLine} ${word}`
      : word;

    if (nextLine.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
};


export default function PieChartMahsa({ chart, onChartReady, downloadRef }: Props) {
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

  // Sort the data
  const sortedData = sortPieData(normalizedData);

  const colors = getMahsaColors(
    chart.title,
    sortedData, // Use sorted data for colors
  );

  const dataLength = sortedData.length;

  const legendItemGap = dataLength <= 4 ? 60 : dataLength <= 6 ? 40 : 25;

  const containerMinHeight =
    dataLength <= 4 ? 380 : 380 + Math.min((dataLength - 4) * 20, 80);

  const pieRadius =
    dataLength <= 4
      ? ["40%", "72%"]
      : dataLength <= 6
        ? ["38%", "68%"]
        : ["35%", "62%"];

  const pieCenter = dataLength <= 4 ? ["50%", "46%"] : ["50%", "44%"];

  const dataWithColors = sortedData.map((item, index) => ({
    ...item,
    name: toPersianLabel(item.name),
    itemStyle: {
      color: colors[index % colors.length],
    },
  }));

  // Calculate start angle to position "others" on the left
  const othersIndex = sortedData.findIndex(item => isOthers(item.name));
  const totalValue = sortedData.reduce((sum, item) => sum + item.value, 0);
  const othersValue = othersIndex !== -1 ? sortedData[othersIndex].value : 0;
  const othersAngle = totalValue > 0 ? (othersValue / totalValue) * 360 : 0;
  
  // Start at 90° (top) and rotate to position "others" on the left
  // Since we want the largest at the bottom, we use descending sort
  // and adjust startAngle so the first item (others) appears on the left
  const startAngle = 90 - (othersAngle / 2);

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
        fontSize: "45px",
      },

      extraCssText: `
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      `,

      formatter: (params: any) => {
        const value = toPersianDigits(formatFullNumber(params.value));

        const percentDisplay = `٪${formatPercent(Number(params.percent))}`;

        const name = params.name;
        const unit = chart.unit ? toPersianLabel(chart.unit) : "";

        return `
          <div
            style="
              min-width:160px;
              font-family:Epsilon, Tahoma, sans-serif;
              direction:rtl;
              unicode-bidi:plaintext;
            "
          >
            <div
              style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:8px;
              "
            >
              <span
                style="
                  width:10px;
                  height:10px;
                  border-radius:50%;
                  background:${params.color};
                  display:inline-block;
                "
              ></span>

              <strong
                style="
                  color:#111827;
                  font-weight:600;
                  font-size:16px;
                "
              >
                ${name}
              </strong>
            </div>

            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:24px;
                padding:4px 0;
              "
            >
              <span
                style="
                  color:#6B7280;
                  font-size:14px;
                "
              >
                مقدار
              </span>

              <strong
                style="
                  color:#111827;
                  font-weight:600;
                "
              >
                ${value} ${unit}
              </strong>
            </div>

            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:24px;
                padding:4px 0;
              "
            >
              <span
                style="
                  color:#6B7280;
                  font-size:14px;
                "
              >
                سهم
              </span>

              <strong
                style="
                  color:#111827;
                  font-weight:600;
                "
              >
                ${percentDisplay}
              </strong>
            </div>
          </div>
        `;
      },
    },

    series: [
      {
        name: chart.title ? toPersianLabel(chart.title) : undefined,

        type: "pie",
        radius: pieRadius,
        center: pieCenter,
        avoidLabelOverlap: true,
        
        // Sort data in descending order (largest first)
        sort: 'descending',
        
        // Start angle to position "others" on the left
        startAngle: startAngle,

        itemStyle: {
          borderRadius: 20,
          borderColor: "#ffffff",
          borderWidth: 10,
        },

        // Hide labels
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },

        data: dataWithColors,
      },
    ],

    grid: {
      containLabel: false,
      bottom: dataLength > 5 ? 80 : 60,
    },
  };

  const handleChartReady = (instance: any) => {
    chartRef.current = instance;

    const dom = instance.getDom();
    dom.setAttribute("data-echarts-instance", "true");

    if (downloadRef) {
      downloadRef.current = () => {
        if (chartRef.current && containerRef.current) {
          const svgDataUrl = chartRef.current.getDataURL({
            type: "svg",
            pixelRatio: 2,
            backgroundColor: "#ffffff",
          });

          const link = document.createElement("a");
          link.download = `chart-${chart.title || "pie-chart"}.svg`;
          link.href = svgDataUrl;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };
    }

    if (onChartReady) {
      onChartReady(instance);
    }
  };

  useEffect(() => {
    return () => {
      if (downloadRef) {
        downloadRef.current = null;
      }
    };
  }, [downloadRef]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        aspectRatio: "510 / 310",
        minHeight: "310px",
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