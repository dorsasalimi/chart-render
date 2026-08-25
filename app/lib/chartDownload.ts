import * as echarts from "echarts";
import jsPDF from "jspdf";
import * as fontkit from "fontkit";

export type DownloadFormat = "png" | "jpg" | "svg" | "pdf";

const DOWNLOAD_WIDTH = 380;
const DOWNLOAD_HEIGHT = 230;
const EXPORT_PIXEL_RATIO = 3;

// IMPORTANT:
// Must point to the actual font available from your Next.js public folder.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const FONT_PATH = `${BASE_PATH}/fonts/w_Epsilon.ttf`;

const sanitizeFileName = (name: string) => {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

const getChartInstance = (chartElement: HTMLElement) => {
  const echartsDom = chartElement.querySelector(
    "[data-echarts-instance]"
  ) as HTMLElement | null;

  if (!echartsDom) {
    console.error("ECharts DOM element not found");
    return null;
  }

  const chartInstance = echarts.getInstanceByDom(echartsDom);

  if (!chartInstance) {
    console.error("ECharts instance not found");
    return null;
  }

  return chartInstance;
};

/* =========================================================
   Fontkit Loader
========================================================= */

let cachedFont: any = null;

const loadFont = async () => {
  if (cachedFont) {
    return cachedFont;
  }

  const response = await fetch(FONT_PATH);

  if (!response.ok) {
    throw new Error(
      `Failed to load font from ${FONT_PATH}: ${response.status} ${response.statusText}`
    );
  }

  const buffer = await response.arrayBuffer();

  // Convert ArrayBuffer to Buffer (Node.js Buffer)
  const nodeBuffer = Buffer.from(buffer);

  cachedFont = fontkit.create(nodeBuffer);

  return cachedFont;
};

/* =========================================================
   SVG & BiDi Helpers
========================================================= */

const SVG_NS = "http://www.w3.org/2000/svg";

const getNumericAttribute = (
  element: Element,
  attribute: string,
  fallback = 0
) => {
  const value = parseFloat(element.getAttribute(attribute) || "");
  return Number.isFinite(value) ? value : fallback;
};

const isPersianArabicChar = (char: string) => {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
    char
  );
};

interface TextRun {
  text: string;
  isRTL: boolean;
}

/**
 * Splits text into separate runs so that numbers/symbols stay LTR
 * while Persian text receives RTL Arabic cursive shaping.
 */
interface TextRun {
  text: string;
  isRTL: boolean;
  isNumeric: boolean;
}

const tokenizeBidiString = (input: string): TextRun[] => {
  // IMPORTANT:
  // Numeric characters must be matched BEFORE the general Arabic/Persian range,
  // because Persian digits and ٪ are inside the Arabic Unicode block.
  const tokens =
    input.match(
      /[0-9\u0660-\u0669\u06F0-\u06F9.,٫٬%٪+\-–\/\\:]+|[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+|[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF0-9\u0660-\u0669\u06F0-\u06F9]+/g
    ) || [input];

  return tokens.map((token) => {
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
      isRTL: hasPersian && !isNumeric,
    };
  });
};

/**
 * Get font size from a text element with proper fallback
 */
