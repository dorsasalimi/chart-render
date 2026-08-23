"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, Check } from "lucide-react";
import { DownloadFormat, downloadChart } from "../lib/chartDownload";

interface DownloadButtonProps {
  chartId: string;
  chartTitle: string;
}

const formats: { value: DownloadFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "svg", label: "SVG" },
  { value: "pdf", label: "PDF" },
];

// High-resolution download dimensions
const DOWNLOAD_WIDTH = 510;
const DOWNLOAD_HEIGHT = 310;

export default function DownloadButton({
  chartId,
  chartTitle,
}: DownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] =
    useState<DownloadFormat>("png");
  const [isDownloading, setIsDownloading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const performDownload = async (format: DownloadFormat) => {
    const chartElement = document.getElementById(chartId);

    if (!chartElement) {
      console.error(`Chart element not found: ${chartId}`);
      return;
    }

    setIsDownloading(true);

    try {
      await downloadChart(
        chartElement,
        format,
        chartTitle,
        DOWNLOAD_WIDTH,
        DOWNLOAD_HEIGHT
      );
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownload = async () => {
    await performDownload(selectedFormat);
    setIsOpen(false);
  };

  const handleFormatSelect = async (format: DownloadFormat) => {
    setIsOpen(false);
    setSelectedFormat(format);

    setTimeout(() => {
      performDownload(format);
    }, 0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDownloading}
        className={`
          inline-flex items-center gap-1.5
          rounded-lg px-3 py-1.5
          text-sm font-medium
          transition-all duration-200
          ${
            isDownloading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-[#202522] border border-[#E6EBE8] hover:bg-[#F7F9F8] hover:border-[#2B9E65] hover:text-[#2B9E65] active:scale-95 shadow-sm"
          }
        `}
      >
        {isDownloading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />

              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>

            <span>در حال دانلود...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />

            <span>دانلود</span>

            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {isOpen && !isDownloading && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-white shadow-lg border border-[#E6EBE8] py-1 z-50 overflow-hidden">
          <div className="py-1">
            {formats.map((format) => (
              <button
                key={format.value}
                onClick={() => handleFormatSelect(format.value)}
                className={`
                  w-full px-4 py-2.5 text-sm text-left
                  hover:bg-[#F0F4F2]
                  transition-colors duration-150
                  flex items-center justify-between
                  ${
                    selectedFormat === format.value
                      ? "bg-[#F0F7F3] text-[#2B9E65] font-medium"
                      : "text-[#202522]"
                  }
                `}
              >
                <span>{format.label}</span>

                {selectedFormat === format.value && (
                  <Check className="h-4 w-4 text-[#2B9E65] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}