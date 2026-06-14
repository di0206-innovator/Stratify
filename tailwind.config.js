/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neo: {
          canvas: 'var(--color-canvas)',
          lime: 'var(--color-lime)',
          orange: 'var(--color-orange)',
          lavender: 'var(--color-lavender)',
          pink: 'var(--color-pink)',
          black: 'var(--color-text)',
          border: 'var(--color-border)',
        }
      },
      boxShadow: {
        'neo-hard': 'var(--shadow-neo)',
        'neo-button': 'var(--shadow-neo-btn)',
        'neo-button-hover': '1px 1px 0px 0px var(--color-border)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
