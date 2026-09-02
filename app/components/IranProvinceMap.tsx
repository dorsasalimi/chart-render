"use client";

import { useEffect, useMemo, useState } from "react";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";

const MAP_NAME = "iran-provinces";
const MAP_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/maps/iran-provinces.geojson`;

const MAP_COLORS = [
  "#f0f2f6",
  "#d8dfe9",
  "#b2c0d2",
  "#8ba0ba",
  "#55759e",
  "#244a7e",
] as const;

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export interface IranProvinceValue {
  name: string;
  value: number;
  nameFa?: string;
}

export interface IranProvinceMapProps {
  data: IranProvinceValue[];
  title?: string;
  unit?: string;
  height?: number;
  showTooltip?: boolean;
}

export const IRAN_PROVINCE_NAMES = [
  "Alborz",
  "Ardabil",
  "Bushehr",
  "Chaharmahal and Bakhtiyari",
  "East Azerbaijan",
  "Fars",
  "Gilan",
  "Golestan",
  "Hamadan",
  "Hormozgan",
  "Ilam",
  "Isfahan",
  "Kerman",
  "Kermanshah",
  "Khuzestan",
  "Kohgiluye and Buyer Ahmad",
  "Kurdistan",
  "Lorestan",
  "Markazi",
  "Mazandaran",
  "North Khorasan",
  "Qazvin",
  "Qom",
  "Razavi Khorasan",
  "Semnan",
  "Sistan and Baluchestan",
  "South Khorasan",
  "Tehran",
  "West Azerbaijan",
  "Yazd",
  "Zanjan",
] as const;

type IranGeoJson = Parameters<typeof echarts.registerMap>[1];

function toPersianDigits(value: string | number) {
  return String(value).replace(
    /\d/g,
    (digit) => PERSIAN_DIGITS[Number(digit)],
  );
}

function formatValue(value: number) {
  return toPersianDigits(
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value),
  );
}

function getLabelColor(value: number, min: number, max: number) {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const scaled = ratio * (MAP_COLORS.length - 1);
  const lower = MAP_COLORS[Math.floor(scaled)];
  const upper = MAP_COLORS[Math.min(Math.ceil(scaled), MAP_COLORS.length - 1)];
  const mix = scaled - Math.floor(scaled);

  const rgb = [1, 3, 5].map((offset) =>
    Math.round(
      parseInt(lower.slice(offset, offset + 2), 16) * (1 - mix) +
        parseInt(upper.slice(offset, offset + 2), 16) * mix,
    ),
  );
  const luminance = rgb
    .map((channel) => channel / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    )
    .reduce(
      (total, channel, index) =>
        total + channel * [0.2126, 0.7152, 0.0722][index],
      0,
    );

  return luminance < 0.42 ? "#ffffff" : "#1d3b68";
}

export default function IranProvinceMap({
  data,
  title = "ارزش صادرات گمرک‌های استان‌ها",
  unit = "میلیون دلار",
  height = 650,
  showTooltip = true,
}: IranProvinceMapProps) {
  const [isMapReady, setIsMapReady] = useState(
    Boolean(echarts.getMap(MAP_NAME)),
  );

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (echarts.getMap(MAP_NAME)) {
      return;
    }

    const controller = new AbortController();

    const loadMap = async () => {
      try {
        const response = await fetch(MAP_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Map request failed: ${response.status}`,
          );
        }

        const geoJson = (await response.json()) as IranGeoJson;

        echarts.registerMap(MAP_NAME, geoJson);

        setIsMapReady(true);
        setLoadError(false);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Iran map loading failed:", error);
        setLoadError(true);
      }
    };

    loadMap();

    return () => controller.abort();
  }, []);

  const option = useMemo(() => {
    const numericValues = data
      .map((item) => Number(item.value))
      .filter(Number.isFinite);

    const min =
      numericValues.length > 0
        ? Math.min(...numericValues)
        : 0;

    const maxValue =
      numericValues.length > 0
        ? Math.max(...numericValues)
        : 1;

    const max =
      min === maxValue
        ? min + 1
        : maxValue;

    const mapData = data.map((item) => ({
      ...item,
      label: {
        color: Number.isFinite(Number(item.value))
          ? getLabelColor(Number(item.value), min, max)
          : "#1d3b68",
        rotate:
          item.name === "West Azerbaijan" || item.name === "Bushehr"
            ? -70
            : 0,
      },
    }));

    return {
      animation: false,

      tooltip: {
        show: showTooltip,
        trigger: "item",
        confine: true,

        backgroundColor: "rgba(255,255,255,0.98)",

        borderWidth: 0,

        padding: [10, 12],

        textStyle: {
          color: "#1d3b68",
          fontFamily: "Epsilon",
          fontSize: 14,
        },

        extraCssText:
          "border-radius:10px;" +
          "box-shadow:0 8px 26px rgba(26,55,96,.15);" +
          "direction:rtl;" +
          "text-align:right;",

        formatter: (params: {
          name?: string;
          value?: number;
          data?: {
            nameFa?: string;
          };
        }) => {
          const value = Number(params.value);

          const provinceName =
            params.data?.nameFa ||
            params.name ||
            "";

          const displayValue = Number.isFinite(value)
            ? formatValue(value)
            : "بدون داده";

          return `
            <div
              style="
                direction:rtl;
                text-align:right;
                font-family:Epsilon;
                line-height:1.8;
              "
            >
              <strong>${provinceName}</strong>
              <br />
              ${displayValue}${
                Number.isFinite(value) && unit
                  ? ` ${unit}`
                  : ""
              }
            </div>
          `;
        },
      },

      visualMap: {
        show: false,

        min,
        max,

        calculable: false,

        inRange: {
          color: MAP_COLORS,
        },

        outOfRange: {
          color: "#eef1f5",
        },
      },

      series: [
        {
          type: "map",

          map: MAP_NAME,

          name: title,

          data: mapData,

          roam: false,

          selectedMode: false,

          // -------------------------------------------------------
          // Do NOT distort the geographic aspect ratio.
          // ECharts should preserve the actual GeoJSON proportions.
          // -------------------------------------------------------
          aspectScale: 0.88,

          // Slightly move the map upward so the southern coastline
          // has enough breathing room.
          layoutCenter: [
            "50%",
            "48%",
          ],

          // The previous 88% was too aggressive for this geometry.
          // 78% gives the irregular southern coastline enough space.
          layoutSize: "78%",

          // Your GeoJSON contains this property:
          // properties["name:en"]
          nameProperty: "name:en",

          itemStyle: {
            areaColor: "#eef1f5",

            // White province boundaries give a much cleaner
            // cartographic appearance than dark blue borders.
            borderColor: "#1d3767",

            borderWidth: 1.2,

            borderType: "solid",
          },

          label: {
            show: true,

            color: "#1d3b68",

            fontFamily: "Epsilon",

            fontSize: 20,


            formatter: (params: {
              value?: number;
            }) => {
              const value = Number(params.value);

              if (!Number.isFinite(value)) {
                return "";
              }

              return formatValue(value);
            },
          },

          // Important for the southern provinces:
          //
          // We do NOT use moveOverlap: "shiftY".
          //
          // Shifting map labels can make labels appear visually
          // disconnected from their actual province, especially
          // around Hormozgan / Bushehr / Sistan and Baluchestan.
          labelLayout: (params: { dataIndex?: number }) => {
            const province =
              params.dataIndex === undefined
                ? undefined
                : mapData[params.dataIndex];

            return {
              hideOverlap: true,
              dx: province?.name === "Markazi" ? -8 : province?.name === "Tehran" ? -11 : 0,
              dy:
                province?.name === "Markazi"
                  ? 8
                  : province?.name === "Tehran"
                    ? -2
                    : 0,
            };
          },

          emphasis: {
            disabled: false,

            itemStyle: {
              areaColor: "#244a7e",

              borderColor: "#ffffff",

              borderWidth: 1.5,
            },

            label: {
              show: true,

              color: "#ffffff",

              fontFamily: "Epsilon",

              fontSize: 20,

              fontWeight: 500,
            },
          },
        },
      ],
    };
  }, [data, showTooltip, title, unit]);

  if (loadError) {
    return (
      <div
        className="
          flex
          min-h-80
          items-center
          justify-center
          rounded-2xl
          bg-[#f7f8fa]
          text-sm
          text-[#6b7a8e]
        "
        style={{
          fontFamily: "Epsilon",
        }}
      >
        نقشه ایران بارگذاری نشد.
      </div>
    );
  }

  return (
    <figure
      data-echarts-container
      data-chart-export-transparent="true"
      className="m-0 w-full bg-white"
      dir="rtl"
    >
      <div
        className="relative w-full"
        style={{
          height,
        }}
      >
        {isMapReady ? (
          <ReactECharts
            option={option}
            notMerge
            lazyUpdate={false}
            style={{
              width: "100%",
              height: "100%",
            }}
            opts={{
              renderer: "svg",
            }}
          />
        ) : (
          <div
            className="
              flex
              h-full
              items-center
              justify-center
              text-sm
              text-[#6b7a8e]
            "
            style={{
              fontFamily: "Epsilon",
            }}
          >
            در حال بارگذاری نقشه…
          </div>
        )}
      </div>
    </figure>
  );
}
