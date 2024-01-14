/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./web/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        '#4ec9b0': '#4ec9b0',
        '#dcdcaa': '#dcdcaa',
      }
    },
  },
  plugins: [],
}