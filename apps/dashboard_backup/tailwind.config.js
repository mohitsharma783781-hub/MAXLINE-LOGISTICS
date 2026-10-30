/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          dark: '#0B132B',
          slate: '#1E293B',
          blue: '#2563EB',
          blueHover: '#1D4ED8',
          blueLight: '#EFF6FF',
          subtle: '#3B82F6',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          borderSubtle: '#F1F5F9',
        },
        sidebar: {
          bg: '#0F172A',
          card: '#1E293B',
          hover: '#1E293B',
          border: '#1E293B',
          text: '#94A3B8',
          active: '#2563EB',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        accent: {
          blue: '#2563EB',
          teal: '#0D9488',
          emerald: '#16A34A',
          violet: '#7C3AED',
          amber: '#D97706',
          rose: '#E11D48',
        }
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card': '0 1px 3px 0 rgb(15 23 42 / 0.04), 0 4px 12px -2px rgb(15 23 42 / 0.03)',
        'subtle': '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 6px -1px rgb(0 0 0 / 0.02)',
        'glow-blue': '0 0 18px -2px rgba(37, 99, 235, 0.35)',
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
