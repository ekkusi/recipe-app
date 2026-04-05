/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Mirrors web app pastel theme (converted from oklch)
        background: '#faf7f0',
        foreground: '#362d22',
        primary: {
          DEFAULT: '#c27070',
          foreground: '#faf4f4',
        },
        secondary: {
          DEFAULT: '#d9eadc',
          foreground: '#3a5e3e',
        },
        accent: {
          DEFAULT: '#d5cee6',
          foreground: '#4b3a73',
        },
        muted: {
          DEFAULT: '#f2efe9',
          foreground: '#8a7a68',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#362d22',
        },
        border: '#e6e1da',
        input: '#ece8e1',
        ring: '#c27070',
        destructive: {
          DEFAULT: '#e05a3a',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
