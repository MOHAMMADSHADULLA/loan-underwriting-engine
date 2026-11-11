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
          lime: '#A3E635',
          'lime-light': '#B4F04D',
          'lime-hover': '#8FD722',
          forest: '#0F291E',
          'forest-light': '#183B2C',
          'forest-dark': '#091A13',
          surface: '#F8FAF7',
          canvas: '#ECEEEB',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 41, 30, 0.05), 0 2px 6px -1px rgba(15, 41, 30, 0.03)',
        'card': '0 10px 30px -4px rgba(15, 41, 30, 0.06), 0 4px 10px -2px rgba(15, 41, 30, 0.03)',
        'hero': '0 20px 40px -10px rgba(163, 230, 53, 0.25)',
      },
    },
  },
  plugins: [],
}