const getFontSizeFromElement = (textNode: SVGTextElement, fallback = 30): number => {
  // Try attribute first
  const attrSize = textNode.getAttribute("font-size");
  if (attrSize) {
    const parsed = parseFloat(attrSize);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Try style property
  const styleSize = textNode.style.fontSize;
  if (styleSize) {
    const parsed = parseFloat(styleSize);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Try computed style
  try {
    const computed = window.getComputedStyle(textNode);
    const computedSize = parseFloat(computed.fontSize);
    if (!isNaN(computedSize) && computedSize > 0) {
      return computedSize;
    }
  } catch (e) {
    // Silently fallback
  }

  // Check parent element for font size
  let parent = textNode.parentElement;
  while (parent) {
    const parentSize = parent.getAttribute("font-size");
    if (parentSize) {
      const parsed = parseFloat(parentSize);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    parent = parent.parentElement;
  }

  return fallback;
};

/**
 * Get the dominant font size from an SVG
 */
const getDominantFontSize = (svgElement: SVGSVGElement, fallback = 30): number => {
  const textElements = svgElement.querySelectorAll("text");
  
  if (textElements.length === 0) {
    return fallback;
  }

  // Collect all font sizes
  const sizes: number[] = [];
  for (const textEl of textElements) {
    const size = getFontSizeFromElement(textEl, fallback);
    if (size > 0) {
      sizes.push(size);
    }
  }

  if (sizes.length === 0) {
    return fallback;
  }

  // Use the most common font size, or the average
  const frequency: Record<number, number> = {};
  for (const size of sizes) {
    frequency[size] = (frequency[size] || 0) + 1;
  }

  let maxCount = 0;
  let dominantSize = sizes[0];
  for (const [size, count] of Object.entries(frequency)) {
    if (count > maxCount) {
      maxCount = count;
      dominantSize = parseFloat(size);
    }
  }

  return dominantSize;
};

/**
 * Extract legend data from chart
 */
interface LegendItemData {
  name: string;
  color: string;
}

const extractLegendData = (chartElement: HTMLElement): LegendItemData[] => {
  const legendContainer = chartElement.querySelector(
    '[data-chart-custom-legend="true"]'
  );
  if (!legendContainer) return [];

  const buttons = Array.from(legendContainer.querySelectorAll("button"));
  return buttons.map((button) => {
    const colorEl = button.querySelector("span[style*='background-color']");
    const labelEl = button.querySelector("span:not([style*='background-color'])");

    const color =
      (colorEl as HTMLElement)?.style?.backgroundColor || "#2B9E65";
    const name = labelEl?.textContent?.trim() || "";

    return { name, color };
  });
};

/**
 * Convert an SVG text node into actual font glyph outlines via fontkit.
 */
const textElementToPaths = (
  textNode: SVGTextElement,
  font: any
): SVGPathElement[] => {
  const rawText = textNode.textContent || "";

  if (!rawText.trim()) {
    return [];
  }

  // Get the actual font size from the element
  const fontSize = getFontSizeFromElement(textNode, 30);

  const x = getNumericAttribute(textNode, "x", 0);
  const y = getNumericAttribute(textNode, "y", 0);

  const textAnchor =
    textNode.getAttribute("text-anchor") ||
    window.getComputedStyle(textNode).textAnchor ||
    "start";

  const fill =
    textNode.getAttribute("fill") ||
    textNode.style.fill ||
    window.getComputedStyle(textNode).fill ||
    "#171717";

  const opacity =
    textNode.getAttribute("opacity") ||
    textNode.style.opacity ||
    window.getComputedStyle(textNode).opacity;

  const unitsPerEm = font.unitsPerEm || 1000;
  const scale = fontSize / unitsPerEm;

  const tokens = tokenizeBidiString(rawText);
  const containsRTL = tokens.some((t) => t.isRTL);

  // When Persian text is present, arrange token blocks in RTL visual sequence
  const orderedTokens = containsRTL ? [...tokens].reverse() : tokens;

  const shapedRuns: {
    glyphs: any[];
    positions: any[];
    width: number;
  }[] = [];

  let totalAdvanceWidth = 0;

  for (const token of orderedTokens) {
    let features: any = undefined;
    let script: string | undefined = undefined;
    let direction: "rtl" | "ltr" = "ltr";

    if (token.isRTL) {
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

    const run = font.layout(token.text, features, script, undefined, direction);
    const glyphs = run.glyphs || [];
    const positions = run.positions || [];

    const runWidth = glyphs.reduce((sum: number, glyph: any, idx: number) => {
      const pos = positions[idx];
      return sum + (pos?.xAdvance ?? glyph.advanceWidth ?? 0) * scale;
    }, 0);

    shapedRuns.push({ glyphs, positions, width: runWidth });
    totalAdvanceWidth += runWidth;
  }

  let startX = x;
  if (textAnchor === "middle") {
    startX = x - totalAdvanceWidth / 2;
  } else if (textAnchor === "end") {
    startX = x - totalAdvanceWidth;
  }

  const paths: SVGPathElement[] = [];
  let cursorX = startX;

  const originalTransform = textNode.getAttribute("transform");

  for (const { glyphs, positions } of shapedRuns) {
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      const position = positions[i];

      if (!glyph?.path) {
        cursorX += (position?.xAdvance ?? glyph?.advanceWidth ?? 0) * scale;
        continue;
      }

      const xOffset = (position?.xOffset || 0) * scale;
      const yOffset = (position?.yOffset || 0) * scale;
      const glyphX = cursorX + xOffset;

      const glyphPathData = glyph.path.toSVG();

      if (!glyphPathData) {
        cursorX += (position?.xAdvance ?? glyph.advanceWidth ?? 0) * scale;
        continue;
      }

      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", glyphPathData);
      path.setAttribute("fill", fill);

      let transform = `translate(${glyphX}, ${y + yOffset}) scale(${scale}, ${-scale})`;
      if (originalTransform) {
        transform = `${originalTransform} ${transform}`;
      }

      path.setAttribute("transform", transform);

      if (opacity && opacity !== "1") {
        path.setAttribute("opacity", opacity);
      }

      paths.push(path);

      cursorX += (position?.xAdvance ?? glyph.advanceWidth ?? 0) * scale;
    }
  }

  return paths;
};

/**
 * Convert all SVG text to font outlines
 */
const convertTextElementsToPaths = async (svgClone: SVGSVGElement) => {
  const font = await loadFont();

  const textNodes = Array.from(
    svgClone.querySelectorAll("text")
  ) as SVGTextElement[];

  for (const textNode of textNodes) {
    try {
      const paths = textElementToPaths(textNode, font);

      if (!paths.length) {
        continue;
      }

      const parent = textNode.parentNode;

      if (!parent) {
        continue;
      }

      for (const path of paths) {
        parent.insertBefore(path, textNode);
      }

      parent.removeChild(textNode);
    } catch (error) {
      console.warn(
        "Could not convert SVG text to glyph outlines:",
        textNode.textContent,
        error
      );
    }
  }
};

/* =========================================================
   Canvas Helper
========================================================= */

const createExactSizeCanvas = (
  sourceDataUrl: string,
  width: number,
  height: number,
  backgroundColor = "#ffffff"
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(image, 0, 0, width, height);

      resolve(canvas);
    };

    image.onerror = () => {
      reject(new Error("Could not load chart image"));
    };

    image.src = sourceDataUrl;
  });
};

