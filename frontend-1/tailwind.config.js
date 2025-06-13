/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF', // Example primary color (blue)
        secondary: '#10B981', // Example secondary color (green)
      },
    },
  },
  plugins: [],
}