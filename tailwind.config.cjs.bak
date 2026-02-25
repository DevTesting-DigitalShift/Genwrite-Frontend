/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./node_modules/daisyui/dist/**/*.js", "index.html"], // Optional for DaisyUI components
  theme: {
    extend: {
      screens: {
        xs: "475px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      fontFamily: { montserrat: ["Montserrat", "sans-serif"] },
    },
  },
  daisyui: { themes: ["light"] },
  plugins: [require("daisyui")],
}
