"use client";

import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { CategoryChart } from "../types/charts";
import { getRankedColorsForChart } from "../lib/colorThemes";

interface Props {
  chart: CategoryChart;
  height?: number;
  showLegend?: boolean;
}

const getNiceYAxisScale = (
  maxValue: number,
  targetSplitCount = 7,
) => {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return {
      max: 1,
      interval: 1,
    };
  }

  const roughInterval =
    maxValue / targetSplitCount;

  const magnitude =
    Math.pow(
      10,
      Math.floor(
        Math.log10(
          roughInterval,
        ),
      ),
    );

  const normalized =
    roughInterval / magnitude;

  let niceNormalized: number;

  if (normalized <= 1) {
    niceNormalized = 1;
  } else if (normalized <= 2) {
    niceNormalized = 2;
  } else if (normalized <= 2.5) {
    niceNormalized = 2.5;
  } else if (normalized <= 5) {
    niceNormalized = 5;
  } else {
    niceNormalized = 10;
  }

  const interval =
    niceNormalized *
    magnitude;

  const max =
    Math.ceil(
      maxValue / interval,
    ) * interval;

  return {
    max,
    interval,
  };
};

const getContrastTextColor = (hexColor: string) => {
  const hex = hexColor.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Relative luminance approximation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.55 ? "#FFFFFF" : "#2F3640";
};

// ============================================================
// FIXED: Proper Persian decimal handling
// ============================================================
const toPersianDigits = (value: string | number): string => {
  // Convert number to string with proper decimal handling
  const str = typeof value === 'number' ? value.toString() : value;
  
  // Split into integer and decimal parts
  const parts = str.split('.');
  
  // Convert integer part
  const integerPart = parts[0].replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
  
  // Convert decimal part if it exists
  let decimalPart = '';
  if (parts.length > 1) {
    decimalPart = parts[1].replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
  }
  
  // Return with Persian decimal separator (٫) if there's a decimal
  return decimalPart ? `${integerPart}٫${decimalPart}` : integerPart;
};

const fixMirroredChars = (text: string) => {
  return text
    .replace(/\(/g, "___OPEN_PAREN___")
    .replace(/\)/g, "(")
    .replace(/___OPEN_PAREN___/g, ")");
};

const toPersianLabel = (value: string | number) => {
  const withDigits = String(value).replace(
    /\d/g,
    (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)],
  );

  return fixMirroredChars(withDigits);
};

// ============================================================
// FIXED: Format functions with proper decimal handling
// ============================================================
const formatValue = (value: number) => {
  // For display inside the chart bars, just show the number without unit
  let formattedValue: string | number;
  
  if (value >= 1e12) {
    formattedValue = (value / 1e12).toFixed(1);
  } else if (value >= 1e9) {
    formattedValue = (value / 1e9).toFixed(1);
  } else if (value >= 1e6) {
    formattedValue = (value / 1e6).toFixed(1);
  } else if (value >= 1e3) {
    formattedValue = (value / 1e3).toFixed(1);
  } else {
    formattedValue = value;
  }
  
  return toPersianDigits(formattedValue);
};

// For tooltip - shows full value with unit
const formatTooltipValue = (value: number) => {
  let formattedValue: string | number;
  let unit = '';
  
  if (value >= 1e12) {
    formattedValue = (value / 1e12).toFixed(1);
    unit = ' تریلیون';
  } else if (value >= 1e9) {
    formattedValue = (value / 1e9).toFixed(1);
    unit = ' میلیارد';
  } else if (value >= 1e6) {
    formattedValue = (value / 1e6).toFixed(1);
    unit = ' میلیون';
  } else if (value >= 1e3) {
    formattedValue = (value / 1e3).toFixed(1);
    unit = ' هزار';
  } else {
    formattedValue = value;
  }
  
  return `${toPersianDigits(formattedValue)}${unit}`;
};

const getAxisLabel = (value: number) => {
  let formattedValue: string | number;
  let unit = '';
  
  if (value >= 1e9) {
    const val = value / 1e9;
    formattedValue = Number.isInteger(val) ? val : val.toFixed(1);
    unit = ' میلیارد';
  } else if (value >= 1e6) {
    const val = value / 1e6;
    formattedValue = Number.isInteger(val) ? val : val.toFixed(1);
    unit = ' میلیون';
  } else if (value >= 1e3) {
    const val = value / 1e3;
    formattedValue = Number.isInteger(val) ? val : val.toFixed(1);
    unit = ' هزار';
  } else {
    formattedValue = value;
  }
  
  return `${toPersianDigits(formattedValue)}${unit}`;
};

