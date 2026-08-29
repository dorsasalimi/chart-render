import type { SankeyDataset } from "../types/charts";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const months = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
];

const reportTypes = [
  {
    code: "ex" as const,
    title: "صادرات",
    direction: "ltr" as const,
    shareColumn: "%GT Total Export",
    labels: {
      trade: "صادرات",
      total: "کل صادرات",
      otherCountries: "سایر کشورها",
      otherChapters: "سایر فصل‌ها",
    },
  },

  {
    code: "im" as const,
    title: "واردات",
    direction: "rtl" as const,
    shareColumn: "%GT Total Import",
    labels: {
      trade: "واردات",
      total: "کل واردات",
      otherCountries: "سایر کشورها",
      otherChapters: "سایر فصل‌ها",
    },
  },
];

const monthlyDatasets: SankeyDataset[] = reportTypes.flatMap((type) =>
    months.map((month, index) => ({
      ...type,

      labels: {
        ...type.labels,
      },

      month,

      monthNumber: index + 1,

      title: `گزارش ${type.title} ${month}`,

      csvUrl: `${basePath}/sankeydata/${type.code}-${String(
        index + 1,
      ).padStart(2, "0")}.csv`,
    })),
  );

const annualDatasets: SankeyDataset[] = reportTypes.map((type) => ({
  ...type,
  labels: { ...type.labels },
  year: "۱۴۰۴",
  topCountries: 5,
  topChaptersPerCountry: 3,
  title: `گزارش کل ${type.title} سال ۱۴۰۴`,
  csvUrl: `${basePath}/${type.code}-1404.csv`,
}));

export const sankeyDatasets: SankeyDataset[] = [
  ...monthlyDatasets,
  ...annualDatasets,
];
