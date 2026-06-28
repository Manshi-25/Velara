

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { Palette, Moon, Sun, Sparkles, Type, Zap, Monitor } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/appearance")({
  component: AppearancePage,
});

// Colors that work well with both dark and light themes
const ACCENT_COLORS = [
  { name: "Violet", value: "violet", hex: "#7c3aed", lightHex: "#8b5cf6" },
  { name: "Rose", value: "rose", hex: "#e11d48", lightHex: "#f43f5e" },
  { name: "Sky", value: "sky", hex: "#0ea5e9", lightHex: "#38bdf8" },
  { name: "Emerald", value: "emerald", hex: "#10b981", lightHex: "#34d399" },
  { name: "Amber", value: "amber", hex: "#d97706", lightHex: "#fbbf24" },
  { name: "Indigo", value: "indigo", hex: "#4f46e5", lightHex: "#6366f1" },
];

const FONT_SIZES = [
  { label: "Small", value: "sm", size: "13px" },
  { label: "Default", value: "md", size: "15px" },
  { label: "Large", value: "lg", size: "17px" },
];

const THEME_OPTIONS = [
  { label: "Dark", value: "dark", icon: Moon },
  { label: "Light", value: "light", icon: Sun },
  { label: "System", value: "system", icon: Monitor },
];

function Toggle({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
          checked ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function AppearancePage() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("system");
  const [accent, setAccent] = useState("violet");
  const [fontSize, setFontSize] = useState("md");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [dreamGlow, setDreamGlow] = useState(true);

  useEffect(() => {
    // Load saved settings
    const savedTheme = localStorage.getItem("velara-theme") as "dark" | "light" | "system" | null;
    const savedAccent = localStorage.getItem("velara-accent");
    const savedFont = localStorage.getItem("velara-font-size");
    const savedMotion = localStorage.getItem("velara-reduced-motion") === "true";
    const savedCompact = localStorage.getItem("velara-compact") === "true";
    const savedGlow = localStorage.getItem("velara-dream-glow") !== "false";

    if (savedTheme) setTheme(savedTheme);
    if (savedAccent) setAccent(savedAccent);
    if (savedFont) setFontSize(savedFont);
    setReducedMotion(savedMotion);
    setCompactMode(savedCompact);
    setDreamGlow(savedGlow);

    // Apply saved settings
    applyTheme(savedTheme || "system");
    applyAccent(savedAccent || "violet");
    applyFontSize(savedFont || "md");
    applyReducedMotion(savedMotion);
    applyCompact(savedCompact);
    applyDreamGlow(savedGlow);
  }, []);

  function applyTheme(t: "dark" | "light" | "system") {
    setTheme(t);
    localStorage.setItem("velara-theme", t);

    // Handle system preference
    if (t === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("light", !prefersDark);
      toast.success(`🌓 System theme (${prefersDark ? "Dark" : "Light"})`);
    } else {
      document.documentElement.classList.toggle("light", t === "light");
      toast.success(`${t === "dark" ? "🌙 Dark" : "☀️ Light"} mode activated`);
    }
  }

  function applyAccent(value: string) {
    setAccent(value);
    localStorage.setItem("velara-accent", value);
    
    // Find the color
    const color = ACCENT_COLORS.find(c => c.value === value);
    if (color) {
      // Set CSS variable for accent color
      const isDark = document.documentElement.classList.contains("light");
      const hex = isDark ? color.lightHex : color.hex;
      document.documentElement.style.setProperty("--accent-color", hex);
      
      // Also update primary color
      document.documentElement.style.setProperty("--primary", hex);
    }
    
    toast.success(`Accent color updated to ${color?.name} ✨`);
  }

  function applyFontSize(value: string) {
    setFontSize(value);
    localStorage.setItem("velara-font-size", value);
    const size = FONT_SIZES.find((f) => f.value === value)?.size ?? "15px";
    document.documentElement.style.setProperty("--base-font-size", size);
    document.documentElement.style.fontSize = size;
    toast.success("Font size updated");
  }

  function applyReducedMotion(value: boolean) {
    setReducedMotion(value);
    localStorage.setItem("velara-reduced-motion", String(value));
    document.documentElement.classList.toggle("reduced-motion", value);
  }

  function applyCompact(value: boolean) {
    setCompactMode(value);
    localStorage.setItem("velara-compact", String(value));
    document.documentElement.classList.toggle("compact-mode", value);
  }

  function applyDreamGlow(value: boolean) {
    setDreamGlow(value);
    localStorage.setItem("velara-dream-glow", String(value));
    document.documentElement.classList.toggle("dream-glow", value);
  }

  function toggleReducedMotion(v: boolean) {
    applyReducedMotion(v);
    toast.success(v ? "Reduced motion on" : "Animations restored");
  }

  function toggleCompact(v: boolean) {
    applyCompact(v);
    toast.success(v ? "Compact mode on" : "Comfortable mode on");
  }

  function toggleDreamGlow(v: boolean) {
    applyDreamGlow(v);
    toast.success(v ? "Dream glow enabled ✨" : "Dream glow off");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton className="mb-4" />

      <h2 className="font-display text-2xl sm:text-3xl mb-1 flex items-center gap-2">
        <Palette className="h-6 w-6 text-violet-400" />
        Appearance
      </h2>
      <p className="text-muted-foreground text-sm mb-8">Customize how Velara looks and feels.</p>

      <div className="space-y-4">
        {/* Theme */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Moon className="h-4 w-4 text-accent" /> Theme
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => applyTheme(opt.value as "dark" | "light" | "system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${
                    theme === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border/60 hover:bg-background/40"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{opt.label}</span>
                  {theme === opt.value && (
                    <span className="text-xs text-primary">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" /> Accent Color
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => applyAccent(color.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${
                  accent === color.value
                    ? "border-white/60 bg-white/5"
                    : "border-border/40 hover:bg-background/40"
                }`}
              >
                <div
                  className="h-8 w-8 rounded-full shadow-md"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs">{color.name}</span>
                {accent === color.value && (
                  <span className="text-[10px] text-muted-foreground">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Type className="h-4 w-4 text-accent" /> Text Size
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {FONT_SIZES.map((f) => (
              <button
                key={f.value}
                onClick={() => applyFontSize(f.value)}
                className={`p-4 rounded-xl border text-center transition ${
                  fontSize === f.value
                    ? "border-primary bg-primary/10"
                    : "border-border/60 hover:bg-background/40"
                }`}
              >
                <span style={{ fontSize: f.size }} className="font-medium block">
                  Aa
                </span>
                <span className="text-xs mt-1 block text-muted-foreground">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-card border rounded-2xl p-5 space-y-0 divide-y divide-border/60">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" /> Display Options
          </h3>

          {[
            {
              label: "Dream Glow",
              desc: "Soft glowing effects on dream cards",
              value: dreamGlow,
              onChange: toggleDreamGlow,
            },
            {
              label: "Reduced Motion",
              desc: "Minimize animations and transitions",
              value: reducedMotion,
              onChange: toggleReducedMotion,
            },
            {
              label: "Compact Mode",
              desc: "Tighter spacing for more content",
              value: compactMode,
              onChange: toggleCompact,
            },
          ].map((opt) => (
            <div key={opt.label} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <Toggle checked={opt.value} onCheckedChange={opt.onChange} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}