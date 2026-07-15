/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: "#10B981",
        brandDark: "#047857",
        brandSoft: "#D1FAE5",
      },
      boxShadow: {
        glow: "0 10px 28px rgba(16,185,129,0.18)",
      },
    },
  },
  plugins: [],
};
