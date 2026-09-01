import * as fontkit from "fontkit";
import type { Font, Glyph, GlyphPosition } from "fontkit";

const SVG_NS = "http://www.w3.org/2000/svg";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const FONT_PATH = `${BASE_PATH}/fonts/w_Epsilon.ttf`;

let cachedFont: Font | null = null;

async function loadFont(): Promise<Font> {
  if (cachedFont) return cachedFont;

  const response = await fetch(FONT_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load map export font: ${response.status}`);
  }

  const loadedFont = fontkit.create(
    Buffer.from(await response.arrayBuffer()),
  ) as Font;
  cachedFont = loadedFont;
  return loadedFont;
}

function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "").trim().replace(/\s+/g, "-");
}

function numericAttribute(element: Element, name: string, fallback = 0) {
  const value = Number.parseFloat(element.getAttribute(name) || "");
  return Number.isFinite(value) ? value : fallback;
}

function fontSize(text: SVGTextElement) {
  const value =
    text.getAttribute("font-size") ||
    text.style.fontSize ||
    window.getComputedStyle(text).fontSize;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 13;
}

function preserveTextGeometry(source: SVGSVGElement, clone: SVGSVGElement) {
  const sourceTexts = Array.from(source.querySelectorAll("text"));
  const cloneTexts = Array.from(clone.querySelectorAll("text"));

  sourceTexts.forEach((sourceText, index) => {
    const cloneText = cloneTexts[index];
    if (!cloneText) return;
    const computed = window.getComputedStyle(sourceText);
    cloneText.setAttribute("font-size", computed.fontSize);
    cloneText.setAttribute("font-family", "Epsilon");
    cloneText.setAttribute("font-weight", computed.fontWeight);
    cloneText.setAttribute(
      "text-anchor",
      sourceText.getAttribute("text-anchor") || computed.textAnchor || "start",
    );
  });
}

function textToPaths(text: SVGTextElement, font: Font) {
  const content = text.textContent || "";
  if (!content.trim()) return [];

  const size = fontSize(text);
  const scale = size / (font.unitsPerEm || 1000);
  const run = font.layout(content);
  const glyphs = run.glyphs || [];
  const positions = run.positions || [];
  const x = numericAttribute(text, "x");
  const y = numericAttribute(text, "y");
  const anchor = text.getAttribute("text-anchor") || "start";
  const fill =
    text.getAttribute("fill") || text.style.fill || window.getComputedStyle(text).fill;
  const totalWidth = glyphs.reduce(
    (width: number, glyph: Glyph, index: number) =>
      width + (positions[index]?.xAdvance ?? glyph?.advanceWidth ?? 0) * scale,
    0,
  );
  let cursor = x - (anchor === "middle" ? totalWidth / 2 : anchor === "end" ? totalWidth : 0);
  const transform = text.getAttribute("transform");

  return glyphs.flatMap((glyph: Glyph, index: number) => {
    const position: GlyphPosition | undefined = positions[index];
    const advance = (position?.xAdvance ?? glyph?.advanceWidth ?? 0) * scale;
    if (!glyph?.path) {
      cursor += advance;
      return [];
    }

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", glyph.path.toSVG());
    path.setAttribute("fill", fill || "#1d3b68");
    const glyphTransform = `translate(${cursor + (position?.xOffset || 0) * scale}, ${y + (position?.yOffset || 0) * scale}) scale(${scale}, ${-scale})`;
    path.setAttribute("transform", transform ? `${transform} ${glyphTransform}` : glyphTransform);
    cursor += advance;
    return [path];
  });
}

async function convertTextToPaths(svg: SVGSVGElement) {
  const font = await loadFont();
  for (const text of Array.from(svg.querySelectorAll("text"))) {
    const paths = textToPaths(text, font);
    for (const path of paths) text.parentNode?.insertBefore(path, text);
    if (paths.length) text.remove();
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadMapAsSVG(mapElement: HTMLElement, title: string) {
  // The province map uses ReactECharts directly, so it does not receive the
  // custom data attribute used by the regular chart components.
  const source = mapElement.querySelector(
    "[data-echarts-instance] svg, div[_echarts_instance_] svg, svg",
  ) as SVGSVGElement | null;
  if (!source) throw new Error("Iran map SVG is not ready yet.");

  const clone = source.cloneNode(true) as SVGSVGElement;
  preserveTextGeometry(source, clone);

  const width = Number.parseFloat(source.getAttribute("width") || "") || source.clientWidth;
  const height = Number.parseFloat(source.getAttribute("height") || "") || source.clientHeight;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("viewBox", source.getAttribute("viewBox") || `0 0 ${width} ${height}`);
  clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  await convertTextToPaths(clone);

  let svg = new XMLSerializer().serializeToString(clone);
  svg = `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`;
  const fileName = sanitizeFileName(title) || "iran-province-map";
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${fileName}.svg`);
}
