"use client";

import ReactECharts from "echarts-for-react";
import { useEffect, useRef, useState } from "react";
import type { SankeyDataset } from "../types/charts";

interface SankeyChartProps {
  chartId: string;
  dataset: SankeyDataset;
  countryColumn?: string;
  chapterColumn?: string;
  topCountries?: number;
  topChaptersPerCountry?: number;
  height?: number;
  showSummary?: boolean;
  showStatus?: boolean;
}

const faPercent1 = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const faPercent2 = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function toPersianText(value: unknown) {
  return String(value ?? "")
    .replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)])
    .replace(/[٠-٩]/g, (digit) =>
      PERSIAN_DIGITS[digit.charCodeAt(0) - 0x0660],
    )
    .replace(/ي|ى/g, "ی")
    .replace(/ك/g, "ک");
}

function formatPercent1(value: number) {
  return `٪${faPercent1.format(value)}`;
}

function formatPercent2(value: number) {
  return `٪${faPercent2.format(value)}`;
}

function formatNodeDisplayName(
  name: string,
  shareText: string,
  separator = "  ",
) {
  return `${name}${separator}${shareText}`;
}

const NODE_GAP = 70;
const RIBBON_NODE_GAP = 8;

function addRibbonNodeGaps(instance: any) {
  const series = instance.getModel()?.getSeriesByIndex(0);
  const nodeData = series?.getData();
  const edgeData = series?.getData("edge");
  const zr = instance.getZr();

  if (!nodeData || !edgeData || !zr) return;

  const nodeShapes = new Map<string, any>();

  nodeData.eachItemGraphicEl((node: any, index: number) => {
    const item = nodeData.getRawDataItem(index);
    if (item?.name && node?.shape) {
      nodeShapes.set(item.name, { ...node.shape });
    }
  });

  let modified = false;

  edgeData.eachItemGraphicEl((edge: any, index: number) => {
    const item = edgeData.getRawDataItem(index);
    if (!edge?.shape || !item) return;

    const sourceShape = nodeShapes.get(item.source);
    const targetShape = nodeShapes.get(item.target);
    if (!sourceShape || !targetShape) return;

    const shape = edge.shape;
    const sourceCenter = sourceShape.x + sourceShape.width / 2;
    const targetCenter = targetShape.x + targetShape.width / 2;
    const leftToRight = sourceCenter < targetCenter;

    if (shape.x1 !== undefined && shape.x2 !== undefined) {
      if (leftToRight) {
        shape.x1 = sourceShape.x + sourceShape.width + RIBBON_NODE_GAP;
        shape.x2 = targetShape.x - RIBBON_NODE_GAP;
      } else {
        shape.x1 = sourceShape.x - RIBBON_NODE_GAP;
        shape.x2 = targetShape.x + targetShape.width + RIBBON_NODE_GAP;
      }

      const curvature = 0.5;
      shape.cpx1 = shape.x1 * (1 - curvature) + shape.x2 * curvature;
      shape.cpx2 = shape.x1 * curvature + shape.x2 * (1 - curvature);

      edge.dirtyShape();
      modified = true;
    } else if (Array.isArray(shape.points)) {
      shape.points = shape.points.map((pt: [number, number], i: number) => {
        if (leftToRight) {
          return [i < 2 ? pt[0] + RIBBON_NODE_GAP : pt[0] - RIBBON_NODE_GAP, pt[1]];
        }
        return [i < 2 ? pt[0] - RIBBON_NODE_GAP : pt[0] + RIBBON_NODE_GAP, pt[1]];
      });

      edge.dirtyShape();
      modified = true;
    }
  });

  if (modified) {
    zr.refresh();
  }
}

const COUNTRY_COLORS = new Map([
  ["چین", "#1e9abc"],
  ["امارات متحده عربی", "#779775"],
  ["ترکیه", "#6675a9"],
  ["عراق", "#f9cd94"],
]);

const COUNTRY_PALETTE = [
  "#526d82",
  "#81689d",
  "#6b8e6b",
  "#c27b57",
  "#7b8fc4",
  "#a36f8f",
  "#4f8f86",
  "#b48a3c",
  "#7167a8",
  "#8b6f47",
];

function getCountryColor(country: string) {
  const normalizedCountry = toPersianText(country).trim();
  const assignedColor = COUNTRY_COLORS.get(normalizedCountry);

  if (assignedColor) {
    return assignedColor;
  }

  let hash = 0;
  for (const character of normalizedCountry) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return COUNTRY_PALETTE[hash % COUNTRY_PALETTE.length];
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
    } else {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) {
      rows.push(row);
    }
  }

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "").trim() : header.trim(),
  );

  return rows.slice(1).map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [
        header,
        (values[index] ?? "").trim(),
      ]),
    ),
  );
}

