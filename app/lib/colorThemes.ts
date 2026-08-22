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

/**
 * Gets the rank of each value (0 = largest).
 * 
 * @example
 * getValueRanks([100, 50, 80]) // returns [0, 2, 1]
 */
export const getValueRanks = (values: number[]): number[] => {
  if (!values || values.length === 0) return [];
  
  // Create array of indices and sort by value descending
  const sortedIndices = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);
  
  // Assign ranks based on sorted order
  const ranks: number[] = new Array(values.length);
  sortedIndices.forEach((item, rank) => {
    ranks[item.index] = rank;
  });
  
  return ranks;
};

/**
 * Gets fixed colors based on data rank (largest gets first color).
 * 
 * @example
 * getColorsByRank([100, 50, 80])
 * // returns ["#1c439c", "#688ec9", "#688ec9"]
 * // (100 gets blue, 80 gets light blue, 50 gets light blue)
 */
export const getColorsByRank = (values: number[]): string[] => {
  if (!values || values.length === 0) {
    return [];
  }
  
  const ranks = getValueRanks(values);
  const colorCount = Math.min(CHART_COLORS_RANKED.length, values.length);
  
  return ranks.map((rank) => {
    // Ensure we don't exceed available colors
    const colorIndex = Math.min(rank, colorCount - 1);
    return CHART_COLORS_RANKED[colorIndex];
  });
};

/**
 * Gets colors for chart data with ranking.
 * Handles both single series and multiple series.
 */
export const getRankedColorsForChart = (data: {
  series?: Array<{ name: string; data: number[] }>;
  data?: Array<{ name: string; value: number }>;
  categories?: string[];
}): string[] => {
  // Handle pie chart data
  if (data.data && data.data.length > 0) {
    const values = data.data.map(item => item.value);
    return getColorsByRank(values);
  }
  
  // Handle category chart (bar, line, etc.)
  if (data.series && data.series.length > 0) {
    // Get all values from all series
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
    
    // If we have values, get ranks
    if (allValues.length > 0) {
      // For each series, determine its rank based on its total
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
    
    // Fallback: assign colors based on series order
    return data.series.map((_, index) => {
      return CHART_COLORS_RANKED[index % CHART_COLORS_RANKED.length];
    });
  }
  
  // Fallback
  return CHART_COLORS_RANKED.slice(0, 11);
};

/**
 * Gets a single color for a value based on its rank.
 */
export const getRankedColor = (value: number, allValues: number[]): string => {
  if (!allValues || allValues.length === 0) return CHART_COLORS_RANKED[0];
  
  const ranks = getValueRanks(allValues);
  const index = allValues.indexOf(value);
  if (index === -1) return CHART_COLORS_RANKED[0];
  
  const rank = ranks[index];
  const colorIndex = Math.min(rank, CHART_COLORS_RANKED.length - 1);
  return CHART_COLORS_RANKED[colorIndex];
};

/**
 * Get theme colors (for backward compatibility)
 */
export const getThemeColors = (theme: ThemeKey = "default"): string[] => {
  return CHART_COLORS_RANKED;
};