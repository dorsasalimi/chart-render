// types/charts.ts

export type ChartType =
  | "line"
  | "bar"
  | "area"
  | "treemap"
  | "pie"
  | "sankey";

export interface SankeyLabels {
  trade: string;
  total: string;
  otherCountries: string;
  otherChapters: string;
}

export interface SankeyDataset {
  code: "ex" | "im";
  title: string;
  direction: "ltr" | "rtl";
  shareColumn: string;
  labels: SankeyLabels;
  month?: string;
  monthNumber?: number;
  csvUrl: string;
}

export interface SankeyChartDefinition {
  id: string;
  title: string;
  type: "sankey";
  dataset: SankeyDataset;
}

export interface SeriesData {
  name: string;
  data: number[];
  rawData?: number[];
}

export interface CategoryChart {
  id: string;
  title: string;
  type: "line" | "bar" | "area";
  variant?: string;
  unit?: string;
  rawUnit?: string;
  categories: string[];
  series: SeriesData[];
}

export interface TreeMapItem {
  name: string;
  value?: number;
  children?: TreeMapItem[];
}

export interface TreemapChart {
  id: string;
  title: string;
  type: "treemap";
  unit?: string;
  data: TreeMapItem[];
}

export interface PieItem {
  name: string;
  value: number;
}

export interface PieChartData {
  id: string;
  title: string;
  type: "pie";
  unit?: string;
  data: PieItem[];
}

export type ChartDefinition =
  | CategoryChart
  | TreemapChart
  | PieChartData
  | SankeyChartDefinition;

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ColorTheme {
  name: string;
  colors: string[];
}