function parseShare(value: unknown) {
  return Number.parseFloat(
    String(value ?? "")
      .replace(/٪|%|,/g, "")
      .trim(),
  );
}

function addToMap(
  map: Map<string, number>,
  key: string,
  value: number,
) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function aggregateData(
  rows: Record<string, string>[],
  shareColumn: string,
  countryColumn: string,
  chapterColumn: string,
  topCountriesCount: number,
) {
  const countryTotals = new Map<string, number>();
  const chaptersByCountry = new Map<string, Map<string, number>>();
  let grandTotal = 0;

  for (const row of rows) {
    const country = row[countryColumn]?.trim();
    const chapter = row[chapterColumn]?.trim();
    const share = parseShare(row[shareColumn]);

    if (
      !country ||
      !chapter ||
      !Number.isFinite(share) ||
      share <= 0
    ) {
      continue;
    }

    grandTotal += share;
    addToMap(countryTotals, country, share);

    if (!chaptersByCountry.has(country)) {
      chaptersByCountry.set(country, new Map());
    }

    addToMap(chaptersByCountry.get(country)!, chapter, share);
  }

  const topCountries = [...countryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topCountriesCount);

  const topNames = new Set(topCountries.map(([country]) => country));

  const otherCountriesValue = [...countryTotals.entries()]
    .filter(([country]) => !topNames.has(country))
    .reduce((sum, [, value]) => sum + value, 0);

  return {
    grandTotal,
    topCountries,
    otherCountriesValue,
    chaptersByCountry,
  };
}

function buildSankeyData(
  aggregated: ReturnType<typeof aggregateData>,
  dataset: SankeyDataset,
  topChaptersPerCountry: number,
) {
  const nodes: any[] = [];
  const links: any[] = [];

  const { labels } = dataset;
  const isRtl = dataset.direction === "rtl";
  const totalColor = dataset.code === "im" ? "#a84b41" : "#1d3767";
  const totalId = "__TOTAL__";

  nodes.push({
    name: totalId,
    displayName: labels.total,
    plainName: labels.total,
    kind: "total",
    itemStyle: { color: totalColor },
    label: { color: "#FFFFFF" },
    rawValue: aggregated.grandTotal,
    depth: isRtl ? 2 : 0,
  });

  for (const [country, countryValue] of aggregated.topCountries) {
    const persianCountry = toPersianText(country);
    const color = getCountryColor(country);
    const countryId = `country::${country}`;
    const shareOfFile = (countryValue / aggregated.grandTotal) * 100;
    const shareText = formatPercent1(shareOfFile);

    const countryDisplayName = formatNodeDisplayName(
      isRtl ? persianCountry : shareText,
      isRtl ? shareText : persianCountry,
    );

    nodes.push({
      name: countryId,
      displayName: countryDisplayName,
      plainName: persianCountry,
      kind: "country",
      itemStyle: { color },
      label: { color: "#636466" },
      rawValue: countryValue,
      shareOfFile,
      depth: 1,
    });

    links.push({
      source: isRtl ? countryId : totalId,
      target: isRtl ? totalId : countryId,
      value: countryValue,
      lineStyle: { color: totalColor, opacity: 1 },
      shareOfFile,
    });

    const countryChapters = aggregated.chaptersByCountry.get(country);
    if (!countryChapters) continue;

    const chapters = [...countryChapters.entries()].sort(
      (a, b) => b[1] - a[1],
    );

    const topChapters = chapters.slice(0, topChaptersPerCountry);
    const topChapterNames = new Set(
      topChapters.map(([chapter]) => chapter),
    );

    for (const [chapter, chapterValue] of topChapters) {
      const chapterId = `chapter::${country}::${chapter}`;
      const persianChapter = toPersianText(chapter);
      const shareOfCountry = (chapterValue / countryValue) * 100;
      const chapterShareOfFile = (chapterValue / aggregated.grandTotal) * 100;
      const shareText = formatPercent1(shareOfCountry);

      const chapterDisplayName = formatNodeDisplayName(
        isRtl ? persianChapter : shareText,
        isRtl ? shareText : persianChapter,
        " - ",
      );

      nodes.push({
        name: chapterId,
        displayName: chapterDisplayName,
        plainName: persianChapter,
        parentCountry: persianCountry,
        kind: "chapter",
        itemStyle: { color },
        label: { color: "#636466" },
        rawValue: chapterValue,
        shareOfCountry,
        shareOfFile: chapterShareOfFile,
        depth: isRtl ? 0 : 2,
      });

      links.push({
        source: isRtl ? chapterId : countryId,
        target: isRtl ? countryId : chapterId,
        value: chapterValue,
        lineStyle: { opacity: 0.5 },
        shareOfCountry,
        shareOfFile: chapterShareOfFile,
      });
    }

    const otherValue = chapters
      .filter(([chapter]) => !topChapterNames.has(chapter))
      .reduce((sum, [, value]) => sum + value, 0);

    if (otherValue > 0) {
      const otherId = `chapter::${country}::__OTHER__`;
      const shareOfCountry = (otherValue / countryValue) * 100;
      const otherShareOfFile = (otherValue / aggregated.grandTotal) * 100;
      const shareText = formatPercent1(shareOfCountry);

      const otherDisplayName = formatNodeDisplayName(
        isRtl ? labels.otherChapters : shareText,
        isRtl ? shareText : labels.otherChapters,
        " - ",
      );

      nodes.push({
        name: otherId,
        displayName: otherDisplayName,
        plainName: labels.otherChapters,
        parentCountry: persianCountry,
        kind: "otherChapter",
        itemStyle: { color: "#b8b9b9" },
        label: { color: "#636466" },
        rawValue: otherValue,
        shareOfCountry,
        shareOfFile: otherShareOfFile,
        depth: isRtl ? 0 : 2,
        localX: isRtl ? 0.025 : 0.93,
      });

      links.push({
        source: isRtl ? otherId : countryId,
        target: isRtl ? countryId : otherId,
        value: otherValue,
        lineStyle: { opacity: 0.5 },
        shareOfCountry,
        shareOfFile: otherShareOfFile,
      });
    }
  }

  if (aggregated.otherCountriesValue > 0) {
    const otherId = "__OTHER_COUNTRIES__";
    const shareOfFile =
      (aggregated.otherCountriesValue / aggregated.grandTotal) * 100;
    const shareText = formatPercent1(shareOfFile);

    const otherDisplayName = formatNodeDisplayName(
      isRtl ? labels.otherCountries : shareText,
      isRtl ? shareText : labels.otherCountries,
    );

    nodes.push({
      name: otherId,
      displayName: otherDisplayName,
      plainName: labels.otherCountries,
      kind: "otherCountries",
      itemStyle: { color: "#b8b9b9" },
      label: { color: "#636466" },
      rawValue: aggregated.otherCountriesValue,
      shareOfFile,
      depth: 1,
      localX: isRtl ? 0.5 : 0.455,
    });

    links.push({
      source: isRtl ? otherId : totalId,
      target: isRtl ? totalId : otherId,
      value: aggregated.otherCountriesValue,
      lineStyle: { color: totalColor, opacity: 1 },
      shareOfFile,
    });
  }

  return { nodes, links };
}

