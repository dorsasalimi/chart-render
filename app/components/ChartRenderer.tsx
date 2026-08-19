// components/ChartRenderer.tsx
"use client";

import type { ChartDefinition } from "../types/charts";
import { ThemeKey } from "../lib/colorThemes";

import LineChart from "./LineChart";
import BarChart from "./BarChart";
import TreemapChart from "./TreemapChart";
import PieChart from "./PieChart";
import LineChartNoCurve from "./LineChartNoCurve";

interface Props {
  chart: ChartDefinition;
  customColors?: string[] | Record<string, string>;
  theme?: ThemeKey;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  useCurvedLine?: boolean;
  showConnectors?: boolean;
}

export default function ChartRenderer({ 
  chart, 
  customColors, 
  theme = "default",
  height = 420,
  showLegend = true,
  showLabels = true,
  useCurvedLine = true,
  showConnectors = true
}: Props) {
  // Validate chart exists
  if (!chart || typeof chart !== 'object') {
    return (
      <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">Invalid chart configuration</p>
      </div>
    );
  }

  // Type-safe rendering using type property
  const renderChart = () => {
    // Using type assertion to avoid TypeScript narrowing issues
    const type = (chart as any).type as string;
    
    switch (type) {
      case "line":
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

      case "treemap":
        return (
          <TreemapChart 
            chart={chart as any} 
            customColors={customColors}
            theme={theme}
          />
        );

      case "area":
        return (
          <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
            <p className="text-sm text-[#6B7A73]">Area chart component not implemented</p>
          </div>
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
        return (
          <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
            <p className="text-sm text-[#6B7A73]">Unsupported chart type: {type}</p>
          </div>
        );
    }
  };

  return renderChart();
}