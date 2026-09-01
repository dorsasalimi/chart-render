"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { downloadMapAsSVG } from "../lib/mapDownload";

interface MapDownloadButtonProps {
  mapId: string;
  mapTitle: string;
}

export default function MapDownloadButton({ mapId, mapTitle }: MapDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    const mapElement = document.getElementById(mapId);
    if (!mapElement) return;

    setIsDownloading(true);
    try {
      await downloadMapAsSVG(mapElement, mapTitle);
    } catch (error) {
      console.error("Map SVG download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6EBE8] bg-white px-3 py-1.5 text-sm font-medium text-[#202522] shadow-sm transition-all hover:border-[#2B9E65] hover:bg-[#F7F9F8] hover:text-[#2B9E65] disabled:cursor-not-allowed disabled:text-gray-400"
    >
      <Download className="h-4 w-4" />
      <span>{isDownloading ? "در حال دانلود..." : "دانلود SVG نقشه"}</span>
    </button>
  );
}
