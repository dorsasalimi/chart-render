// components/ChartRenderer.tsx
"use client";

import type { ChartDefinition } from "../types/charts";
import { ThemeKey } from "../lib/colorThemes";

import LineChart from "./LineChart";
import BarChart from "./BarChart";
import TreemapChart from "./AreaChart";
import PieChart from "./PieChart";

interface Props {
  chart: ChartDefinition;
  customColors?: string[] | Record<string, string>;
  theme?: ThemeKey;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
}

export default function ChartRenderer({ 
  chart, 
  customColors, 
  theme = "default",
  height = 420,
  showLegend = true,
  showLabels = true
}: Props) {
  switch (chart.type) {
    case "line":
      return (
        <LineChart 
          chart={chart} 
          customColors={customColors}
          theme={theme}
          height={height}
          showLegend={showLegend}
          showLabels={showLabels}
        />
      );

    case "bar":
      return (
        <BarChart 
          chart={chart} 
          customColors={customColors}
          theme={theme}
        />
      );

    case "treemap":
      return (
        <TreemapChart 
          chart={chart} 
          customColors={customColors}
          theme={theme}
        />
      );

    case "pie":
      return (
        <PieChart 
          chart={chart} 
          customColors={customColors}
          theme={theme}
        />
      );

    default:
      return null;
  }
}