"use client";

import type {
  ChartDefinition,
  SankeyChartDefinition,
} from "../types/charts";

import BarChart from "./BarChart";
import StackedPercentBarChart from "./StackedPercentBarChart";
import TreemapChart from "./TreemapChart";
import PieChart from "./PieChart";
import PieChartMahsa from "./PieChartMahsa";
import LineChartNoCurve from "./LineChartNoCurve";
import SankeyChart from "./SankeyChart";
import AnnualSankeyChart from "./AnnualSankeyChart";
import MonthlyTradeChart from "./MonthlyTradeChart";
import AgriculturalTradeChart from "./AgriculturalTradeChart";

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
      /*
       * ==========================================
       * AGRICULTURAL TRADE
       * ==========================================
       */
      case "agriculturalTrade":
        return (
          <AgriculturalTradeChart
            data={(chart as any).data}
          />
        );

      /*
       * ==========================================
       * MONTHLY TRADE
       * ==========================================
       */
      case "monthlyTrade":
        return (
          <MonthlyTradeChart
            imports={(chart as any).imports}
            exports={(chart as any).exports}
            balance={(chart as any).balance}
          />
        );

      /*
       * ==========================================
       * LINE
       * ==========================================
       */
      case "line":
        return (
          <LineChartNoCurve
            chart={chart as any}
            dashedSeries={[
              "تراز تجاری وزنی",
              "تراز تجاری",
            ]}
            height={310}
            showLegend={true}
            showLabels={true}
          />
        );

      /*
       * ==========================================
       * BAR
       * ==========================================
       */
      case "bar":
        if ((chart as any).variant === "stackedPercent") {
          return (
            <StackedPercentBarChart
              chart={chart as any}
            />
          );
        }

        return <BarChart chart={chart as any} />;

      /*
       * ==========================================
       * TREEMAP
       * ==========================================
       */
      case "treemap":
        return (
          <TreemapChart
            chart={chart as any}
          />
        );

      /*
       * ==========================================
       * AREA
       * ==========================================
       */
      case "area":
        return (
          <div className="flex items-center justify-center h-[420px] bg-[#F7F9F8] rounded-lg">
            <p className="text-sm text-[#6B7A73]">
              Area chart component not implemented
            </p>
          </div>
        );

      /*
       * ==========================================
       * PIE
       * ==========================================
       */
      case "pie":
        if ((chart as any).variant === "mahsa") {
          return (
            <PieChartMahsa
              chart={chart as any}
            />
          );
        }

        return (
          <PieChart
            chart={chart as any}
          />
        );

      /*
       * ==========================================
       * SANKEY
       * ==========================================
       */
      case "sankey": {
        const sankeyChart =
          chart as SankeyChartDefinition;

        if (sankeyChart.dataset.year) {
          return (
            <AnnualSankeyChart
              chartId={`annual-sankey-chart-${chart.id}`}
              dataset={sankeyChart.dataset}
              topCountries={
                sankeyChart.dataset.topCountries
              }
              topChaptersPerCountry={
                sankeyChart.dataset
                  .topChaptersPerCountry
              }
            />
          );
        }

        return (
          <SankeyChart
            chartId={`sankey-chart-${chart.id}`}
            dataset={sankeyChart.dataset}
            topCountries={
              sankeyChart.dataset.topCountries
            }
            topChaptersPerCountry={
              sankeyChart.dataset
                .topChaptersPerCountry
            }
          />
        );
      }

      /*
       * ==========================================
       * DEFAULT
       * ==========================================
       */
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
