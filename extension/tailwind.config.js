/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#667eea",
        "brand-purple": "#764ba2",
        positive: "#10b981",
        negative: "#f59e0b",
      },
    },
  },
  plugins: [],
};