const needsPercentageConversion = (chart: CategoryChart): boolean => {
  if (!chart.series?.length) return false;

  for (let seriesIndex = 0; seriesIndex < chart.series.length; seriesIndex++) {
    const data = chart.series[seriesIndex].data || [];

    for (let dataIndex = 0; dataIndex < data.length; dataIndex++) {
      if (Number(data[dataIndex]) > 100) {
        return false;
      }
    }
  }

  for (
    let categoryIndex = 0;
    categoryIndex < chart.categories.length;
    categoryIndex++
  ) {
    let total = 0;

    for (
      let seriesIndex = 0;
      seriesIndex < chart.series.length;
      seriesIndex++
    ) {
      total += Number(chart.series[seriesIndex]?.data?.[categoryIndex] ?? 0);
    }

    if (Math.abs(total - 100) > 5) {
      return false;
    }
  }

  return true;
};

const createRibbonPath = (
  x1: number,
  top1: number,
  bottom1: number,
  x2: number,
  top2: number,
  bottom2: number,
) => {
  const width = x2 - x1;
  const curve = width * 0.5;

  return [
    `M ${x1} ${top1}`,
    `C ${x1 + curve} ${top1},`,
    `${x2 - curve} ${top2},`,
    `${x2} ${top2}`,
    `L ${x2} ${bottom2}`,
    `C ${x2 - curve} ${bottom2},`,
    `${x1 + curve} ${bottom1},`,
    `${x1} ${bottom1}`,
    "Z",
  ].join(" ");
};

