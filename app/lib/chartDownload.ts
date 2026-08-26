import * as echarts from "echarts";
import jsPDF from "jspdf";
import * as fontkit from "fontkit";

export type DownloadFormat =
  | "png"
  | "jpg"
  | "svg"
  | "pdf";

const DOWNLOAD_WIDTH = 380;
const DOWNLOAD_HEIGHT = 230;
const BAR_LEGEND_WIDTH = 220;

const EXPORT_PIXEL_RATIO = 3;

const BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_PATH || "";

const FONT_PATH =
  `${BASE_PATH}/fonts/w_Epsilon.ttf`;

/* =========================================================
   File helpers
========================================================= */

const sanitizeFileName = (
  name: string,
) => {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

const getChartInstance = (
  chartElement: HTMLElement,
) => {
  const echartsDom =
    chartElement.querySelector(
      "[data-echarts-instance]",
    ) as HTMLElement | null;

  if (!echartsDom) {
    console.error(
      "ECharts DOM element not found",
    );

    return null;
  }

  const chartInstance =
    echarts.getInstanceByDom(
      echartsDom,
    );

  if (!chartInstance) {
    console.error(
      "ECharts instance not found",
    );

    return null;
  }

  return chartInstance;
};

/* =========================================================
   Download helper
========================================================= */

const downloadBlob = (
  blob: Blob,
  fileName: string,
) => {
  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(
    link,
  );

  link.click();

  document.body.removeChild(
    link,
  );

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

/* =========================================================
   Fontkit loader
========================================================= */

let cachedFont: any = null;

const loadFont = async () => {
  if (cachedFont) {
    return cachedFont;
  }

  const response =
    await fetch(FONT_PATH);

  if (!response.ok) {
    throw new Error(
      `Failed to load font from ${FONT_PATH}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer =
    await response.arrayBuffer();

  const nodeBuffer =
    Buffer.from(buffer);

  cachedFont =
    fontkit.create(nodeBuffer);

  return cachedFont;
};

/* =========================================================
   SVG helpers
========================================================= */

const SVG_NS =
  "http://www.w3.org/2000/svg";

const getNumericAttribute = (
  element: Element,
  attribute: string,
  fallback = 0,
) => {
  const value =
    parseFloat(
      element.getAttribute(
        attribute,
      ) || "",
    );

  return Number.isFinite(value)
    ? value
    : fallback;
};

/* =========================================================
   BiDi helpers
========================================================= */

interface TextRun {
  text: string;
  isRTL: boolean;
  isNumeric: boolean;
}

const tokenizeBidiString = (
  input: string,
): TextRun[] => {
  const tokens =
    input.match(
      /[0-9\u0660-\u0669\u06F0-\u06F9.,٫٬%٪+\-–\/\\:]+|[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+|[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF0-9\u0660-\u0669\u06F0-\u06F9]+/g,
    ) || [input];

  return tokens.map(
    (token) => {
      const isNumeric =
        /^[\s0-9\u0660-\u0669\u06F0-\u06F9.,٫٬%٪+\-–\/\\:]+$/.test(
          token,
        );

      const hasPersian =
        /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
          token,
        );

      return {
        text: token,
        isNumeric,
        isRTL:
          hasPersian &&
          !isNumeric,
      };
    },
  );
};

/* =========================================================
   Font-size helpers
========================================================= */

const getFontSizeFromElement = (
  textNode: SVGTextElement,
  fallback = 30,
): number => {
  const attrSize =
    textNode.getAttribute(
      "font-size",
    );

  if (attrSize) {
    const parsed =
      parseFloat(attrSize);

    if (
      !Number.isNaN(parsed) &&
      parsed > 0
    ) {
      return parsed;
    }
  }

  const styleSize =
    textNode.style.fontSize;

  if (styleSize) {
    const parsed =
      parseFloat(styleSize);

    if (
      !Number.isNaN(parsed) &&
      parsed > 0
    ) {
      return parsed;
    }
  }

  try {
    const computed =
      window.getComputedStyle(
        textNode,
      );

    const computedSize =
      parseFloat(
        computed.fontSize,
      );

    if (
      !Number.isNaN(
        computedSize,
      ) &&
      computedSize > 0
    ) {
      return computedSize;
    }
  } catch {
    // Use fallback.
  }

  let parent =
    textNode.parentElement;

  while (parent) {
    const parentSize =
      parent.getAttribute(
        "font-size",
      );

    if (parentSize) {
      const parsed =
        parseFloat(parentSize);

      if (
        !Number.isNaN(parsed) &&
        parsed > 0
      ) {
        return parsed;
      }
    }

    parent =
      parent.parentElement;
  }

  return fallback;
};

const getDominantFontSize = (
  svgElement: SVGSVGElement,
  fallback = 30,
): number => {
  const textElements =
    svgElement.querySelectorAll(
      "text",
    );

  if (
    textElements.length === 0
  ) {
    return fallback;
  }

  const sizes: number[] = [];

  for (
    const textEl of
    Array.from(textElements)
  ) {
    const size =
      getFontSizeFromElement(
        textEl as SVGTextElement,
        fallback,
      );

    if (size > 0) {
      sizes.push(size);
    }
  }

  if (
    sizes.length === 0
  ) {
    return fallback;
  }

  const frequency:
    Record<number, number> = {};

  for (const size of sizes) {
    frequency[size] =
      (frequency[size] || 0) +
      1;
  }

  let maxCount = 0;
  let dominantSize = sizes[0];

  for (
    const [size, count] of
    Object.entries(frequency)
  ) {
    if (count > maxCount) {
      maxCount = count;

      dominantSize =
        parseFloat(size);
    }
  }

  return dominantSize;
};

/* =========================================================
   Preserve original browser text geometry
========================================================= */

const preserveTextGeometry = (
  sourceSvg: SVGSVGElement,
  cloneSvg: SVGSVGElement,
) => {
  const sourceTextNodes =
    Array.from(
      sourceSvg.querySelectorAll(
        "text",
      ),
    ) as SVGTextElement[];

  const clonedTextNodes =
    Array.from(
      cloneSvg.querySelectorAll(
        "text",
      ),
    ) as SVGTextElement[];

  sourceTextNodes.forEach(
    (
      sourceText,
      index,
    ) => {
      const clonedText =
        clonedTextNodes[index];

      if (!clonedText) {
        return;
      }

      try {
        const bbox =
          sourceText.getBBox();

        const computed =
          window.getComputedStyle(
            sourceText,
          );

        clonedText.setAttribute(
          "data-export-bbox-x",
          String(bbox.x),
        );

        clonedText.setAttribute(
          "data-export-bbox-y",
          String(bbox.y),
        );

        clonedText.setAttribute(
          "data-export-bbox-width",
          String(bbox.width),
        );

        clonedText.setAttribute(
          "data-export-bbox-height",
          String(bbox.height),
        );

        if (
          computed.fontSize
        ) {
          clonedText.setAttribute(
            "font-size",
            computed.fontSize,
          );
        }

        if (
          computed.fontFamily
        ) {
          clonedText.setAttribute(
            "font-family",
            computed.fontFamily,
          );
        }

        if (
          computed.fontWeight
        ) {
          clonedText.setAttribute(
            "font-weight",
            computed.fontWeight,
          );
        }

        const anchor =
          sourceText.getAttribute(
            "text-anchor",
          ) ||
          computed.textAnchor ||
          "start";

        clonedText.setAttribute(
          "text-anchor",
          anchor,
        );

        const baseline =
          sourceText.getAttribute(
            "dominant-baseline",
          );

        if (baseline) {
          clonedText.setAttribute(
            "dominant-baseline",
            baseline,
          );
        }
      } catch {
        // Ignore unsupported getBBox cases.
      }
    },
  );
};

/* =========================================================
   Legend extraction
========================================================= */

interface LegendItemData {
  name: string;
  color: string;
}

const extractLegendData = (
  chartElement: HTMLElement,
): LegendItemData[] => {
  const legendContainer =
    chartElement.querySelector(
      '[data-chart-custom-legend="true"]',
    );

  if (!legendContainer) {
    return [];
  }

  const buttons =
    Array.from(
      legendContainer.querySelectorAll(
        "button",
      ),
    );

  return buttons
    .map((button) => {
      const colorEl =
        button.querySelector(
          "span[style*='background-color']",
        );

      const spans =
        Array.from(
          button.querySelectorAll(
            "span",
          ),
        );

      const labelEl =
        spans.find(
          (span) =>
            span !== colorEl,
        );

      const color =
        (
          colorEl as HTMLElement
        )?.style
          ?.backgroundColor ||
        "#2B9E65";

      const name =
        labelEl?.textContent
          ?.trim() || "";

      return {
        name,
        color,
      };
    })
    .filter(
      (item) =>
        item.name.length > 0,
    );
};

/* =========================================================
   Accurate font width
========================================================= */

const measureTextWidth = (
  text: string,
  font: any,
  fontSize: number,
): number => {
  if (!text) {
    return 0;
  }

  const unitsPerEm =
    font.unitsPerEm || 1000;

  const scale =
    fontSize / unitsPerEm;

  const tokens =
    tokenizeBidiString(text);

  const containsRTL =
    tokens.some(
      (token) =>
        token.isRTL,
    );

  const containsOnlyNumeric =
    tokens.every(
      (token) =>
        token.isNumeric ||
        !token.text.trim(),
    );

  const orderedTokens =
    containsRTL &&
    !containsOnlyNumeric
      ? [...tokens].reverse()
      : tokens;

  let totalWidth = 0;

  for (
    const token of
    orderedTokens
  ) {
    let features:
      any = undefined;

    let script:
      string | undefined =
      undefined;

    let direction:
      "rtl" | "ltr" =
      "ltr";

    if (token.isNumeric) {
      direction = "ltr";
    } else if (token.isRTL) {
      script = "arab";
      direction = "rtl";

      features = {
        init: true,
        medi: true,
        fina: true,
        isol: true,
        liga: true,
        calt: true,
      };
    }

    const run =
      font.layout(
        token.text,
        features,
        script,
        undefined,
        direction,
      );

    const glyphs =
      run.glyphs || [];

    const positions =
      run.positions || [];

    for (
      let i = 0;
      i < glyphs.length;
      i++
    ) {
      totalWidth +=
        (
          positions[i]
            ?.xAdvance ??
          glyphs[i]
            ?.advanceWidth ??
          0
        ) *
        scale;
    }
  }

  return totalWidth;
};

/* =========================================================
   Text -> glyph outlines
========================================================= */

const textElementToPaths = (
  textNode: SVGTextElement,
  font: any,
): SVGPathElement[] => {
  const rawText =
    textNode.textContent ||
    "";

  if (!rawText.trim()) {
    return [];
  }

  const fontSize =
    getFontSizeFromElement(
      textNode,
      30,
    );

  const x =
    getNumericAttribute(
      textNode,
      "x",
      0,
    );

  const y =
    getNumericAttribute(
      textNode,
      "y",
      0,
    );

  const computed =
    window.getComputedStyle(
      textNode,
    );

  const textAnchor =
    textNode.getAttribute(
      "text-anchor",
    ) ||
    computed.textAnchor ||
    "start";

  const dominantBaseline =
    textNode.getAttribute(
      "dominant-baseline",
    ) ||
    textNode.style
      .dominantBaseline ||
    computed.dominantBaseline ||
    "auto";

  const fill =
    textNode.getAttribute(
      "fill",
    ) ||
    textNode.style.fill ||
    computed.fill ||
    "#171717";

  const opacity =
    textNode.getAttribute(
      "opacity",
    ) ||
    textNode.style.opacity ||
    computed.opacity;

  const unitsPerEm =
    font.unitsPerEm || 1000;

  const scale =
    fontSize / unitsPerEm;

  const tokens =
    tokenizeBidiString(
      rawText,
    );

  const containsRTL =
    tokens.some(
      (token) =>
        token.isRTL,
    );

  const containsOnlyNumeric =
    tokens.every(
      (token) =>
        token.isNumeric ||
        !token.text.trim(),
    );

  const orderedTokens =
    containsRTL &&
    !containsOnlyNumeric
      ? [...tokens].reverse()
      : tokens;

  const shapedRuns: {
    glyphs: any[];
    positions: any[];
    width: number;
  }[] = [];

  let totalAdvanceWidth = 0;

  for (
    const token of
    orderedTokens
  ) {
    let features:
      any = undefined;

    let script:
      string | undefined =
      undefined;

    let direction:
      "rtl" | "ltr" =
      "ltr";

    if (token.isNumeric) {
      direction = "ltr";
    } else if (
      token.isRTL
    ) {
      script = "arab";
      direction = "rtl";

      features = {
        init: true,
        medi: true,
        fina: true,
        isol: true,
        liga: true,
        calt: true,
      };
    }

    const run =
      font.layout(
        token.text,
        features,
        script,
        undefined,
        direction,
      );

    const glyphs =
      run.glyphs || [];

    const positions =
      run.positions || [];

    let runWidth = 0;

    for (
      let i = 0;
      i < glyphs.length;
      i++
    ) {
      const glyph =
        glyphs[i];

      const position =
        positions[i];

      runWidth +=
        (
          position
            ?.xAdvance ??
          glyph
            ?.advanceWidth ??
          0
        ) *
        scale;
    }

    shapedRuns.push({
      glyphs,
      positions,
      width: runWidth,
    });

    totalAdvanceWidth +=
      runWidth;
  }

  let cursorX = 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (
    const {
      glyphs,
      positions,
    } of shapedRuns
  ) {
    for (
      let i = 0;
      i < glyphs.length;
      i++
    ) {
      const glyph =
        glyphs[i];

      const position =
        positions[i];

      const advance =
        (
          position
            ?.xAdvance ??
          glyph
            ?.advanceWidth ??
          0
        ) *
        scale;

      if (!glyph) {
        cursorX += advance;
        continue;
      }

      const xOffset =
        (
          position
            ?.xOffset ||
          0
        ) *
        scale;

      const yOffset =
        (
          position
            ?.yOffset ||
          0
        ) *
        scale;

      const bbox =
        glyph.bbox;

      if (bbox) {
        const glyphX =
          cursorX +
          xOffset;

        const left =
          glyphX +
          bbox.minX *
            scale;

        const right =
          glyphX +
          bbox.maxX *
            scale;

        const top =
          yOffset -
          bbox.maxY *
            scale;

        const bottom =
          yOffset -
          bbox.minY *
            scale;

        minX =
          Math.min(
            minX,
            left,
          );

        maxX =
          Math.max(
            maxX,
            right,
          );

        minY =
          Math.min(
            minY,
            top,
          );

        maxY =
          Math.max(
            maxY,
            bottom,
          );
      }

      cursorX += advance;
    }
  }

  const hasGlyphBounds =
    Number.isFinite(minX) &&
    Number.isFinite(maxX) &&
    Number.isFinite(minY) &&
    Number.isFinite(maxY);

  let startX: number;
  let baselineY: number;

  if (hasGlyphBounds) {
    if (
      textAnchor ===
      "middle"
    ) {
      const visualCenterX =
        (
          minX +
          maxX
        ) /
        2;

      startX =
        x -
        visualCenterX;
    } else if (
      textAnchor ===
      "end"
    ) {
      startX =
        x -
        maxX;
    } else {
      startX =
        x -
        minX;
    }

    if (
      dominantBaseline ===
        "middle" ||
      dominantBaseline ===
        "central"
    ) {
      const visualCenterY =
        (
          minY +
          maxY
        ) /
        2;

      baselineY =
        y -
        visualCenterY;
    } else {
      baselineY = y;
    }
  } else {
    if (
      textAnchor ===
      "middle"
    ) {
      startX =
        x -
        totalAdvanceWidth /
          2;
    } else if (
      textAnchor ===
      "end"
    ) {
      startX =
        x -
        totalAdvanceWidth;
    } else {
      startX = x;
    }

    baselineY = y;
  }

  const paths:
    SVGPathElement[] = [];

  cursorX = startX;

  const originalTransform =
    textNode.getAttribute(
      "transform",
    );

  for (
    const {
      glyphs,
      positions,
    } of shapedRuns
  ) {
    for (
      let i = 0;
      i < glyphs.length;
      i++
    ) {
      const glyph =
        glyphs[i];

      const position =
        positions[i];

      const advance =
        (
          position
            ?.xAdvance ??
          glyph
            ?.advanceWidth ??
          0
        ) *
        scale;

      if (!glyph?.path) {
        cursorX += advance;
        continue;
      }

      const xOffset =
        (
          position
            ?.xOffset ||
          0
        ) *
        scale;

      const yOffset =
        (
          position
            ?.yOffset ||
          0
        ) *
        scale;

      const glyphX =
        cursorX +
        xOffset;

      const glyphY =
        baselineY +
        yOffset;

      const glyphPathData =
        glyph.path.toSVG();

      if (!glyphPathData) {
        cursorX += advance;
        continue;
      }

      const path =
        document.createElementNS(
          SVG_NS,
          "path",
        );

      path.setAttribute(
        "d",
        glyphPathData,
      );

      path.setAttribute(
        "fill",
        fill,
      );

      let transform =
        `translate(${glyphX}, ${glyphY}) ` +
        `scale(${scale}, ${-scale})`;

      if (
        originalTransform
      ) {
        transform =
          `${originalTransform} ${transform}`;
      }

      path.setAttribute(
        "transform",
        transform,
      );

      if (
        opacity &&
        opacity !== "1"
      ) {
        path.setAttribute(
          "opacity",
          opacity,
        );
      }

      paths.push(path);

      cursorX += advance;
    }
  }

  return paths;
};

/* =========================================================
   Convert SVG text to paths
========================================================= */

const convertTextElementsToPaths =
  async (
    svgClone: SVGSVGElement,
    font?: any,
  ) => {
    const loadedFont =
      font ||
      (await loadFont());

    const textNodes =
      Array.from(
        svgClone.querySelectorAll(
          "text",
        ),
      ) as SVGTextElement[];

    for (
      const textNode of
      textNodes
    ) {
      try {
        const paths =
          textElementToPaths(
            textNode,
            loadedFont,
          );

        if (
          paths.length ===
          0
        ) {
          continue;
        }

        const parent =
          textNode.parentNode;

        if (!parent) {
          continue;
        }

        for (
          const path of
          paths
        ) {
          parent.insertBefore(
            path,
            textNode,
          );
        }

        parent.removeChild(
          textNode,
        );
      } catch (error) {
        console.warn(
          "Could not convert SVG text to glyph outlines:",
          textNode.textContent,
          error,
        );
      }
    }
  };

/* =========================================================
   Export SVG builder
========================================================= */

interface BuiltExportSVG {
  svgString: string;
  width: number;
  height: number;
}

const buildExportSVG =
  async (
    chartElement:
      HTMLElement,
    width: number,
    height: number,
  ): Promise<BuiltExportSVG> => {
    const svgElement =
      chartElement.querySelector(
        "[data-echarts-instance] svg",
      ) as SVGSVGElement | null;

    if (!svgElement) {
      throw new Error(
        "SVG element not found. Make sure ECharts uses the SVG renderer.",
      );
    }

    const svgClone =
      svgElement.cloneNode(
        true,
      ) as SVGSVGElement;

    preserveTextGeometry(
      svgElement,
      svgClone,
    );

    const originalWidth =
      parseFloat(
        svgElement.getAttribute(
          "width",
        ) || "",
      ) ||
      svgElement.clientWidth ||
      width;

    const originalHeight =
      parseFloat(
        svgElement.getAttribute(
          "height",
        ) || "",
      ) ||
      svgElement.clientHeight ||
      height;

    const viewBox =
      svgElement.getAttribute(
        "viewBox",
      ) ||
      `0 0 ${originalWidth} ${originalHeight}`;

    const values =
      viewBox
        .trim()
        .split(/[\s,]+/)
        .map(Number);

    const vbX =
      Number.isFinite(
        values[0],
      )
        ? values[0]
        : 0;

    const vbY =
      Number.isFinite(
        values[1],
      )
        ? values[1]
        : 0;

    const vbWidth =
      Number.isFinite(
        values[2],
      ) &&
      values[2] > 0
        ? values[2]
        : originalWidth;

    const vbHeight =
      Number.isFinite(
        values[3],
      ) &&
      values[3] > 0
        ? values[3]
        : originalHeight;

    const legendItems =
      extractLegendData(
        chartElement,
      );

    const hasCustomLegend =
      legendItems.length > 0;

    const font =
      await loadFont();

    /*
     * Normal charts:
     *   380 × 230
     *
     * BarChart with custom legend:
     *   600 × 230
     */
    const exportWidth =
      hasCustomLegend
        ? width +
          BAR_LEGEND_WIDTH
        : width;

    /*
     * Convert the physical 220px legend width into
     * the SVG's internal coordinate system.
     */
    const legendViewBoxWidth =
      hasCustomLegend
        ? BAR_LEGEND_WIDTH *
          (
            vbWidth /
            width
          )
        : 0;

    const totalViewBoxWidth =
      vbWidth +
      legendViewBoxWidth;

    /* -------------------------------------------------------
       Add vertical legend beside the chart
    ------------------------------------------------------- */

    if (
      hasCustomLegend
    ) {
      const chartFontSize =
        getDominantFontSize(
          svgClone,
          30,
        );

      /*
       * Keep the same general visual scale as the chart.
       * Slightly cap it so a long legend can still fit.
       */
      const legendFontSize =
        Math.min(
          chartFontSize,
          40,
        );

      const markerWidth =
        legendFontSize *
        0.58;

      const markerHeight =
        legendFontSize *
        0.34;

      const markerTextGap =
        legendFontSize *
        0.28;

      const rowHeight =
        legendFontSize *
        1.18;

      const rowGap =
        legendFontSize *
        0.18;

      const legendLeft =
        vbX +
        vbWidth +
        legendFontSize *
        0.6;

      const legendRight =
        vbX +
        totalViewBoxWidth -
        legendFontSize *
        0.5;

      const availableLegendWidth =
        Math.max(
          1,
          legendRight -
            legendLeft,
        );

      /*
       * Find how tall the whole vertical list will be.
       */
      const totalLegendHeight =
        legendItems.length *
          rowHeight +
        Math.max(
          0,
          legendItems.length -
            1,
        ) *
          rowGap;

      /*
       * Center the legend vertically relative to the chart.
       */
let currentY =
  vbY +
  legendFontSize * 0.6;

      const legendGroup =
        document.createElementNS(
          SVG_NS,
          "g",
        );

      legendGroup.setAttribute(
        "id",
        "custom-legend",
      );

      for (
        const item of
        legendItems
      ) {
        const centerY =
          currentY +
          rowHeight / 2;

        /*
         * RTL layout:
         *
         * [text] [marker]
         *
         * Marker is placed toward the right side.
         */
        const markerX =
          legendRight -
          markerWidth;

        const rect =
          document.createElementNS(
            SVG_NS,
            "rect",
          );

        rect.setAttribute(
          "x",
          String(markerX),
        );

        rect.setAttribute(
          "y",
          String(
            centerY -
              markerHeight /
                2,
          ),
        );

        rect.setAttribute(
          "width",
          String(markerWidth),
        );

        rect.setAttribute(
          "height",
          String(markerHeight),
        );

        const radius =
          Math.min(
            4,
            markerHeight / 3,
          );

        rect.setAttribute(
          "rx",
          String(radius),
        );

        rect.setAttribute(
          "ry",
          String(radius),
        );

        rect.setAttribute(
          "fill",
          item.color,
        );

        legendGroup.appendChild(
          rect,
        );

        const text =
          document.createElementNS(
            SVG_NS,
            "text",
          );

        text.setAttribute(
          "x",
          String(
            markerX -
            markerTextGap,
          ),
        );

        text.setAttribute(
          "y",
          String(centerY),
        );

        text.setAttribute(
          "font-size",
          String(
            legendFontSize,
          ),
        );

        text.setAttribute(
          "font-family",
          "Epsilon",
        );

        text.setAttribute(
          "font-weight",
          "500",
        );

        text.setAttribute(
          "fill",
          "#5F6368",
        );

        text.setAttribute(
          "text-anchor",
          "end",
        );

        text.setAttribute(
          "dominant-baseline",
          "central",
        );

        text.textContent =
          item.name;

        /*
         * Prevent extremely long text from crossing into
         * the chart region.
         */
        text.setAttribute(
          "data-max-width",
          String(
            availableLegendWidth -
              markerWidth -
              markerTextGap,
          ),
        );

        legendGroup.appendChild(
          text,
        );

        currentY +=
          rowHeight +
          rowGap;
      }

      svgClone.appendChild(
        legendGroup,
      );
    }

    /* -------------------------------------------------------
       Export dimensions
    ------------------------------------------------------- */

    svgClone.setAttribute(
      "width",
      String(exportWidth),
    );

    svgClone.setAttribute(
      "height",
      String(height),
    );

    svgClone.setAttribute(
      "viewBox",
      `${vbX} ${vbY} ${totalViewBoxWidth} ${vbHeight}`,
    );

    /*
     * xMin keeps the original chart aligned to the left,
     * rather than recentering it inside the wider SVG.
     */
    svgClone.setAttribute(
      "preserveAspectRatio",
      "xMinYMid meet",
    );

    svgClone.setAttribute(
      "xmlns",
      SVG_NS,
    );

    svgClone.setAttribute(
      "xmlns:xlink",
      "http://www.w3.org/1999/xlink",
    );

    /*
     * Convert chart labels + legend labels to outlines.
     * Illustrator therefore does not need Epsilon installed.
     */
    await convertTextElementsToPaths(
      svgClone,
      font,
    );

    const serializer =
      new XMLSerializer();

    let svgString =
      serializer.serializeToString(
        svgClone,
      );

    if (
      !svgString.startsWith(
        "<?xml",
      )
    ) {
      svgString =
        `<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`;
    }

    return {
      svgString,
      width:
        exportWidth,
      height,
    };
  };

/* =========================================================
   SVG -> high-resolution canvas
========================================================= */

const renderSVGToCanvas = (
  svgString: string,
  width: number,
  height: number,
  backgroundColor =
    "#ffffff",
): Promise<HTMLCanvasElement> => {
  return new Promise(
    (resolve, reject) => {
      const blob =
        new Blob(
          [svgString],
          {
            type: "image/svg+xml;charset=utf-8",
          },
        );

      const url =
        URL.createObjectURL(
          blob,
        );

      const image =
        new Image();

      image.onload = () => {
        try {
          const canvas =
            document.createElement(
              "canvas",
            );

          canvas.width =
            Math.round(
              width *
                EXPORT_PIXEL_RATIO,
            );

          canvas.height =
            Math.round(
              height *
                EXPORT_PIXEL_RATIO,
            );

          const ctx =
            canvas.getContext(
              "2d",
            );

          if (!ctx) {
            throw new Error(
              "Could not create canvas context",
            );
          }

          ctx.fillStyle =
            backgroundColor;

          ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height,
          );

          ctx.imageSmoothingEnabled =
            true;

          ctx.imageSmoothingQuality =
            "high";

          ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height,
          );

          URL.revokeObjectURL(
            url,
          );

          resolve(canvas);
        } catch (error) {
          URL.revokeObjectURL(
            url,
          );

          reject(error);
        }
      };

      image.onerror =
        () => {
          URL.revokeObjectURL(
            url,
          );

          reject(
            new Error(
              "Could not render SVG for raster export",
            ),
          );
        };

      image.src = url;
    },
  );
};

/* =========================================================
   Main download router
========================================================= */

export const downloadChart =
  async (
    chartElement:
      HTMLElement,
    format:
      DownloadFormat,
    chartTitle: string,
    width: number =
      DOWNLOAD_WIDTH,
    height: number =
      DOWNLOAD_HEIGHT,
  ) => {
    try {
      const chartInstance =
        getChartInstance(
          chartElement,
        );

      if (!chartInstance) {
        return;
      }

      const fileName =
        sanitizeFileName(
          chartTitle,
        ) || "chart";

      /*
       * Ensure ECharts geometry is current before cloning SVG.
       */
      chartInstance.resize({
        animation: {
          duration: 0,
        },
      });

      /*
       * One export source for SVG / PNG / JPG / PDF.
       */
      const exportSVG =
        await buildExportSVG(
          chartElement,
          width,
          height,
        );

      switch (format) {
        case "png":
          await downloadAsPNG(
            exportSVG,
            fileName,
          );

          break;

        case "jpg":
          await downloadAsJPG(
            exportSVG,
            fileName,
          );

          break;

        case "svg":
          downloadAsSVG(
            exportSVG,
            fileName,
          );

          break;

        case "pdf":
          await downloadAsPDF(
            exportSVG,
            fileName,
          );

          break;
      }
    } catch (error) {
      console.error(
        "Error downloading chart:",
        error,
      );

      throw error;
    }
  };

/* =========================================================
   SVG
========================================================= */

const downloadAsSVG = (
  exportSVG:
    BuiltExportSVG,
  title: string,
) => {
  const blob =
    new Blob(
      [
        exportSVG.svgString,
      ],
      {
        type: "image/svg+xml;charset=utf-8",
      },
    );

  downloadBlob(
    blob,
    `${title}.svg`,
  );
};

/* =========================================================
   PNG
========================================================= */

const downloadAsPNG =
  async (
    exportSVG:
      BuiltExportSVG,
    title: string,
  ) => {
    const canvas =
      await renderSVGToCanvas(
        exportSVG.svgString,
        exportSVG.width,
        exportSVG.height,
        "#ffffff",
      );

    await new Promise<void>(
      (resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "Could not create PNG",
                ),
              );

              return;
            }

            downloadBlob(
              blob,
              `${title}.png`,
            );

            resolve();
          },
          "image/png",
        );
      },
    );
  };

/* =========================================================
   JPG
========================================================= */

const downloadAsJPG =
  async (
    exportSVG:
      BuiltExportSVG,
    title: string,
  ) => {
    const canvas =
      await renderSVGToCanvas(
        exportSVG.svgString,
        exportSVG.width,
        exportSVG.height,
        "#ffffff",
      );

    await new Promise<void>(
      (resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "Could not create JPG",
                ),
              );

              return;
            }

            downloadBlob(
              blob,
              `${title}.jpg`,
            );

            resolve();
          },
          "image/jpeg",
          0.97,
        );
      },
    );
  };

/* =========================================================
   PDF
========================================================= */

const downloadAsPDF =
  async (
    exportSVG:
      BuiltExportSVG,
    title: string,
  ) => {
    const canvas =
      await renderSVGToCanvas(
        exportSVG.svgString,
        exportSVG.width,
        exportSVG.height,
        "#ffffff",
      );

    const pdfWidth =
      exportSVG.width;

    const pdfHeight =
      exportSVG.height;

    const orientation =
      pdfWidth >=
      pdfHeight
        ? "landscape"
        : "portrait";

    const pdf =
      new jsPDF({
        orientation,
        unit: "px",
        format: [
          pdfWidth,
          pdfHeight,
        ],
        compress: true,
      });

    const imageData =
      canvas.toDataURL(
        "image/png",
      );

    pdf.addImage(
      imageData,
      "PNG",
      0,
      0,
      pdfWidth,
      pdfHeight,
      undefined,
      "FAST",
    );

    pdf.save(
      `${title}.pdf`,
    );
  };