/* =========================================================
   Main Download Router
========================================================= */

export const downloadChart = async (
  chartElement: HTMLElement,
  format: DownloadFormat,
  chartTitle: string,
  width: number = DOWNLOAD_WIDTH,
  height: number = DOWNLOAD_HEIGHT
) => {
  try {
    const chartInstance = getChartInstance(chartElement);

    if (!chartInstance) {
      return;
    }

    const fileName = sanitizeFileName(chartTitle) || "chart";

    chartInstance.resize({
      animation: {
        duration: 0,
      },
    });

    switch (format) {
      case "png":
        await downloadAsPNG(chartInstance, fileName, width, height);
        break;

      case "jpg":
        await downloadAsJPG(chartInstance, fileName, width, height);
        break;

      case "svg":
        await downloadAsSVG(chartElement, fileName, width, height);
        break;

      case "pdf":
        await downloadAsPDF(chartInstance, fileName, width, height);
        break;
    }
  } catch (error) {
    console.error("Error downloading chart:", error);
    throw error;
  }
};

/* =========================================================
   PNG
========================================================= */

const downloadAsPNG = async (
  chartInstance: echarts.ECharts,
  title: string,
  width: number,
  height: number
) => {
  const dataUrl = chartInstance.getDataURL({
    type: "png",
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor: "#ffffff",
    excludeComponents: ["toolbox"],
  });

  const canvas = await createExactSizeCanvas(
    dataUrl,
    width,
    height,
    "#ffffff"
  );

  const link = document.createElement("a");

  link.download = `${title}.png`;
  link.href = canvas.toDataURL("image/png");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* =========================================================
   JPG
========================================================= */

const downloadAsJPG = async (
  chartInstance: echarts.ECharts,
  title: string,
  width: number,
  height: number
) => {
  const dataUrl = chartInstance.getDataURL({
    type: "png",
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor: "#ffffff",
    excludeComponents: ["toolbox"],
  });

  const canvas = await createExactSizeCanvas(
    dataUrl,
    width,
    height,
    "#ffffff"
  );

  const link = document.createElement("a");

  link.download = `${title}.jpg`;
  link.href = canvas.toDataURL("image/jpeg", 0.97);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* =========================================================
   SVG with Custom Legend
========================================================= */

const downloadAsSVG = async (
  chartElement: HTMLElement,
  title: string,
  width: number,
  height: number
) => {
  try {
    const svgElement = chartElement.querySelector(
      "[data-echarts-instance] svg"
    ) as SVGSVGElement | null;

    if (!svgElement) {
      throw new Error(
        "SVG element not found. Make sure ECharts uses the SVG renderer."
      );
    }

    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

    const originalWidth =
      parseFloat(svgElement.getAttribute("width") || "") ||
      svgElement.clientWidth ||
      width;

    const originalHeight =
      parseFloat(svgElement.getAttribute("height") || "") ||
      svgElement.clientHeight ||
      height;

    const viewBox =
      svgElement.getAttribute("viewBox") ||
      `0 0 ${originalWidth} ${originalHeight}`;

    const values = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    const vbX = Number.isFinite(values[0]) ? values[0] : 0;
    const vbY = Number.isFinite(values[1]) ? values[1] : 0;
    const vbWidth = Number.isFinite(values[2]) ? values[2] : originalWidth;
    const vbHeight = Number.isFinite(values[3]) ? values[3] : originalHeight;

    // --- Add Custom Legend into SVG ---
    const legendItems = extractLegendData(chartElement);
    const legendHeight = legendItems.length > 0 ? 50 : 0;
    const totalHeight = vbHeight + legendHeight;

    if (legendItems.length > 0) {
      // Get the dominant font size from the chart
      const chartFontSize = getDominantFontSize(svgClone, 30);
      
      const legendGroup = document.createElementNS(SVG_NS, "g");
      legendGroup.setAttribute("id", "custom-legend");

      // Scale everything based on font size
      const itemGap = chartFontSize * 2.67;
      const markerWidth = chartFontSize * 0.6;
      const markerHeight = chartFontSize * 0.4;
      const approxCharWidth = chartFontSize * 0.33;

      const itemsWithWidth = legendItems.map((item) => ({
        ...item,
        width: markerWidth + 10 + item.name.length * approxCharWidth,
      }));

      const totalLegendContentWidth =
        itemsWithWidth.reduce((sum, item) => sum + item.width, 0) +
        (itemsWithWidth.length - 1) * itemGap;

      let currentX =
        vbX + Math.max(15, (vbWidth - totalLegendContentWidth) / 2);
      const legendY = vbY + vbHeight + 16;

      for (const item of itemsWithWidth) {
        // Legend Color Box
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", String(currentX));
        rect.setAttribute("y", String(legendY));
        rect.setAttribute("width", String(markerWidth));
        rect.setAttribute("height", String(markerHeight));
        rect.setAttribute("rx", "4");
        rect.setAttribute("ry", "4");
        rect.setAttribute("fill", item.color);
        legendGroup.appendChild(rect);

        // Legend Text - using dynamic font size
        const text = document.createElementNS(SVG_NS, "text");
        text.setAttribute("x", String(currentX + markerWidth + 8));
        text.setAttribute("y", String(legendY + markerHeight));
        text.setAttribute("font-size", String(chartFontSize));
        text.setAttribute("fill", "#5F6368");
        text.setAttribute("text-anchor", "start");
        text.setAttribute("dominant-baseline", "central");
        text.textContent = item.name;
        legendGroup.appendChild(text);

        currentX += item.width + itemGap;
      }

      svgClone.appendChild(legendGroup);
    }

    // Adjust ViewBox and dimensions for the combined SVG
    const exportedHeight =
      height + (legendHeight > 0 ? legendHeight * (height / vbHeight) : 0);

    svgClone.setAttribute("width", String(width));
    svgClone.setAttribute("height", String(exportedHeight));
    svgClone.setAttribute("viewBox", `${vbX} ${vbY} ${vbWidth} ${totalHeight}`);
    svgClone.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // Convert all text including legend labels into glyph paths
    await convertTextElementsToPaths(svgClone);

    // Output & Download
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgClone);

    if (!svgString.startsWith("<?xml")) {
      svgString = `<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`;
    }

    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${title}.svg`;
    link.href = url;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error("SVG download failed:", error);
    throw error;
  }
};

/* =========================================================
   PDF
========================================================= */

const downloadAsPDF = async (
  chartInstance: echarts.ECharts,
  title: string,
  width: number,
  height: number
) => {
  const dataUrl = chartInstance.getDataURL({
    type: "png",
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor: "#ffffff",
    excludeComponents: ["toolbox"],
  });

  const canvas = await createExactSizeCanvas(
    dataUrl,
    width,
    height,
    "#ffffff"
  );

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [width, height],
    compress: true,
  });

  const imageData = canvas.toDataURL("image/png");

  pdf.addImage(imageData, "PNG", 0, 0, width, height, undefined, "FAST");

  pdf.save(`${title}.pdf`);
};