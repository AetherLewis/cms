/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        star: {
          50: '#fbfdfd',
          100: '#f3fafc',
          200: '#e5f2f5',
          300: '#c7dce2',
          400: '#96bfc9',
          500: '#5c9fae',
          600: '#3d8091',
          700: '#2e6373',
          800: '#265260',
          900: '#1d424f',
          950: '#0f252e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
