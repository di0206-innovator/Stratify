/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        card: 'var(--color-card)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-muted': 'var(--color-accent-muted)',
        'surface-dark': 'var(--color-surface-dark)',
        'surface-warm': 'var(--color-surface-warm)',
        'text-primary': 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        hover: 'var(--color-hover)',
        'input-bg': 'var(--color-input-bg)',
        // Keep neo aliases for backward compatibility with internal pages
        neo: {
          canvas: 'var(--color-canvas)',
          black: 'var(--color-text)',
          border: 'var(--color-border)',
        }
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
        light: 'var(--color-border-light)',
      },
      boxShadow: {
        'card': '0 1px 3px 0 var(--color-shadow)',
        'card-hover': '0 8px 25px -5px var(--color-shadow), 0 4px 10px -5px var(--color-shadow)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
