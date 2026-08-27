"use client";

import ReactECharts from "echarts-for-react";

// Fixed 3 colors for line charts
const CUSTOM_LINE_COLORS = ["#1d3767", "#a84b41", "#595959"];

interface ChartSeries {
  name: string;
  data: number[];
}

interface CategoryChart {
  id: string;
  title: string;
  type: string;
  unit?: string;
  subtitle?: string;
  categories: string[];
  series: ChartSeries[];
}

interface LineChartType extends CategoryChart {
  xAxisLabel?: string;
  yAxisLabel?: string;
}

interface Props {
  chart: LineChartType;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  dashedSeries?: string[];
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const toPersianDigits = (value: string | number) => {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
};

const formatNumber = (value: number) => {
  // If the absolute value is less than 1 and not zero,
  // format without an unnecessary leading zero.
  if (Math.abs(value) < 1 && value !== 0) {
    const formatted = toPersianDigits(value.toString());

    return formatted.replace(/^۰\./, "۰٫");
  }

  return new Intl.NumberFormat("fa-IR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const formatFullNumber = (value: number) => {
  return new Intl.NumberFormat("fa-IR").format(value);
};

// Format number without unit text
const formatNumberWithoutUnit = (value: number) => {
  const formatted = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  return formatted.replace(/[^0-9.\-\u0660-\u0669]/g, "").trim();
};

export default function LineChartNoCurve({
  chart,
  height,
  showLegend = true,
  showLabels = true,
  dashedSeries = [],
}: Props) {
  // Guard against missing data
  if (!chart.series || chart.series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[820px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  const categories = chart.categories || [];

  const createSolidLegendIcon = () => {
    return "path://M0 10 H64 V14 H0 Z M32 3 A9 9 0 1 1 32 21 A9 9 0 1 1 32 3 Z";
  };

  const createDashedLegendIcon = () => {
    return "path://M0 10 H12 V14 H0 Z M16 10 H28 V14 H16 Z M36 10 H48 V14 H36 Z M52 10 H64 V14 H52 Z M32 3 A9 9 0 1 1 32 21 A9 9 0 1 1 32 3 Z";
  };
  // Use only our 3 specific colors
  const colors = CUSTOM_LINE_COLORS;

  // Build ECharts series
  const series = chart.series.map((s, index) => {
    const seriesColor = colors[index % colors.length];
    const data = s.data || [];

    const isDashed = dashedSeries.includes(s.name);

    // Determine which points should display labels
    const labelIndexes = new Set<number>();

    if (data.length > 0) {
      labelIndexes.add(0);
      labelIndexes.add(data.length - 1);
    }

    if (data.length <= 6) {
      data.forEach((_, i) => labelIndexes.add(i));
    }

    return {
      name: s.name,
      type: "line",

      data,

      smooth: false,

      symbol: "circle",
      symbolSize: 20,

      lineStyle: {
        width: 5.5,

        ...(isDashed && {
          type: [8, 8],
        }),
      },

      itemStyle: {
        color: seriesColor,
        borderColor: "#FFFFFF",
        borderWidth: 0,
        borderRadius: 8,
      },

      emphasis: {
        focus: "series",
        scale: true,

        itemStyle: {
          borderWidth: 0,
        },

        lineStyle: {
          width: 3,
        },
      },

     label: showLabels
  ? {
      show: true,

     position: s.name === "ارزش صادرات" ? "bottom" : "top",

      distance: s.name === "ارزش صادرات" ? 36 : 10,

      formatter: (params: any) => {
        const index = params.dataIndex;

        if (!labelIndexes.has(index)) {
          return "";
        }

        const formattedNumber = toPersianDigits(
          formatNumberWithoutUnit(params.value),
        );

        return formattedNumber;
      },

      fontSize: "45px",
      fontFamily: "Epsilon",
      fontWeight: 500,
      color: seriesColor,

      borderRadius: 5,
      borderWidth: 0,
    }
  : {
      show: false,
    },
      labelLayout: {
        hideOverlap: false,
      },
    };
  });

  const option = {
    backgroundColor: "transparent",

    color: colors,

    tooltip: {
      trigger: "axis",

      backgroundColor: "rgba(255, 255, 255, 0.98)",

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
      `,

      axisPointer: {
        type: "line",

        lineStyle: {
          color: "#D1D5DB",
          width: 1,
          type: [8, 8],
        },
      },

      formatter: (params: any[]) => {
        if (!params?.length) {
          return "";
        }

        const category = params[0]?.axisValue ?? "";

        const rows = params
          .map((item) => {
            const value =
              typeof item.value === "number"
                ? formatFullNumber(item.value)
                : item.value;

            return `
              <div
                style="
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  gap:24px;
                  margin:8px;
                "
              >
                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:7px;
                    color:#374151;
                  "
                >
                  <span
                    style="
                      width:8px;
                      height:8px;
                      border-radius:50%;
                      background:${item.color};
                      display:inline-block;
                    "
                  ></span>

                  <span>${item.seriesName}</span>
                </div>

                <strong
                  style="
                    color:#111827;
                    font-weight:600;
                    direction:rtl;
                  "
                >
                  ${toPersianDigits(value)}
                </strong>
              </div>
            `;
          })
          .join("");

        return `
          <div style="min-width:190px;">
            <div
              style="
                font-size:12px;
                color:#6B7280;
                margin-bottom:6px;
                font-weight:500;
              "
            >
              ${toPersianDigits(category)}
            </div>

            ${rows}
          </div>
        `;
      },
    },

    // =========================================================
    // LEGEND
    // =========================================================
    legend: showLegend
      ? {
          bottom: 0,
          left: "center",
          width: "100%",
          orient: "horizontal",
          align: "right",
          itemWidth: 50,
          itemHeight: 50,
          itemGap: 80,

          data: [...chart.series].reverse().map((s) => ({
            name: s.name,
            icon: dashedSeries.includes(s.name)
              ? createDashedLegendIcon()
              : createSolidLegendIcon(),
          })),
          selectedMode: true,

          textStyle: {
            fontFamily: "Epsilon",
            fontSize: "40px",
            fontWeight: 500,
            color: "#4B5563",
            padding: [0, 15],
          },
        }
      : {
          show: false,
        },
    // =========================================================
    // GRID
    // =========================================================
    grid: {
      left: 10,
      right: 40,
      top: showLegend ? 70 : 28,
      bottom: showLegend ? 120 : 40,
      containLabel: true,
    },

    // =========================================================
    // X AXIS
    // =========================================================
    xAxis: {
      type: "category",
      data: categories.map(toPersianDigits),
      boundaryGap: false,

      axisLine: {
        show: false,
        onZero: false,
      },

      axisTick: {
        show: true,
        alignWithLabel: true,
        inside: true,
        length: 10,
        lineStyle: {
          color: "#b8b9b9",
          width: 3,
        },
      },

      axisLabel: {
        show: true,
        fontSize: "45px",
        fontFamily: "Epsilon",
        color: "#808285",
        margin: 30,
        rotate: categories.length > 8 ? 30 : 0,
      },

      splitLine: {
        show: false,
      },
    },
    // =========================================================
    // Y AXIS - FIXED: Merged into a single array
    // =========================================================
    yAxis: [
      {
        type: "value",

        axisLine: {
          show: false,
        },

        axisTick: {
          show: false,
        },

        splitLine: {
          show: true,
          lineStyle: {
            color: "#b8b9b9",
            type: [8, 8],
          },
        },

        axisLabel: {
          fontSize: "45px",
          fontFamily: "Epsilon",
          color: "#808285",
          margin: 50,
          formatter: (value: number) => {
            const formatted = formatNumberWithoutUnit(value);
            return toPersianDigits(formatted);
          },
        },
      },

      {
        type: "value",
        position: "left",
        max: 160000000000,

        axisLine: {
          show: true,
          lineStyle: {
            color: "#b8b9b9",
            type: [8, 8],
          },
        },

        axisTick: {
          show: false,
        },

        axisLabel: {
          show: false,
        },

        splitLine: {
          show: false,
        },
      },
    ],
    series,
  };

  return (
    <div
      style={{
        aspectRatio: "380 / 230",
      }}
    >
      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
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
  );
}
