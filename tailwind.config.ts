import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'pulse-red': 'pulseRed 1.5s ease-in-out infinite',
        'number-pop': 'numberPop 0.6s ease-out both',
        'slide-up': 'slideUp 0.3s ease-out both',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.4' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(239,68,68,0.3), inset 0 0 8px rgba(239,68,68,0.05)' },
          '50%': { boxShadow: '0 0 32px rgba(239,68,68,0.6), inset 0 0 12px rgba(239,68,68,0.1)' },
        },
        numberPop: {
          '0%': { opacity: '0', transform: 'scale(0.5) translateY(10px)' },
          '70%': { transform: 'scale(1.04) translateY(-2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
