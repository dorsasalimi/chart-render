import type { SankeyDataset } from "../types/charts";

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

    shareColumn:
      "%GT Total Export",

    labels: {
      trade: "صادرات",
      total: "کل صادرات",
      otherCountries:
        "سایر کشورها",
      otherChapters:
        "سایر فصل‌ها",
    },
  },

  {
    code: "im" as const,

    title: "واردات",

    direction: "rtl" as const,

    shareColumn:
      "%GT Total Import",

    labels: {
      trade: "واردات",
      total: "کل واردات",
      otherCountries:
        "سایر کشورها",
      otherChapters:
        "سایر فصل‌ها",
    },
  },
];

export const sankeyDatasets:
  SankeyDataset[] =
  reportTypes.flatMap((type) =>
    months.map(
      (month, index) => ({
        ...type,

        labels: {
          ...type.labels,
        },

        month,

        monthNumber:
          index + 1,

        title:
          `گزارش ${type.title} ${month}`,

        csvUrl:
          `/sankeydata/${type.code}-${String(
            index + 1,
          ).padStart(2, "0")}.csv`,
      }),
    ),
  );
