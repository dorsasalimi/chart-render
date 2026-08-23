// lib/colorThemes.ts

import { CHART_COLORS } from "./chartTheme";

export type ThemeKey = "default" | "dark" | "light";

/**
 * Fixed chart colors with ranking system.
 * Colors are assigned based on data rank (largest to smallest).
 */
export const CHART_COLORS_RANKED = [
  "#1c439c", // 1 - largest (blue)
  "#688ec9", // 2 (light blue)
  "#b4c4da", // 3 (pale blue)
  "#ef4136", // 4 (red)
  "#ee7d7d", // 5 (light red)
  "#fac1c0", // 6 (pale red)
  "#52b787", // 7 (green)
  "#91cfab", // 8 (light green)
  "#d3ebdb", // 9 (pale green)
  "#f3b71a", // 10 (yellow)
  "#ffd694", // 11 (pale yellow)
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
      "#4fc3f7",
      "#81d4fa",
      "#b3e5fc",
      "#ff8a65",
      "#ffab91",
      "#ffccbc",
      "#81c784",
      "#a5d6a7",
      "#c8e6c9",
      "#ffd54f",
      "#ffe082",
    ],
  },
  light: {
    name: "Light",
    colors: [
      "#90caf9",
      "#bbdefb",
      "#e3f2fd",
      "#ef9a9a",
      "#ef9a9a",
      "#ffcdd2",
      "#a5d6a7",
      "#c8e6c9",
      "#e8f5e9",
      "#fff59d",
      "#fff9c4",
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

// The rest of your code remains the same...
export const getValueRanks = (values: number[]): number[] => {
  if (!values || values.length === 0) return [];
  
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
    const colorIndex = Math.min(rank, colorCount - 1);
    return CHART_COLORS_RANKED[colorIndex];
  });
};

export const getRankedColorsForChart = (data: {
  series?: Array<{ name: string; data: number[] }>;
  data?: Array<{ name: string; value: number }>;
  categories?: string[];
}): string[] => {
  if (data.data && data.data.length > 0) {
    const values = data.data.map(item => item.value);
    return getColorsByRank(values);
  }
  
  if (data.series && data.series.length > 0) {
    const allValues: number[] = [];
    data.series.forEach(series => {
      if (series.data && series.data.length > 0) {
        series.data.forEach(val => {
          if (typeof val === 'number' && !isNaN(val)) {
            allValues.push(val);
          }
        });
      }
    });
    
    if (allValues.length > 0) {
      const seriesTotals = data.series.map(series => {
        const total = series.data.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
        return { name: series.name, total };
      });
      
      const totals = seriesTotals.map(item => item.total);
      const ranks = getValueRanks(totals);
      
      return ranks.map((rank) => {
        const colorIndex = Math.min(rank, CHART_COLORS_RANKED.length - 1);
        return CHART_COLORS_RANKED[colorIndex];
      });
    }
    
    return data.series.map((_, index) => {
      return CHART_COLORS_RANKED[index % CHART_COLORS_RANKED.length];
    });
  }
  
  return CHART_COLORS_RANKED.slice(0, 11);
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