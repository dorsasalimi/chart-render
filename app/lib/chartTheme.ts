// lib/chartTheme.ts

export const CHART_COLORS = [
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

export const chartTheme = {
  color: CHART_COLORS,
  textStyle: {
    fontFamily: "inherit",
  },
  tooltip: {
    trigger: "axis",
  },
  animationDuration: 600,
};