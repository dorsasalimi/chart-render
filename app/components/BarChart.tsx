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

const toPersianDigits = (value: string | number) => {
  return String(value).replace(
    /\d/g,
    (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]
  );
};

const formatValue = (value: number) => {
  // For display inside the chart bars, just show the number without unit
  if (value >= 1e12) {
    return toPersianDigits((value / 1e12).toFixed(1));
  }

  if (value >= 1e9) {
    return toPersianDigits((value / 1e9).toFixed(1));
  }

  if (value >= 1e6) {
    return toPersianDigits((value / 1e6).toFixed(1));
  }

  if (value >= 1e3) {
    return toPersianDigits((value / 1e3).toFixed(1));
  }

  return toPersianDigits(value);
};

// For tooltip - shows full value with unit
const formatTooltipValue = (value: number) => {
  if (value >= 1e12) {
    return `${toPersianDigits((value / 1e12).toFixed(1))} تریلیون`;
  }

  if (value >= 1e9) {
    return `${toPersianDigits((value / 1e9).toFixed(1))} میلیارد`;
  }

  if (value >= 1e6) {
    return `${toPersianDigits((value / 1e6).toFixed(1))} میلیون`;
  }

  if (value >= 1e3) {
    return `${toPersianDigits((value / 1e3).toFixed(1))} هزار`;
  }

  return toPersianDigits(value);
};

const getAxisLabel = (value: number) => {
  if (value >= 1e9) {
    const formatted = value / 1e9;

    return `${toPersianDigits(
      Number.isInteger(formatted)
        ? formatted
        : formatted.toFixed(1)
    )} میلیارد`;
  }

  if (value >= 1e6) {
    const formatted = value / 1e6;

    return `${toPersianDigits(
      Number.isInteger(formatted)
        ? formatted
        : formatted.toFixed(1)
    )} میلیون`;
  }

  if (value >= 1e3) {
    const formatted = value / 1e3;

    return `${toPersianDigits(
      Number.isInteger(formatted)
        ? formatted
        : formatted.toFixed(1)
    )} هزار`;
  }

  return toPersianDigits(value);
};

