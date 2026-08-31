// lib/colorThemes.ts

import { CHART_COLORS } from "./chartTheme";

export type ThemeKey = "default" | "dark" | "light";

/**
 * Fixed chart colors with ranking system.
 * Colors are assigned based on data rank (largest to smallest).
 * The order of these colors determines which color goes to which rank.
 * 1st = largest value, 2nd = second largest, etc.
 */
export const CHART_COLORS_RANKED = [
  "#1d3767", // 1 - largest (dark blue)
  "#6675a9", // 2 (medium blue)
  "#1e9abc", // 3 (teal blue)
  "#87bad2", // 4 (light blue)
  "#779775", // 5 (green)
  "#a4cdb6", // 6 (light green)
  "#a84b41", // 7 (red)
  "#db978a", // 8 (light red)
  "#fba919", // 9 (yellow)
  "#f9cd94", // 10 (light yellow)
];

// ADD THIS: Export COLOR_THEMES for the ColorPicker component
export const COLOR_THEMES: Record<ThemeKey, { name: string; colors: string[] }> = {
  default: {
    name: "Default",
    colors: CHART_COLORS_RANKED,
  },
  dark: {
    name: "Dark",
    colors: [
      "#4fc3f7", // 1st - Primary cyan (largest value)
      "#81d4fa", // 2nd - Light cyan (second largest)
      "#b3e5fc", // 3rd - Pale cyan (third largest)
      "#ff8a65", // 4th - Coral (fourth largest)
      "#ffab91", // 5th - Light coral (fifth largest)
      "#ffccbc", // 6th - Peach (sixth largest)
      "#81c784", // 7th - Mint green (seventh largest)
      "#a5d6a7", // 8th - Light mint (eighth largest)
      "#c8e6c9", // 9th - Pale mint (ninth largest)
      "#ffd54f", // 10th - Gold (smallest value)
      "#ffe082", // 11th - Light gold (fallback/extra)
    ],
  },
  light: {
    name: "Light",
    colors: [
      "#90caf9", // 1st - Blue (largest value)
      "#bbdefb", // 2nd - Light blue (second largest)
      "#e3f2fd", // 3rd - Pale blue (third largest)
      "#ef9a9a", // 4th - Pink (fourth largest)
      "#ef9a9a", // 5th - Pink (fifth largest - duplicate)
      "#ffcdd2", // 6th - Light pink (sixth largest)
      "#a5d6a7", // 7th - Mint green (seventh largest)
      "#c8e6c9", // 8th - Light mint (eighth largest)
      "#e8f5e9", // 9th - Pale mint (ninth largest)
      "#fff59d", // 10th - Light yellow (smallest value)
      "#fff9c4", // 11th - Pale yellow (fallback/extra)
    ],
  },
};

// ADD THIS: getThemeNames function for the ColorPicker component
export const getThemeNames = (): Array<{ key: ThemeKey; name: string }> => {
  return Object.entries(COLOR_THEMES).map(([key, theme]) => ({
    key: key as ThemeKey,
    name: theme.name,
  }));
};

export const getValueRanks = (values: number[]): number[] => {
  if (!values || values.length === 0) return [];
  
  // Sort by value descending (largest first)
  const sortedIndices = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);
  
  const ranks: number[] = new Array(values.length);
  sortedIndices.forEach((item, rank) => {
    ranks[item.index] = rank;
  });
  
  return ranks;
};

export const getColorsByRank = (values: number[]): string[] => {
  if (!values || values.length === 0) {
    return [];
  }
  
  const ranks = getValueRanks(values);
  const colorCount = Math.min(CHART_COLORS_RANKED.length, values.length);
  
  return ranks.map((rank) => {
    // Ensure we don't go out of bounds
    const colorIndex = Math.min(rank, colorCount - 1);
    return CHART_COLORS_RANKED[colorIndex];
  });
};

// MODIFIED: Updated to handle "سایر" with gray color
export const getRankedColorsForChart = (data: {
  series?: Array<{ name: string; data: number[] }>;
  data?: Array<{ name: string; value: number }>;
  categories?: string[];
}): string[] => {
  const GRAY_COLOR = "#b8b9b9";

  const isOthers = (name: string): boolean => {
    const normalized = String(name || "").trim().toLowerCase();

    return (
      normalized === "سایر" ||
      normalized === "سائر" ||
      normalized === "others" ||
      normalized === "other"
    );
  };

  // =========================================================
  // PIE / SIMPLE DATA
  // =========================================================
  if (data.data && data.data.length > 0) {
    // Exclude "Others" completely from ranking
    const rankedItems = data.data
      .map((item, index) => ({
        ...item,
        originalIndex: index,
      }))
      .filter((item) => !isOthers(item.name))
      .sort((a, b) => b.value - a.value);

    // Map original index -> ranked color
    const colorByIndex = new Map<number, string>();

    rankedItems.forEach((item, rank) => {
      const colorIndex = Math.min(
        rank,
        CHART_COLORS_RANKED.length - 1,
      );

      colorByIndex.set(
        item.originalIndex,
        CHART_COLORS_RANKED[colorIndex],
      );
    });

    return data.data.map((item, index) => {
      if (isOthers(item.name)) {
        return GRAY_COLOR;
      }

      return colorByIndex.get(index) ?? CHART_COLORS_RANKED[0];
    });
  }

  // =========================================================
  // SERIES DATA
  // =========================================================
  if (data.series && data.series.length > 0) {
    const seriesTotals = data.series.map((series, index) => ({
      name: series.name,
      originalIndex: index,
      total: (series.data || []).reduce(
        (sum, value) =>
          sum +
          (typeof value === "number" && !isNaN(value)
            ? value
            : 0),
        0,
      ),
    }));

    // Again: "Others" must NOT consume a rank
    const rankedSeries = seriesTotals
      .filter((item) => !isOthers(item.name))
      .sort((a, b) => b.total - a.total);

    const colorByIndex = new Map<number, string>();

    rankedSeries.forEach((item, rank) => {
      const colorIndex = Math.min(
        rank,
        CHART_COLORS_RANKED.length - 1,
      );

      colorByIndex.set(
        item.originalIndex,
        CHART_COLORS_RANKED[colorIndex],
      );
    });

    return seriesTotals.map((item) => {
      if (isOthers(item.name)) {
        return GRAY_COLOR;
      }

      return (
        colorByIndex.get(item.originalIndex) ??
        CHART_COLORS_RANKED[0]
      );
    });
  }

  return CHART_COLORS_RANKED.slice(0, 10);
};

export const getRankedColor = (value: number, allValues: number[]): string => {
  if (!allValues || allValues.length === 0) return CHART_COLORS_RANKED[0];
  
  const ranks = getValueRanks(allValues);
  const index = allValues.indexOf(value);
  if (index === -1) return CHART_COLORS_RANKED[0];
  
  const rank = ranks[index];
  const colorIndex = Math.min(rank, CHART_COLORS_RANKED.length - 1);
  return CHART_COLORS_RANKED[colorIndex];
};

export const getThemeColors = (theme: ThemeKey = "default"): string[] => {
  return CHART_COLORS_RANKED;
};