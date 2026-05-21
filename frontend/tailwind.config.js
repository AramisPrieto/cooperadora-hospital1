/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: '#f0fbf9',
          100: '#dcf7f1',
          200: '#b9eedf',
          500: '#14b8a6', // Principal Teal/Aqua
          600: '#0d9488',
          700: '#0f766e',
          900: '#115e59',
        },
        accent: {
          red: '#e5141a', // Rojo Cruz Roja/Necochea del Wireframe
          soft: '#fef2f2',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