const needsPercentageConversion = (
  chart: CategoryChart
): boolean => {
  if (!chart.series?.length) return false;

  for (
    let seriesIndex = 0;
    seriesIndex < chart.series.length;
    seriesIndex++
  ) {
    const data = chart.series[seriesIndex].data || [];

    for (
      let dataIndex = 0;
      dataIndex < data.length;
      dataIndex++
    ) {
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
      total += Number(
        chart.series[seriesIndex]?.data?.[
          categoryIndex
        ] ?? 0
      );
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
  bottom2: number
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
        <p className="text-sm text-[#6B7A73]">
          No data available
        </p>
      </div>
    );
  }

  const [hiddenSeries, setHiddenSeries] = useState<Set<number>>(
    () => new Set()
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
    [chart.series]
  );

  const isPercentage = needsPercentageConversion(chart);

  const processedData = useMemo(
    () =>
      chart.series.map((series) => ({
        ...series,
        data: series.data.map((value) =>
          Number(value ?? 0)
        ),
      })),
    [chart.series]
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
            value: Number(
              series.data[categoryIndex] ?? 0
            ),
          }))
          .filter(
            (item) =>
              !hiddenSeries.has(item.seriesIndex)
          )
          .sort((a, b) => {
            if (b.value !== a.value) {
              return b.value - a.value;
            }
            return a.seriesIndex - b.seriesIndex;
          });
      }),
    [
      categories,
      processedData,
      hiddenSeries,
    ]
  );

  const getSeriesRankInCategory = (
    seriesIndex: number,
    categoryIndex: number
  ) => {
    return sortedSeriesByCategory[
      categoryIndex
    ].findIndex(
      (item) =>
        item.seriesIndex === seriesIndex
    );
  };

  const getSegmentBounds = (
    seriesIndex: number,
    categoryIndex: number
  ) => {
    const sortedItems =
      sortedSeriesByCategory[categoryIndex] ?? [];

    const currentRank =
      getSeriesRankInCategory(
        seriesIndex,
        categoryIndex
      );

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
      processedData[seriesIndex]?.data?.[
        categoryIndex
      ] ?? 0
    );

    let bottom = 0;

    for (
      let rank = sortedItems.length - 1;
      rank > currentRank;
      rank--
    ) {
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
        return processedData.reduce(
          (total, series, seriesIndex) => {
            if (hiddenSeries.has(seriesIndex)) {
              return total;
            }

            return (
              total +
              Number(
                series.data[categoryIndex] ?? 0
              )
            );
          },
          0
        );
      }),
    [
      categories,
      processedData,
      hiddenSeries,
    ]
  );

  const maxTotal = Math.max(
    ...categoryTotals,
    1
  );

  const yMax = isPercentage
    ? 100
    : Math.ceil(maxTotal * 1.1);

  const barData = useMemo(() => {
    const data: [number, number][] = [];

    categories.forEach(
      (_, categoryIndex) => {
        processedData.forEach(
          (_, seriesIndex) => {
            if (hiddenSeries.has(seriesIndex)) {
              return;
            }

            const value = Number(
              processedData[
                seriesIndex
              ]?.data?.[categoryIndex] ?? 0
            );

            if (value > 0) {
              data.push([
                categoryIndex,
                seriesIndex,
              ]);
            }
          }
        );
      }
    );

    return data;
  }, [
    categories,
    processedData,
    hiddenSeries,
  ]);

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
          processedData[
            seriesIndex
          ]?.data?.[categoryIndex] ?? 0
        );

        const nextValue = Number(
          processedData[
            seriesIndex
          ]?.data?.[categoryIndex + 1] ?? 0
        );

        if (
          currentValue > 0 &&
          nextValue > 0
        ) {
          data.push([
            categoryIndex,
            seriesIndex,
          ]);
        }
      }
    }

    return data;
  }, [
    categories,
    processedData,
    hiddenSeries,
  ]);

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
        fontSize: 16,
      },

      formatter: (params: any[]) => {
        if (!params?.length) return "";

        const categoryIndex =
          params[0]?.dataIndex;

        if (
          categoryIndex === undefined ||
          categoryIndex === null
        ) {
          return "";
        }

        const categoryName =
          categories[categoryIndex] ?? "";

        let html = `
          <div
            style="
              font-weight:700;
              margin-bottom:8px;
              padding-bottom:7px;
              border-bottom:1px solid #F0F0F0;
            "
          >
            ${toPersianDigits(categoryName)}
          </div>
        `;

        const items = chart.series
          .map((series, seriesIndex) => ({
            name: series.name,

            value: Number(
              processedData[
                seriesIndex
              ]?.data?.[
                categoryIndex
              ] ?? 0
            ),

            color:
              colors[
                seriesIndex % colors.length
              ],

            seriesIndex,
          }))
          .filter(
            (item) =>
              item.value > 0 &&
              !hiddenSeries.has(
                item.seriesIndex
              )
          )
          .sort(
            (a, b) =>
              b.value - a.value
          );

        items.forEach((item) => {
          const valueText = isPercentage
            ? `${toPersianDigits(
                item.value.toFixed(1)
              )}٪`
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

    grid: {
      left: 56,
      right: 24,
      top: 24,
      bottom: 34,
      containLabel: true,
    },

    xAxis: {
      type: "category",

      data: categories.map(
        toPersianDigits
      ),

      boundaryGap: true,

      axisLine: {
        lineStyle: {
          color: "#E5E7EB",
        },
      },

      axisTick: {
        show: false,
      },

      axisLabel: {
        fontSize: 16,
        fontFamily: "Epsilon",
        color: "#6B7280",
        margin: 14,
        rotate: categories && categories.length > 8 ? 30 : 0,
      },

      splitLine: {
        show: false,
      },
    },

    yAxis: {
      type: "value",
      min: 0,
      max: yMax,

      axisLine: {
        show: false,
      },

      axisTick: {
        show: false,
      },

      axisLabel: {
        fontSize: 16,
        fontFamily: "Epsilon",
        color: "#9CA3AF",
        formatter: (value: number) => {
          if (isPercentage) {
            return `${toPersianDigits(
              value
            )}٪`;
          }

          return getAxisLabel(value);
        },
      },

      splitLine: {
        show: true,
        lineStyle: {
          color: "#F0F1F3",
          type: "solid",
        },
      },
    },

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

        renderItem: (
          params: any,
          api: any
        ) => {
          const categoryIndex = Number(
            api.value(0)
          );

          const seriesIndex = Number(
            api.value(1)
          );

          const nextCategoryIndex =
            categoryIndex + 1;

          const source =
            getSegmentBounds(
              seriesIndex,
              categoryIndex
            );

          const target =
            getSegmentBounds(
              seriesIndex,
              nextCategoryIndex
            );

          if (
            source.value <= 0 ||
            target.value <= 0
          ) {
            return null;
          }

          const sourceCenterX =
            api.coord([
              categoryIndex,
              0,
            ])[0];

          const targetCenterX =
            api.coord([
              nextCategoryIndex,
              0,
            ])[0];

          const categoryWidth =
            Math.abs(
              api.size([1, 0])[0]
            );

          const barWidth =
            categoryWidth * 0.52;

          const x1 =
            sourceCenterX +
            barWidth / 2;

          const x2 =
            targetCenterX -
            barWidth / 2;

          const top1 =
            api.coord([
              categoryIndex,
              source.top,
            ])[1];

          const bottom1 =
            api.coord([
              categoryIndex,
              source.bottom,
            ])[1];

          const top2 =
            api.coord([
              nextCategoryIndex,
              target.top,
            ])[1];

          const bottom2 =
            api.coord([
              nextCategoryIndex,
              target.bottom,
            ])[1];

          return {
            type: "path",

            shape: {
              d: createRibbonPath(
                x1,
                top1,
                bottom1,
                x2,
                top2,
                bottom2
              ),
            },

            style: {
              fill:
                colors[
                  seriesIndex % colors.length
                ],

              opacity: 0.5,
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

        renderItem: (
          params: any,
          api: any
        ) => {
          const categoryIndex = Number(
            api.value(0)
          );

          const seriesIndex = Number(
            api.value(1)
          );

          const bounds =
            getSegmentBounds(
              seriesIndex,
              categoryIndex
            );

          if (bounds.value <= 0) {
            return null;
          }

          const centerX =
            api.coord([
              categoryIndex,
              0,
            ])[0];

          const categoryWidth =
            Math.abs(
              api.size([1, 0])[0]
            );

          const barWidth =
            categoryWidth * 0.52;

          const topY =
            api.coord([
              categoryIndex,
              bounds.top,
            ])[1];

          const bottomY =
            api.coord([
              categoryIndex,
              bounds.bottom,
            ])[1];

          const x =
            centerX -
            barWidth / 2;

          const segmentHeight =
            Math.max(
              0,
              bottomY - topY
            );

          const isTopSegment =
            bounds.rank === 0;

          const isBottomSegment =
            bounds.rank ===
            bounds.totalSegments - 1;

          const radiusTop =
            isTopSegment ? 5 : 0;

          const radiusBottom =
            isBottomSegment ? 5 : 0;

          const color =
            colors[
              seriesIndex % colors.length
            ];

          const valueText = isPercentage
            ? `${toPersianDigits(
                bounds.value.toFixed(0)
              )}٪`
            : formatValue(bounds.value);

          const children: any[] = [
            {
              type: "rect",

              shape: {
                x,
                y: topY,
                width: barWidth,
                height: segmentHeight,

                r: [
                  radiusTop,
                  radiusTop,
                  radiusBottom,
                  radiusBottom,
                ],
              },

              style: {
                fill: color,
                stroke: "#FFFFFF",
                lineWidth: 1.5,
              },
            },
          ];

          if (segmentHeight >= 24) {
            children.push({
              type: "text",

              style: {
                x:
                  x +
                  barWidth / 2,

                y:
                  topY +
                  segmentHeight / 2,

                text: valueText,

                fill: "#2F3640",

                fontFamily: "Epsilon",

                fontSize:
                  segmentHeight < 34
                    ? 10
                    : 16,

                fontWeight: 600,

                textAlign: "center",

                textVerticalAlign:
                  "middle",

                overflow: "truncate",

                width:
                  barWidth - 12,
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
      ...processedData.map(
        (series, seriesIndex) => ({
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
        })
      ),
    ],
  };

  return (
    <div className="w-full">
      <div
        style={{
          width: "100%",
          aspectRatio: "510 / 310",
          minHeight: `${height}px`,
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
              "true"
            );
          }}
        />
      </div>

      {showLegend && (
        <div
          data-chart-custom-legend="true"
          className="
            mt-3
            flex
            flex-wrap
            justify-center
            gap-x-5
            gap-y-2
          "
          dir="rtl"
        >
          {chart.series.map(
            (series, seriesIndex) => {
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
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-xs
                    transition-opacity
                    duration-200
                  "
                  style={{
                    opacity:
                      isHidden ? 0.4 : 1,
                  }}
                  aria-pressed={!isHidden}
                  title={
                    isHidden
                      ? `نمایش ${series.name}`
                      : `مخفی کردن ${series.name}`
                  }
                >
                  <span
                    className="
                      h-2.5
                      w-4
                      shrink-0
                      rounded-[3px]
                    "
                    style={{
                      backgroundColor: color,
                    }}
                  />

                  <span
                    className="text-[#5F6368]"
                    style={{
                      fontSize: "16px",
                      fontFamily: "Epsilon",
                      fontWeight: 500,
                    }}
                  >
                    {toPersianDigits(series.name)}
                  </span>
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}