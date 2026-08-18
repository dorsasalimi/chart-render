// lib/chartDownload.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type DownloadFormat = "png" | "jpg" | "svg" | "pdf";

export const downloadChart = async (
  chartElement: HTMLElement,
  format: DownloadFormat,
  chartTitle: string
) => {
  try {
    // Find the ECharts instance container
    const chartContainer = chartElement.querySelector(
      "[data-echarts-container]"
    ) as HTMLElement;

    if (!chartContainer) {
      console.error("Chart container not found");
      return;
    }

    switch (format) {
      case "png":
        await downloadAsPNG(chartContainer, chartTitle);
        break;
      case "jpg":
        await downloadAsJPG(chartContainer, chartTitle);
        break;
      case "svg":
        await downloadAsSVG(chartContainer, chartTitle);
        break;
      case "pdf":
        await downloadAsPDF(chartContainer, chartTitle);
        break;
    }
  } catch (error) {
    console.error("Error downloading chart:", error);
  }
};

const downloadAsPNG = async (element: HTMLElement, title: string) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const link = document.createElement("a");
  link.download = `${title}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

const downloadAsJPG = async (element: HTMLElement, title: string) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const link = document.createElement("a");
  link.download = `${title}.jpg`;
  link.href = canvas.toDataURL("image/jpeg", 0.95);
  link.click();
};

const downloadAsSVG = async (element: HTMLElement, title: string) => {
  // Find the SVG element within the chart container
  const svgElement = element.querySelector("svg");
  if (!svgElement) {
    console.error("SVG element not found");
    return;
  }

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  // Add proper SVG namespace if missing
  if (!svgString.includes("xmlns")) {
    svgString = svgString.replace(
      "<svg",
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  // Add styles from the page
  const styles = document.querySelectorAll("style");
  let styleString = "";
  styles.forEach((style) => {
    styleString += style.innerHTML;
  });

  // Inject styles into SVG
  const svgWithStyles = svgString.replace(
    "</svg>",
    `<style>${styleString}</style></svg>`
  );

  const blob = new Blob([svgWithStyles], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${title}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadAsPDF = async (element: HTMLElement, title: string) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(`${title}.pdf`);
};