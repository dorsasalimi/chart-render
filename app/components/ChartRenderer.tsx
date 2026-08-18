// components/ChartRenderer.tsx
"use client";

import type { ChartDefinition } from "../types/charts";
import { ThemeKey } from "../lib/colorThemes";

import LineChart from "./LineChart";
import BarChart from "./BarChart";
import AreaChart from "./AreaChart";
import PieChart from "./PieChart";
// Import the new LineChart without curves
import LineChartNoCurve from "./LineChartNoCurve";
// Import a proper TreemapChart if you have one
// import TreemapChart from "./TreemapChart";

interface Props {
  chart: ChartDefinition;
  customColors?: string[] | Record<string, string>;
  theme?: ThemeKey;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  useCurvedLine?: boolean; // Prop to control line curve
}

export default function ChartRenderer({ 
  chart, 
  customColors, 
  theme = "default",
  height = 420,
  showLegend = true,
  showLabels = true,
  useCurvedLine = true // Default to curved for existing charts
}: Props) {
  switch (chart.type) {
    case "line":
      // Use the no-curve version if explicitly requested
      if (!useCurvedLine) {
        return (
          <LineChartNoCurve 
            chart={chart as any} 
            customColors={customColors}
            theme={theme}
          />
        );
      }
      return (
        <LineChart 
          chart={chart as any} 
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
          chart={chart as any} 
          customColors={customColors}
          theme={theme}
        />
      );

    case "area":
      return (
        <AreaChart 
          chart={chart as any} 
          customColors={customColors}
          theme={theme}
        />
      );

    case "pie":
      return (
        <PieChart 
          chart={chart as any} 
          customColors={customColors}
          theme={theme}
        />
      );

    default:
      return null;
  }
}