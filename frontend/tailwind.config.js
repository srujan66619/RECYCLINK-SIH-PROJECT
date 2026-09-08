/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#0F5132',
          950: '#052e16',
        },
        slate: {
          850: '#151f32',
          900: '#0F172A',
          950: '#080d1a',
        }
      }
    },
  },
  plugins: [],
}