function tooltipFormatter(
  params: any,
  dataset: SankeyDataset,
  nodeLabels: Map<string, string>,
) {
  if (params.dataType === "edge") {
    const data = params.data;
    const extra = Number.isFinite(data.shareOfCountry)
      ? `<br/>سهم از کشور: <b>${formatPercent2(data.shareOfCountry)}</b>`
      : "";

    return `
      <div class="tooltip-title">جریان ${dataset.labels.trade}</div>
      <div class="tooltip-flow">${nodeLabels.get(data.source)} ← ${nodeLabels.get(data.target)}</div>
      سهم از کل داده: <b>${formatPercent2(data.shareOfFile ?? 0)}</b>
      ${extra}
    `;
  }

  const data = params.data;
  if (!data) return "";

  if (data.kind === "total") {
    return `
      <div class="tooltip-title">${dataset.labels.total}</div>
      مجموع درصدهای ثبت‌شده: <b>${formatPercent2(data.rawValue)}</b>
    `;
  }

  const parts = [
    `<div class="tooltip-title">${data.plainName ?? data.displayName}</div>`,
  ];

  if (data.parentCountry) {
    parts.push(`کشور: <b>${data.parentCountry}</b><br/>`);
  }

  if (Number.isFinite(data.shareOfFile)) {
    parts.push(
      `سهم از کل داده: <b>${formatPercent2(data.shareOfFile)}</b><br/>`,
    );
  }

  if (Number.isFinite(data.shareOfCountry)) {
    parts.push(
      `سهم از ${dataset.labels.trade} این کشور: <b>${formatPercent2(data.shareOfCountry)}</b>`,
    );
  }

  return parts.join("");
}

