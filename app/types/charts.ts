export type ChartType =
  | "line"
  | "bar"
  | "area"
  | "treemap"
  | "pie";

export interface SeriesData {
  name: string;
  data: number[];
}

export interface CategoryChart {
  id: string;
  title: string;
  type: "line" | "bar" | "area";
  unit?: string;
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
  | PieChartData;

  export interface ChartSeries {
  name: string;
  data: number[];
}

export interface CategoryChart {
  categories: string[];
  series: ChartSeries[];
  unit?: string;
}

export interface ColorTheme {
  name: string;
  colors: string[];
}