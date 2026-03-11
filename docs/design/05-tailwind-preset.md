# Tailwind CSS Configuration

Copy this directly into `dashboard/tailwind.config.ts`.
All values from `01-design-tokens.json` mapped to Tailwind utilities.

---

## Full config

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds (elevation model)
        bg: {
          base:     "#0A0A0B",
          surface1: "#141415",
          surface2: "#1C1C1E",
          surface3: "#252528",
        },
        border: {
          DEFAULT:  "#2A2A2D",
          hover:    "#3A3A3D",
          focus:    "#3B82F6",
        },
        text: {
          primary:   "#ECECEC",
          secondary: "#A1A1AA",
          muted:     "#71717A",
          inverse:   "#0A0A0B",
        },
        accent: {
          blue:   "#3B82F6",
          purple: "#8B5CF6",
        },
        verdict: {
          build: "#22C55E",
          bet:   "#EAB308",
          flip:  "#F97316",
          kill:  "#EF4444",
        },
        game: {
          gold:        "#D4A574",
          "gold-bright":"#FBBF24",
          bronze:      "#CD7F32",
          silver:      "#C0C0C0",
          diamond:     "#B9F2FF",
        },
        source: {
          google:      "#4285F4",
          hackernews:  "#FF6600",
          reddit:      "#FF4500",
          youtube:     "#FF0000",
          github:      "#E6E6E6",
          devto:       "#3B49DF",
          producthunt: "#DA552F",
          techcrunch:  "#0A9B2C",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
      },
      fontSize: {
        "h1":      ["28px", { lineHeight: "36px", fontWeight: "600", letterSpacing: "-0.02em" }],
        "h2":      ["20px", { lineHeight: "28px", fontWeight: "600", letterSpacing: "-0.01em" }],
        "h3":      ["16px", { lineHeight: "24px", fontWeight: "500" }],
        "body":    ["14px", { lineHeight: "22px", fontWeight: "400" }],
        "caption": ["12px", { lineHeight: "16px", fontWeight: "400", letterSpacing: "0.01em" }],
        "badge":   ["11px", { lineHeight: "14px", fontWeight: "600", letterSpacing: "0.02em" }],
        "score":   ["32px", { lineHeight: "40px", fontWeight: "600" }],
        "score-sm":["18px", { lineHeight: "24px", fontWeight: "600" }],
      },
      spacing: {
        "4.5": "18px",
        "13":  "52px",
        "15":  "60px",
        "18":  "72px",
      },
      width: {
        "sidebar":          "240px",
        "sidebar-collapsed":"64px",
        "command-palette":  "560px",
      },
      height: {
        "topbar": "56px",
      },
      borderRadius: {
        "card":  "12px",
        "modal": "16px",
        "btn":   "8px",
        "pill":  "9999px",
      },
      boxShadow: {
        "legendary": "0 0 20px rgba(251, 191, 36, 0.08)",
        "achievement": "0 0 20px rgba(251, 191, 36, 0.1)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.15)",
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #3B82F6, #8B5CF6)",
        "gradient-xp":     "linear-gradient(90deg, #3B82F6, #8B5CF6)",
        "gradient-gold":   "linear-gradient(135deg, #FBBF24, #F59E0B)",
        "shimmer":         "linear-gradient(90deg, #1C1C1E 0%, #252528 50%, #1C1C1E 100%)",
      },
      backdropBlur: {
        "modal": "20px",
        "overlay": "16px",
      },
      keyframes: {
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(251, 191, 36, 0.08)" },
          "50%":      { boxShadow: "0 0 30px rgba(251, 191, 36, 0.15)" },
        },
        "flame-sway": {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "25%":      { transform: "translateX(1px) rotate(2deg)" },
          "75%":      { transform: "translateX(-1px) rotate(-2deg)" },
        },
        "float-up": {
          "0%":   { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-40px)", opacity: "0" },
        },
        "slide-in-right": {
          "0%":   { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "shimmer":     "shimmer 1.5s linear infinite",
        "pulse-glow":  "pulse-glow 2s ease-in-out infinite",
        "flame":       "flame-sway 2s ease-in-out infinite",
        "float-up":    "float-up 0.8s ease-out forwards",
        "slide-in":    "slide-in-right 0.3s ease-out",
      },
      transitionDuration: {
        "fast": "150ms",
        "normal": "200ms",
        "slow": "300ms",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};

export default config;
```

---

## CSS Variables (add to `app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* These mirror Tailwind config but are available in raw CSS and shadcn/ui */
    --bg-base: #0A0A0B;
    --bg-surface1: #141415;
    --bg-surface2: #1C1C1E;
    --bg-surface3: #252528;
    --border: #2A2A2D;
    --border-hover: #3A3A3D;
    --text-primary: #ECECEC;
    --text-secondary: #A1A1AA;
    --text-muted: #71717A;
    --accent-blue: #3B82F6;
    --accent-purple: #8B5CF6;
    --verdict-build: #22C55E;
    --verdict-bet: #EAB308;
    --verdict-flip: #F97316;
    --verdict-kill: #EF4444;
    --gold: #D4A574;
    --gold-bright: #FBBF24;

    /* shadcn/ui required variables (dark theme) */
    --background: 0 0% 4%;
    --foreground: 0 0% 93%;
    --card: 0 0% 8%;
    --card-foreground: 0 0% 93%;
    --popover: 0 0% 8%;
    --popover-foreground: 0 0% 93%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 11%;
    --secondary-foreground: 0 0% 93%;
    --muted: 0 0% 11%;
    --muted-foreground: 0 0% 48%;
    --accent: 0 0% 11%;
    --accent-foreground: 0 0% 93%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 16%;
    --input: 0 0% 16%;
    --ring: 217 91% 60%;
    --radius: 8px;
  }

  * {
    border-color: var(--border);
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Scrollbar styling (subtle, matches dark theme) */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #2A2A2D;
    border-radius: 9999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #3A3A3D;
  }

  /* Selection color */
  ::selection {
    background: rgba(59, 130, 246, 0.3);
    color: #ECECEC;
  }
}

/* Utility classes for common patterns */
@layer components {
  .card-base {
    @apply bg-bg-surface1 border border-border rounded-card;
  }
  .card-hover {
    @apply hover:bg-bg-surface2 hover:border-border-hover transition-all duration-fast;
  }
  .card-legendary {
    @apply border-[rgba(251,191,36,0.3)] shadow-legendary animate-pulse-glow;
  }
  .text-score-color {
    /* Apply via JS: green if 7+, yellow if 4.5-7, red if <4.5 */
  }
  .verdict-pill {
    @apply font-mono text-score-sm font-semibold rounded-card px-3 py-2 text-center;
  }
  .nav-item {
    @apply flex items-center gap-2.5 px-3 py-2 rounded-btn text-text-muted hover:text-text-secondary hover:bg-bg-surface1 transition-colors duration-fast;
  }
  .nav-item-active {
    @apply text-text-primary bg-bg-surface2 border-l-2 border-accent-blue;
  }
  .skeleton {
    @apply bg-bg-surface2 rounded-card bg-shimmer bg-[length:200%_100%] animate-shimmer;
  }
  .ghost-key {
    @apply inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-badge text-text-muted border border-border rounded-btn;
  }
}
```

---

## Font Loading (add to `app/layout.tsx`)

```typescript
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// In the html tag:
// <html className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
```