export default function BarChart({
  chart,
  height = 310,
  showLegend = true,
}: Props) {
  if (!chart.series?.length || !chart.categories?.length) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg bg-[#F7F9F8]">
        <p className="text-sm text-[#6B7A73]">No data available</p>
      </div>
    );
  }

  // ============================================================
  // FIXED: formatNumberWithoutUnit with proper decimal handling
  // ============================================================
  const formatNumberWithoutUnit = (value: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
    
    // Remove non-numeric characters but keep decimal point
    const cleaned = formatted.replace(/[^0-9.\-]/g, "").trim();
    
    // Convert to Persian digits with decimal handling
    return toPersianDigits(cleaned);
  };

  const [hiddenSeries, setHiddenSeries] = useState<Set<number>>(
    () => new Set(),
  );

  const categories = chart.categories;

  // IMPORTANT:
  // This is the single source of truth for colors.
  // The bars, ribbons, tooltip, and legend all use this exact mapping.
  const colors = useMemo(
    () =>
      getRankedColorsForChart({
        series: chart.series,
      }),
    [chart.series],
  );

  const isPercentage = needsPercentageConversion(chart);

  const processedData = useMemo(
    () =>
      chart.series.map((series) => ({
        ...series,
        data: series.data.map((value) => Number(value ?? 0)),
      })),
    [chart.series],
  );

  // ============================================================
  // SORT EACH CATEGORY/YEAR INDEPENDENTLY
  // ============================================================

  const sortedSeriesByCategory = useMemo(
    () =>
      categories.map((_, categoryIndex) => {
        return processedData
          .map((series, seriesIndex) => ({
            seriesIndex,
            value: Number(series.data[categoryIndex] ?? 0),
          }))
          .filter((item) => !hiddenSeries.has(item.seriesIndex))
          .sort((a, b) => {
            if (b.value !== a.value) {
              return b.value - a.value;
            }
            return a.seriesIndex - b.seriesIndex;
          });
      }),
    [categories, processedData, hiddenSeries],
  );

  const getSeriesRankInCategory = (
    seriesIndex: number,
    categoryIndex: number,
  ) => {
    return sortedSeriesByCategory[categoryIndex].findIndex(
      (item) => item.seriesIndex === seriesIndex,
    );
  };

  const getSegmentBounds = (seriesIndex: number, categoryIndex: number) => {
    const sortedItems = sortedSeriesByCategory[categoryIndex] ?? [];

    const currentRank = getSeriesRankInCategory(seriesIndex, categoryIndex);

    if (currentRank === -1) {
      return {
        value: 0,
        bottom: 0,
        top: 0,
        rank: -1,
        totalSegments: sortedItems.length,
      };
    }

    const value = Number(
      processedData[seriesIndex]?.data?.[categoryIndex] ?? 0,
    );

    let bottom = 0;

    for (let rank = sortedItems.length - 1; rank > currentRank; rank--) {
      bottom += sortedItems[rank].value;
    }

    return {
      value,
      bottom,
      top: bottom + value,
      rank: currentRank,
      totalSegments: sortedItems.length,
    };
  };

  const categoryTotals = useMemo(
    () =>
      categories.map((_, categoryIndex) => {
        return processedData.reduce((total, series, seriesIndex) => {
          if (hiddenSeries.has(seriesIndex)) {
            return total;
          }

          return total + Number(series.data[categoryIndex] ?? 0);
        }, 0);
      }),
    [categories, processedData, hiddenSeries],
  );

  const maxTotal =
    Math.max(
      ...categoryTotals,
      1,
    );

  const yAxisScale =
    isPercentage
      ? {
          max: 100,
          interval: 20,
        }
      : getNiceYAxisScale(
          maxTotal,
          7,
        );

  const yMax =
    yAxisScale.max;

  const yInterval =
    yAxisScale.interval;

  const barData = useMemo(() => {
    const data: [number, number][] = [];

    categories.forEach((_, categoryIndex) => {
      processedData.forEach((_, seriesIndex) => {
        if (hiddenSeries.has(seriesIndex)) {
          return;
        }

        const value = Number(
          processedData[seriesIndex]?.data?.[categoryIndex] ?? 0,
        );

        if (value > 0) {
          data.push([categoryIndex, seriesIndex]);
        }
      });
    });

    return data;
  }, [categories, processedData, hiddenSeries]);

  const connectorData = useMemo(() => {
    const data: [number, number][] = [];

    for (
      let categoryIndex = 0;
      categoryIndex < categories.length - 1;
      categoryIndex++
    ) {
      for (
        let seriesIndex = 0;
        seriesIndex < processedData.length;
        seriesIndex++
      ) {
        if (hiddenSeries.has(seriesIndex)) {
          continue;
        }

        const currentValue = Number(
          processedData[seriesIndex]?.data?.[categoryIndex] ?? 0,
        );

        const nextValue = Number(
          processedData[seriesIndex]?.data?.[categoryIndex + 1] ?? 0,
        );

        if (currentValue > 0 && nextValue > 0) {
          data.push([categoryIndex, seriesIndex]);
        }
      }
    }

    return data;
  }, [categories, processedData, hiddenSeries]);

  const toggleSeries = (seriesIndex: number) => {
    setHiddenSeries((previous) => {
      const next = new Set(previous);

      if (next.has(seriesIndex)) {
        next.delete(seriesIndex);
      } else {
        next.add(seriesIndex);
      }

      return next;
    });
  };

  const option = {
    animation: true,
    animationDuration: 800,
    animationDurationUpdate: 600,
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicOut",

    backgroundColor: "transparent",

    tooltip: {
      trigger: "axis",

      axisPointer: {
        type: "shadow",

        shadowStyle: {
          color: "rgba(0,0,0,0.025)",
        },
      },

      backgroundColor: "#FFFFFF",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      padding: [12, 14],

      textStyle: {
        fontFamily: "Epsilon",
        color: "#374151",
        fontSize: "35px",
      },

      formatter: (params: any[]) => {
        if (!params?.length) return "";

        const categoryIndex = params[0]?.dataIndex;

        if (categoryIndex === undefined || categoryIndex === null) {
          return "";
        }

        const categoryName = categories[categoryIndex] ?? "";

        let html = `
          <div
            style="
              font-weight:700;
              margin-bottom:8px;
              padding-bottom:7px;
              border-bottom:1px solid #F0F0F0;
            "
          >
${toPersianLabel(categoryName)}          </div>
        `;

        const items = chart.series
          .map((series, seriesIndex) => ({
            name: series.name,

            value: Number(
              processedData[seriesIndex]?.data?.[categoryIndex] ?? 0,
            ),

            color: colors[seriesIndex % colors.length],

            seriesIndex,
          }))
          .filter(
            (item) => item.value > 0 && !hiddenSeries.has(item.seriesIndex),
          )
          .sort((a, b) => b.value - a.value);

        items.forEach((item) => {
          const valueText = isPercentage
            ? `${toPersianDigits(item.value.toFixed(1))}٪`
            : formatTooltipValue(item.value);

          html += `
            <div
              style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:24px;
                padding:4px 0;
              "
            >
              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:7px;
                "
              >
                <span
                  style="
                    width:10px;
                    height:10px;
                    border-radius:3px;
                    background:${item.color};
                    display:inline-block;
                    flex-shrink:0;
                  "
                ></span>

                <span>${item.name}</span>
              </div>

              <span style="font-weight:700;">
                ${valueText}
              </span>
            </div>
          `;
        });

        return html;
      },
    },

    legend: {
      show: false,
    },
    // =========================================================
    // GRID — same visual settings as LineChartNoCurve
    // =========================================================
    grid: {
      left: 5,
      right: 5,
      top: 10,
      bottom: 0,
      containLabel: true,
    },

    // =========================================================
    // X AXIS
    // =========================================================
    xAxis: {
      type: "category",

      data: categories.map(toPersianLabel),
      // Keep TRUE for the ribbon/bar chart.
      // false works for lines but can clip the first/last bars.
      boundaryGap: true,

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
            color: "#D1D5DB",
            type: [5, 5],
          },
      },

      axisLabel: {
        show: true,

              fontSize: 26,
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
    // Y AXIS
    // =========================================================
    yAxis: [
      // Main Y axis:
      // labels + horizontal dashed grid
    {
  type: "value",

  min: 0,
  max: yMax,
  interval: yInterval,

        axisLine: {
          show: false,
        },

        axisTick: {
          show: false,
        },

        splitLine: {
          show: true,

           lineStyle: {
            color: "#D1D5DB",
            type: [5, 5],
          },
        },

        axisLabel: {
          show: true,

              fontSize: 26,
          fontFamily: "Epsilon",
          color: "#808285",

          margin: 30,

          formatter: (value: number) => {
            if (isPercentage) {
              return `${toPersianDigits(value)}٪`;
            }

            const formatted = formatNumberWithoutUnit(value);

            return toPersianDigits(formatted);
          },
        },
      },

      // Second Y axis:
      // only used to draw the left vertical dashed line
{
  type: "value",

  position: "left",

  min: 0,
  max: yMax,
  interval: yInterval,

        axisLine: {
          show: true,

          lineStyle: {
            color: "#D1D5DB",
            type: [5, 5],
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

    series: [
      // 1. SMOOTH CONNECTING RIBBONS
      {
        name: "__ribbons__",
        type: "custom",
        coordinateSystem: "cartesian2d",
        silent: true,
        z: 1,

        data: connectorData,

        tooltip: {
          show: false,
        },

        renderItem: (params: any, api: any) => {
          const categoryIndex = Number(api.value(0));

          const seriesIndex = Number(api.value(1));

          const nextCategoryIndex = categoryIndex + 1;

          const source = getSegmentBounds(seriesIndex, categoryIndex);

          const target = getSegmentBounds(seriesIndex, nextCategoryIndex);

          if (source.value <= 0 || target.value <= 0) {
            return null;
          }

         const sourceCenterX = api.coord([categoryIndex, 0])[0];

const targetCenterX = api.coord([nextCategoryIndex, 0])[0];

const categoryWidth = Math.abs(api.size([1, 0])[0]);

const barWidth = categoryWidth * 0.52;

// Both bars are aligned to the left edge of their category slot
const sourceBarX =
  sourceCenterX - categoryWidth / 2;

const targetBarX =
  targetCenterX - categoryWidth / 2;

// Ribbon starts from right edge of source bar
const x1 = sourceBarX + barWidth;

// Ribbon ends at left edge of target bar
const x2 = targetBarX;

          const top1 = api.coord([categoryIndex, source.top])[1];

          const bottom1 = api.coord([categoryIndex, source.bottom])[1];

          const top2 = api.coord([nextCategoryIndex, target.top])[1];

          const bottom2 = api.coord([nextCategoryIndex, target.bottom])[1];

          return {
            type: "path",

            shape: {
              d: createRibbonPath(x1, top1, bottom1, x2, top2, bottom2),
            },

            style: {
              fill: colors[seriesIndex % colors.length],

              opacity: 0.7,
            },
          };
        },
      },

      // 2. SORTED STACKED COLUMN SEGMENTS
      {
        name: "__bars__",
        type: "custom",
        coordinateSystem: "cartesian2d",
        z: 5,

        data: barData,

        renderItem: (params: any, api: any) => {
          const categoryIndex = Number(api.value(0));

          const seriesIndex = Number(api.value(1));

          const bounds = getSegmentBounds(seriesIndex, categoryIndex);

          if (bounds.value <= 0) {
            return null;
          }

          const centerX = api.coord([categoryIndex, 0])[0];

          const categoryWidth = Math.abs(api.size([1, 0])[0]);

          const barWidth = categoryWidth * 0.52;

          const topY = api.coord([categoryIndex, bounds.top])[1];

          const bottomY = api.coord([categoryIndex, bounds.bottom])[1];

const x = centerX - categoryWidth / 2;
          const segmentHeight = Math.max(0, bottomY - topY);

          const isTopSegment = bounds.rank === 0;

          const isBottomSegment = bounds.rank === bounds.totalSegments - 1;

          const radiusTop = isTopSegment ? 5 : 0;

          const radiusBottom = isBottomSegment ? 5 : 0;

          const color = colors[seriesIndex % colors.length];
          const labelColor = getContrastTextColor(color);
          
          // ============================================================
          // FIXED: Show decimal in percentage values
          // ============================================================
          const valueText = isPercentage
            ? `${toPersianDigits(bounds.value.toFixed(1))}٪`
            : formatValue(bounds.value);

          const children: any[] = [
            {
              type: "rect",

              shape: {
                x,
                y: topY,
                width: barWidth,
                height: segmentHeight,

                r: [radiusTop, radiusTop, radiusBottom, radiusBottom],
              },

              style: {
                fill: color,
                stroke: "#FFFFFF",
                lineWidth: 1.5,
              },
            },
          ];

          if (segmentHeight >= 24) {
            const labelX = x + barWidth / 2;
            const labelY = (topY + bottomY) / 2;

            children.push({
              type: "text",

              style: {
                x: labelX,
                y: labelY,

                text: valueText,
                fill: labelColor,

                fontFamily: "Epsilon",

                fontSize: segmentHeight < 26 ? 26 : 26,

                fontWeight: 500,

                align: "center",
                verticalAlign: "middle",

                overflow: "truncate",
                width: barWidth - 12,
              },

              silent: true,
            });
          }

          return {
            type: "group",
            children,
          };
        },
      },

      // 3. INVISIBLE SERIES
      ...processedData.map((series, seriesIndex) => ({
        name: series.name,
        type: "bar",

        stack: "__tooltip__",

        data: hiddenSeries.has(seriesIndex)
          ? series.data.map(() => 0)
          : series.data,

        barWidth: 0,

        itemStyle: {
          opacity: 0,
        },

        emphasis: {
          disabled: true,
        },

        silent: true,

        z: 0,
      })),
    ],
  };

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "600 / 230",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/* =====================================================
          CHART
      ===================================================== */}
      <div
        style={{
          width: "63.333333%",
          height: "100%",
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        <ReactECharts
          option={option}
          notMerge={true}
          lazyUpdate={true}
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
              "true",
            );
          }}
        />
      </div>

      {/* =====================================================
          LEGEND
      ===================================================== */}
      {showLegend && (
        <div
          data-chart-custom-legend="true"
          dir="rtl"
          style={{
            width: "36.666667%",
            height: "100%",
            boxSizing: "border-box",

            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",

            // bottom
            justifyContent: "flex-end",

            // right
            alignItems: "flex-start",
            alignContent: "flex-start",

            columnGap: "18px",
            rowGap: "6px",

            overflow: "hidden",
          }}
        >
          {chart.series.map((series, seriesIndex) => {
            const isHidden =
              hiddenSeries.has(seriesIndex);

            const color =
              colors[
                seriesIndex % colors.length
              ];

            return (
              <button
                key={`${series.name}-${seriesIndex}`}
                type="button"
                onClick={() =>
                  toggleSeries(seriesIndex)
                }
                aria-pressed={!isHidden}
                title={
                  isHidden
                    ? `نمایش ${series.name}`
                    : `مخفی کردن ${series.name}`
                }
                style={{
                  display: "flex",
                  flexDirection: "row",

                  alignItems: "center",
                  justifyContent: "flex-start",

                  gap: "8px",

                  flexShrink: 0,
                  maxWidth: "100%",

                  margin: 0,
                  padding: 0,

                  border: "none",
                  background: "none",

                  opacity: isHidden
                    ? 0.4
                    : 1,

                  cursor: "pointer",

                  transition:
                    "opacity 0.2s",

                  textAlign: "right",
                }}
              >
                <span
                  style={{
                    width: "16px",
                    height: "10px",
                    flexShrink: 0,
                    borderRadius: "3px",
                    backgroundColor: color,
                  }}
                />

                <span
                  style={{
                    fontSize: "35px",
                    fontFamily: "Epsilon",
                    fontWeight: 500,
                    lineHeight: 1.15,
                    color: "#5F6368",
                    whiteSpace: "nowrap",
                  }}
                >
                  {toPersianLabel(
                    series.name,
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}