export default function SankeyChart({
  chartId,
  dataset,
  countryColumn = "Wrong country",
  chapterColumn = "فصل",
  topCountries = 3,
  topChaptersPerCountry = 3,
  height = 620,
  showSummary = false,
  showStatus = false,
}: SankeyChartProps) {
  const [option, setOption] = useState<any>(null);
  const [aggregated, setAggregated] = useState<ReturnType<
    typeof aggregateData
  > | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [nodeLabels, setNodeLabels] = useState<Map<string, string>>(new Map());
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!dataset.csvUrl) return;

      setError(null);

      try {
        const response = await fetch(dataset.csvUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const rows = parseCsv(await response.text());
        if (!rows.length) {
          throw new Error("فایل CSV خالی است یا قابل خواندن نیست.");
        }

        const required = [
          countryColumn,
          chapterColumn,
          dataset.shareColumn,
        ];

        const missing = required.filter((column) => !(column in rows[0]));
        if (missing.length) {
          throw new Error(
            `ستون‌های زیر پیدا نشدند: ${missing.join("، ")}`,
          );
        }

        const nextAggregated = aggregateData(
          rows,
          dataset.shareColumn,
          countryColumn,
          chapterColumn,
          topCountries,
        );

        if (!nextAggregated.topCountries.length || nextAggregated.grandTotal <= 0) {
          throw new Error("داده معتبر برای ترسیم پیدا نشد.");
        }

        if (cancelled) return;

        setRowCount(rows.length);
        setAggregated(nextAggregated);

        const sankey = buildSankeyData(
          nextAggregated,
          dataset,
          topChaptersPerCountry,
        );

        const labels = new Map(
          sankey.nodes.map((node) => [
            node.name,
            node.plainName ?? node.displayName,
          ]),
        );

        setNodeLabels(labels);

        const isRtl = dataset.direction === "rtl";

        setOption({
          animationDuration: 850,
          animationEasing: "cubicOut",

          tooltip: {
            trigger: "item",
            triggerOn: "mousemove|click",
            confine: true,
            extraCssText:
              "direction:rtl; text-align:right; line-height:1.8; border-radius:10px; font-size:26px;",
            formatter: (params: any) =>
              tooltipFormatter(params, dataset, labels),
          },

          series: [
            {
              type: "sankey",
              name: dataset.labels.trade,
              nodeWidth: 30,
              nodeGap: NODE_GAP,
              nodeAlign: "justify",
              layout: "none",
              layoutIterations: 0,
              draggable: false,

              left: isRtl ? "22%" : "1%",
              right: isRtl ? "1%" : "22%",
              top: 10,
              bottom: 20,

              emphasis: {
                focus: "adjacency",
              },
              data: sankey.nodes,
              links: sankey.links,
              label: {
                show: true,
                position: isRtl ? "left" : "right",
                distance: 18,
                color: "#636466",
                fontFamily: "w_Epsilon",
                fontSize: 50,
                lineHeight: 40,
                overflow: "truncate",
                fontWeight: "normal",
                formatter: (params: any) => {
                  let label = toPersianText(
                    params.data.displayName ?? params.name,
                  );
                  if (label.length > 30) {
                    label = label.substring(0, 30) + "...";
                  }
                  return `${isRtl ? "\u2067" : "\u2066"}${label}\u2069`;
                },
              },
              itemStyle: {
                borderWidth: 0,
                borderRadius: 4,
                shadowBlur: 6,
                shadowColor: "rgba(0,0,0,0.06)",
                shadowOffsetY: 1,
              },
              lineStyle: {
                color: "gradient",
                curveness: 0.5,
                opacity: 1,
              },
              levels: [
                {
                  depth: 0,
                  itemStyle: { color: "#1d3767" },
                  lineStyle: { opacity: 1 },
                      label: { show: false }, // Add this to hide label for total node

                },
                {
                  depth: 1,
                  itemStyle: { color: "#4d6f91" },
                  lineStyle: { opacity: 1 },
                },
                {
                  depth: 2,
                  itemStyle: { color: "#9aa9b8" },
                  lineStyle: { opacity: 1 },
                },
              ],
            },
          ],
        });
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err instanceof Error ? err.message : "خطای ناشناخته");
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [
    dataset,
    countryColumn,
    chapterColumn,
    topCountries,
    topChaptersPerCountry,
  ]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[820px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">خطا: {error}</p>
      </div>
    );
  }

  if (!option) {
    return (
      <div className="flex items-center justify-center h-[820px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">Loading...</p>
      </div>
    );
  }

  return (
    <div
      data-tight-svg-export="true"
      data-chart-type="sankey"
      style={{
        aspectRatio: "600 / 530",
        width: "100%",
        overflow: "visible",
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
          chartInstanceRef.current = instance;
          const dom = instance.getDom();
          dom.setAttribute("data-echarts-instance", "true");
          dom.style.overflow = "visible";

          instance.on("finished", () => {
            addRibbonNodeGaps(instance);
          });
        }}
        onEvents={{
          rendered: () => {
            if (chartInstanceRef.current) {
              addRibbonNodeGaps(chartInstanceRef.current);
            }
          },
        }}
      />
    </div>
  );
}