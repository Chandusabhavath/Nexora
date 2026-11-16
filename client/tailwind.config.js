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
          50: '#F0F7F4',
          100: '#DCEEE6',
          200: '#BADECF',
          300: '#8DC7B1',
          400: '#5BA98F',
          500: '#3A8C73',
          600: '#2A705B',
          700: '#1F5747',
          800: '#0F382C', // Approved Primary Deep Forest Green
          900: '#0A2920', // Approved Deep Navbar / Accent Green
          950: '#051712',
        },
        surface: {
          50: '#F8FAF8',  // Approved soft neutral background
          100: '#F1F4F1', // Approved card soft neutral background
          200: '#E5E9E5', // Approved neutral border
          300: '#D1D7D1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      }
    },
  },
  plugins: [],
}
