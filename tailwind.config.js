/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // BlackRoc custom color palette
        jet: {
          DEFAULT: "#464344",
          100: "#0e0d0e",
          200: "#1c1b1b",
          300: "#2a2829",
          400: "#383637",
          500: "#464344",
          600: "#6c6869",
          700: "#928d8f",
          800: "#b6b3b4",
          900: "#dbd9da",
        },
        champagne: {
          DEFAULT: "#DCCBC3",
          100: "#34251f",
          200: "#684b3d",
          300: "#9c705c",
          400: "#bd9d8e",
          500: "#dccbc3",
          600: "#e2d5ce",
          700: "#e9dfda",
          800: "#f1eae7",
          900: "#f8f4f3",
        },
        battleship: {
          DEFAULT: "#898788",
          100: "#1b1b1b",
          200: "#373636",
          300: "#525051",
          400: "#6d6b6c",
          500: "#898788",
          600: "#a09e9f",
          700: "#b8b6b7",
          800: "#d0cfcf",
          900: "#e7e7e7",
        },
        buff: {
          DEFAULT: "#CE9B7F",
          100: "#301d12",
          200: "#603924",
          300: "#905637",
          400: "#bc744e",
          500: "#ce9b7f",
          600: "#d8ae97",
          700: "#e2c2b1",
          800: "#ebd6cb",
          900: "#f5ebe5",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
