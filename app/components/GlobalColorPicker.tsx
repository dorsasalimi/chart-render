// components/GlobalColorPicker.tsx
"use client";

import { useState } from "react";
import { COLOR_THEMES, ThemeKey, getThemeNames } from "../lib/colorThemes";
import { CHART_COLORS } from "../lib/chartTheme";

interface Props {
  seriesNames: string[];
  initialColors?: Record<string, string>;
  onColorsChange: (colors: Record<string, string>) => void;
  onThemeChange: (theme: ThemeKey) => void;
  onReset: () => void;
}

export default function GlobalColorPicker({
  seriesNames,
  initialColors = {},
  onColorsChange,
  onThemeChange,
  onReset,
}: Props) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("default");
  const [customColors, setCustomColors] = useState<Record<string, string>>(initialColors);
  const [searchTerm, setSearchTerm] = useState("");

  const themes = getThemeNames();
  
  // Filter series by search
  const filteredSeries = seriesNames.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleThemeSelect = (themeKey: ThemeKey) => {
    setSelectedTheme(themeKey);
    const themeColors = COLOR_THEMES[themeKey].colors;
    const newColors = seriesNames.reduce((acc, name, index) => {
      acc[name] = themeColors[index % themeColors.length];
      return acc;
    }, {} as Record<string, string>);
    setCustomColors(newColors);
    onColorsChange(newColors);
    onThemeChange(themeKey);
  };

  const handleColorChange = (seriesName: string, color: string) => {
    const newColors = { ...customColors, [seriesName]: color };
    setCustomColors(newColors);
    onColorsChange(newColors);
  };

  const handleReset = () => {
    setCustomColors({});
    setSelectedTheme("default");
    onReset();
  };

  const handleRandomize = () => {
    const newColors = seriesNames.reduce((acc, name) => {
      // Generate random bright color
      const hue = Math.floor(Math.random() * 360);
      const saturation = 60 + Math.floor(Math.random() * 30);
      const lightness = 40 + Math.floor(Math.random() * 30);
      acc[name] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      return acc;
    }, {} as Record<string, string>);
    setCustomColors(newColors);
    onColorsChange(newColors);
  };

  // Check if a series has a custom color
  const hasCustomColors = Object.keys(customColors).length > 0;

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-sm font-semibold text-[#202522] mb-3">
          Color Themes
        </h3>
        <div className="flex flex-wrap gap-2">
          {themes.map(({ key, name }) => (
            <button
              key={key}
              onClick={() => handleThemeSelect(key)}
              className={`
                inline-flex items-center gap-2
                px-3 py-1.5
                text-xs font-medium
                rounded-full
                border
                transition-all
                ${selectedTheme === key && !hasCustomColors
                  ? "border-[#2B9E65] bg-[#2B9E65]/10 text-[#2B9E65]"
                  : "border-[#E6EBE8] bg-white text-[#4A5A52] hover:border-[#2B9E65]/50"
                }
              `}
            >
              <span className="flex gap-0.5">
                {COLOR_THEMES[key].colors.slice(0, 4).map((color, idx) => (
                  <span
                    key={idx}
                    className="w-2.5 h-2.5 rounded-full border border-[#E6EBE8]/50"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Individual Color Controls */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#202522]">
            Individual Series Colors
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="
                text-xs px-3 py-1
                bg-[#F7F9F8] border border-[#E6EBE8]
                rounded-full
                text-[#4A5A52] hover:bg-[#EEF1EF]
                transition-colors
              "
            >
              🎲 Randomize
            </button>
            <button
              onClick={handleReset}
              className="
                text-xs px-3 py-1
                bg-[#F7F9F8] border border-[#E6EBE8]
                rounded-full
                text-[#4A5A52] hover:bg-[#EEF1EF]
                transition-colors
              "
            >
              Reset All
            </button>
          </div>
        </div>


        {/* Color Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredSeries.map((name) => {
            const defaultColor = CHART_COLORS[seriesNames.indexOf(name) % CHART_COLORS.length];
            const currentColor = customColors[name] || defaultColor;
            
            return (
              <div
                key={name}
                className="
                  flex items-center gap-3
                  p-2
                  bg-[#F7F9F8]
                  rounded-lg
                  border border-[#E6EBE8]
                "
              >
                <label className="flex-1 text-sm font-medium text-[#4A5A52] truncate">
                  {name}
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentColor }}
                  />
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => handleColorChange(name, e.target.value)}
                    className="
                      w-8 h-8 p-0.5
                      border-2 border-[#E6EBE8]
                      rounded-lg
                      cursor-pointer
                      bg-white
                      hover:border-[#2B9E65]/50
                      transition-colors
                    "
                  />
                </div>
              </div>
            );
          })}
        </div>

        {filteredSeries.length === 0 && (
          <p className="text-sm text-[#6B7A73] text-center py-4">
            No series found matching "{searchTerm}"
          </p>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#EEF1EF]">
        <div className="text-xs text-[#6B7A73]">
          {hasCustomColors ? (
            <span>
              🎨 Custom colors applied for {Object.keys(customColors).length} series
            </span>
          ) : (
            <span>Using theme: {COLOR_THEMES[selectedTheme].name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Copy colors to clipboard
              const colorString = Object.entries(customColors)
                .map(([name, color]) => `${name}: ${color}`)
                .join("\n");
              navigator.clipboard?.writeText(colorString);
            }}
            className="
              text-xs px-3 py-1
              bg-white border border-[#E6EBE8]
              rounded-full
              text-[#4A5A52] hover:bg-[#F7F9F8]
              transition-colors
            "
            disabled={!hasCustomColors}
          >
            📋 Copy Colors
          </button>
        </div>
      </div>
    </div>
  );
}