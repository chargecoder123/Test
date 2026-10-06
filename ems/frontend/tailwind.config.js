/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15213b',
        muted: '#77839b',
        canvas: '#f5f7fb',
        brand: {
          50: '#edf4ff',
          100: '#dceaff',
          300: '#aac8ff',
          500: '#3c70f4',
          600: '#315fe0',
          700: '#244cbe',
        },
      },
      boxShadow: {
        soft: '0 8px 30px rgba(29, 45, 77, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
