// lib/colorThemes.ts
import { CHART_COLORS } from "./chartTheme";

export const COLOR_THEMES = {
  default: {
    name: "Default",
    colors: CHART_COLORS
  },
  corporate: {
    name: "Corporate",
    colors: ["#1c439c", "#688ec9", "#b4c4da", "#ef4136", "#ee7d7d", "#fac1c0", "#52b787"]
  },
  nature: {
    name: "Nature",
    colors: ["#2ecc71", "#27ae60", "#1abc9c", "#16a085", "#2c3e50", "#3498db", "#2980b9"]
  },
  warm: {
    name: "Warm",
    colors: ["#e74c3c", "#f39c12", "#f1c40f", "#e67e22", "#d35400", "#c0392b", "#a04000"]
  },
  cool: {
    name: "Cool",
    colors: ["#3498db", "#2980b9", "#9b59b6", "#8e44ad", "#34495e", "#2c3e50", "#1a252f"]
  },
  pastel: {
    name: "Pastel",
    colors: ["#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff", "#e8d0ff", "#ffd1dc"]
  },
  monochrome: {
    name: "Monochrome",
    colors: ["#2c3e50", "#34495e", "#7f8c8d", "#95a5a6", "#bdc3c7", "#ecf0f1", "#f5f6f8"]
  },
  vibrant: {
    name: "Vibrant",
    colors: ["#ff6b6b", "#ffa94d", "#fcc419", "#69db7c", "#4dabf7", "#9775fa", "#f06595"]
  },
  ocean: {
    name: "Ocean",
    colors: ["#006064", "#00838f", "#0097a7", "#00acc1", "#26c6da", "#4dd0e1", "#80deea"]
  },
  sunset: {
    name: "Sunset",
    colors: ["#ff6b35", "#ff8c42", "#ffad44", "#ffc857", "#ffd966", "#ffe48a", "#fff0b5"]
  }
};

export type ThemeKey = keyof typeof COLOR_THEMES;

export const getThemeColors = (themeKey: ThemeKey = "default"): string[] => {
  return COLOR_THEMES[themeKey]?.colors || CHART_COLORS;
};

export const getThemeNames = (): { key: ThemeKey; name: string }[] => {
  return Object.entries(COLOR_THEMES).map(([key, theme]) => ({
    key: key as ThemeKey,
    name: theme.name
  }));
};