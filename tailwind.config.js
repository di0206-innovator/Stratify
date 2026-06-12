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
          canvas: '#F8F7F4',
          lime: '#A3E635',
          orange: '#FB923C',
          lavender: '#C084FC',
          pink: '#F472B6',
          black: '#000000',
        }
      },
      boxShadow: {
        'neo-hard': '5px 5px 0px 0px #000000',
        'neo-button': '3px 3px 0px 0px #000000',
        'neo-button-hover': '1px 1px 0px 0px #000000',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
