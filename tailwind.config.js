/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 暖色系主题
        cream: {
          50: "#fdf8f3",
          100: "#faf0e6",
          200: "#f3e0c8",
          300: "#e9c79c",
          400: "#dca874",
          500: "#cf9256",
          600: "#b87642",
          700: "#965c36",
          800: "#784b31",
          900: "#603e29",
        },
        sage: {
          50: "#f4f7f3",
          100: "#e3ece0",
          200: "#c7d9c1",
          300: "#9fbf97",
          400: "#76a369",
          500: "#58894b",
          600: "#466e3c",
          700: "#395832",
          800: "#2f4629",
          900: "#283a23",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Microsoft YaHei",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      borderRadius: {
        warm: "1rem",
      },
    },
  },
  plugins: [],
};
