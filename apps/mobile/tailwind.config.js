/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        midnight: "#081A2E",
        navy: "#0B2440",
        cyanGlow: "#6FEFF2",
        brand: "#19C7E6",
        brandSoft: "#B7FBFF",
        cardBlue: "#102E4F",
        ink: "#EAF8FF",
        mutedInk: "#96B6C8",
        success: "#53D62C",
        warning: "#FFF13F"
      },
      boxShadow: {
        glow: "0 0 24px rgba(111,239,242,0.35)"
      }
    }
  },
  plugins: []
};
