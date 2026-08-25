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

  const colors = getRankedColorsForChart({
    data: normalizedData,
  });

  const dataLength = normalizedData.length;

  const legendItemGap = dataLength <= 4 ? 60 : dataLength <= 6 ? 40 : 25;

  const containerMinHeight =
    dataLength <= 4 ? 380 : 380 + Math.min((dataLength - 4) * 20, 80);

  const pieRadius =
    dataLength <= 4
      ? ["40%", "72%"]
      : dataLength <= 6
        ? ["38%", "68%"]
        : ["45%", "82%"];

  const pieCenter = dataLength <= 4 ? ["50%", "50%"] : ["50%", "50%"];

  const dataWithColors = normalizedData.map((item, index) => ({
    ...item,
    name: toPersianLabel(item.name),
    itemStyle: {
      color: colors[index % colors.length],
    },
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

        itemStyle: {
          borderRadius: 20,
          borderColor: "#ffffff",
          borderWidth: 10,
        },
      label: {
  show: true,
  formatter: (params: any) => {
    const percentDisplay = `٪${formatPercent(Number(params.percent))}`;
    const name = params.name;

    // Wrap text to max 8 characters per line
    const maxCharsPerLine = 25;
    const words = name.split(" ");
    let lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if (
        (currentLine + word).length > maxCharsPerLine &&
        currentLine.length > 0
      ) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    }
    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }

    // If a single word is too long, break it at the middle
    if (lines.length === 1 && lines[0].length > maxCharsPerLine) {
      const word = lines[0];
      const midPoint = Math.floor(word.length / 2);
      // Try to break at a space first
      const spaceIndex = word.indexOf(" ", Math.floor(word.length / 3));
      if (spaceIndex > 0) {
        lines = [
          word.substring(0, spaceIndex),
          word.substring(spaceIndex + 1),
        ];
      } else {
        lines = [word.substring(0, midPoint), word.substring(midPoint)];
      }
    }

    const formattedName = lines.join("\n");

    // Add a space between name and percent
    return `{name|${formattedName}} {percent|${percentDisplay}}`;
  },
          fontFamily: "Epsilon",
          color: "#636466",

          position: "outside",
          distanceToLabelLine: 5,
          lineHeight: 35,
          width: 1000,

          rich: {
            percent: {
              fontSize: 45,
              fontWeight: 500,
              color: "#636466",
            },
            name: {
              fontSize: 39,
              fontWeight: 400,
              color: "#636466",
              lineHeight: 50,
            },
          },
        },
        labelLine: {
          show: true,

          length: dataLength <= 4 ? 20 : 50,
          length2: dataLength <= 4 ? 20 : 50,

          smooth: false,
        },

        emphasis: {
          label: {
            show: true,
            fontSize: "30px",
            fontWeight: "bold",
            fontFamily: "Epsilon",

            formatter: (params: any) => {
              const value = toPersianDigits(formatFullNumber(params.value));

              const percentDisplay = `٪${formatPercent(
                Number(params.percent),
              )}`;

              const valueWithUnit = chart.unit
                ? `${value} ${toPersianLabel(chart.unit)}`
                : value;

              return `${params.name}\n\n${valueWithUnit}\n\n${percentDisplay}`;
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
