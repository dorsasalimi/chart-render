// components/ColorPicker.tsx
"use client";

import { useState } from "react";
import { CHART_COLORS } from "../lib/chartTheme";

// Define types locally
type ThemeKey = "default" | "dark" | "light";

// Define theme colors locally
const COLOR_THEMES: Record<ThemeKey, { name: string; colors: string[] }> = {
  default: {
    name: "Default",
    colors: CHART_COLORS,
  },
  dark: {
    name: "Dark",
    colors: [
      "#4fc3f7",
      "#81d4fa",
      "#b3e5fc",
      "#ff8a65",
      "#ffab91",
      "#ffccbc",
      "#81c784",
      "#a5d6a7",
      "#c8e6c9",
      "#ffd54f",
      "#ffe082",
    ],
  },
  light: {
    name: "Light",
    colors: [
      "#90caf9",
      "#bbdefb",
      "#e3f2fd",
      "#ef9a9a",
      "#ef9a9a",
      "#ffcdd2",
      "#a5d6a7",
      "#c8e6c9",
      "#e8f5e9",
      "#fff59d",
      "#fff9c4",
    ],
  },
};

const getThemeNames = (): Array<{ key: ThemeKey; name: string }> => {
  return Object.entries(COLOR_THEMES).map(([key, theme]) => ({
    key: key as ThemeKey,
    name: theme.name,
  }));
};

interface Props {
  seriesNames: string[];
  initialColors?: Record<string, string>;
  onColorsChange: (colors: Record<string, string>) => void;
  onThemeChange?: (theme: ThemeKey) => void;
}

export default function ColorPicker({ 
  seriesNames, 
  initialColors = {},
  onColorsChange,
  onThemeChange 
}: Props) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("default");
  const [customColors, setCustomColors] = useState<Record<string, string>>(initialColors);

  const themes = getThemeNames();

  const handleThemeSelect = (themeKey: ThemeKey) => {
    setSelectedTheme(themeKey);
    const themeColors = COLOR_THEMES[themeKey].colors;
    const newColors = seriesNames.reduce((acc, name, index) => {
      acc[name] = themeColors[index % themeColors.length];
      return acc;
    }, {} as Record<string, string>);
    setCustomColors(newColors);
    onColorsChange(newColors);
    if (onThemeChange) {
      onThemeChange(themeKey);
    }
  };

  const handleColorChange = (seriesName: string, color: string) => {
    const newColors = { ...customColors, [seriesName]: color };
    setCustomColors(newColors);
    onColorsChange(newColors);
  };

  const handleReset = () => {
    const defaultColors = seriesNames.reduce((acc, name, index) => {
      acc[name] = CHART_COLORS[index % CHART_COLORS.length];
      return acc;
    }, {} as Record<string, string>);
    setCustomColors(defaultColors);
    setSelectedTheme("default");
    onColorsChange(defaultColors);
    if (onThemeChange) {
      onThemeChange("default");
    }
  };

  return (
    <div style={{ 
      padding: "16px", 
      backgroundColor: "#f9fafb", 
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      marginBottom: "20px"
    }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
          Select Color Theme
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {themes.map(({ key, name }) => (
            <button
              key={key}
              onClick={() => handleThemeSelect(key)}
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "500",
                borderRadius: "20px",
                border: selectedTheme === key ? "2px solid #1c439c" : "1px solid #d1d5db",
                backgroundColor: selectedTheme === key ? "#eff6ff" : "white",
                color: selectedTheme === key ? "#1c439c" : "#374151",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {name}
            </button>
          ))}
          <button
            onClick={handleReset}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "500",
              borderRadius: "20px",
              border: "1px solid #ef4444",
              backgroundColor: "white",
              color: "#ef4444",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
          Customize Individual Colors
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          {seriesNames.map((name) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#4b5563", minWidth: "80px" }}>
                {name}:
              </label>
              <input
                type="color"
                value={customColors[name] || CHART_COLORS[seriesNames.indexOf(name) % CHART_COLORS.length]}
                onChange={(e) => handleColorChange(name, e.target.value)}
                style={{
                  width: "36px",
                  height: "36px",
                  padding: "2px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: "white",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "12px", fontSize: "12px", color: "#6b7280" }}>
        💡 Click on colors above to customize each series individually
      </div>
    </div>
  );
}