/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        BgColor : "var(--color-BgColor)",
        BgPrimaryColor : "var(--color-BgPrimaryColor)",
        BgSecondaryColor : "var(--color-BgSecondaryColor)",
        BgTertiaryColor : "var(--color-BgTertiaryColor)",
        BorderColor : "var(--color-BorderColor)",
        TextPrimaryColor : "var(--color-TextPrimaryColor)",
        TextSecondaryColor : "var(--color-TextSecondaryColor)",
      },
      boxShadow: {
        'custom': 'rgba(0, 0, 0, 0.15) 0px 3px 3px 0px',
        'cards': 'rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px'
      },
    }
  },
  plugins: [],
}