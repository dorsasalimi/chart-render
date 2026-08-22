"use client";

import type { ChartDefinition } from "../types/charts";

import BarChart from "./BarChart";
import TreemapChart from "./TreemapChart";
import PieChart from "./PieChart";
import LineChartNoCurve from "./LineChartNoCurve";

interface Props {
  chart: ChartDefinition;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  useCurvedLine?: boolean;
  showConnectors?: boolean;
}

export default function ChartRenderer({
  chart,
  height = 420,
  showLegend = true,
  showLabels = true,
  useCurvedLine = true,
  showConnectors = true,
}: Props) {
  if (!chart || typeof chart !== "object") {
    return (
      <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
        <p className="text-sm text-[#6B7A73]">
          Invalid chart configuration
        </p>
      </div>
    );
  }

  const renderChart = () => {
    const type = (chart as any).type as string;

    switch (type) {
      case "line":
        return (
          <LineChartNoCurve
            chart={chart as any}
            height={height}
            showLegend={showLegend}
            showLabels={showLabels}
          />
        );

      case "bar":
        return (
          <BarChart
            chart={chart as any}
          />
        );

      case "treemap":
        return (
          <TreemapChart
            chart={chart as any}
          />
        );

      case "area":
        return (
          <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
            <p className="text-sm text-[#6B7A73]">
              Area chart component not implemented
            </p>
          </div>
        );

      case "pie":
        return (
          <PieChart
            chart={chart as any}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
            <p className="text-sm text-[#6B7A73]">
              Unsupported chart type: {type}
            </p>
          </div>
        );
    }
  };

  return renderChart();
}