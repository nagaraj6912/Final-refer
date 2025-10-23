// No import needed at the top

// Use lowercase 'config' and remove any type annotation like ': Config'
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  // The 'daisyui' key itself is correct
  daisyui: {
    themes: [
      {
        quickearn: {
          "primary": "#16a34a", // Green 600
          "primary-focus": "#15803d", // Green 700
          "primary-content": "#ffffff",
          "secondary": "#f97316", // Orange 500
          "accent": "#3b82f6", // Blue 500
          "neutral": "#3d4451",
          "base-100": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
      "light", // fallback
    ],
  },
};

// Export the lowercase 'config' variable
export default config;

