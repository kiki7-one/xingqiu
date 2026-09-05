/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ===== 奶淡黄色治愈风（Dimoo IP 色板）=====
        cream: {
          50: "#FFF9F0",   // 米白 · 页面底色
          100: "#FFF3E6",  // 浅奶 · 卡片悬浮
          200: "#F5E6D3",  // 奶油主色 · 背景/卡片
          300: "#E8D4BC",  // 浅棕 · 边框/分割线
          400: "#D4BFA0",  // 中棕 · 占位符
          500: "#C4A882",  // 暖棕 · 主操作按钮
          600: "#B08E68",  // 深棕 · 次要文字
          700: "#8B7355",  // 更深棕
          800: "#6B5744",  // 深色文字
          900: "#5A4A3A",  // 标题/强调文字
          warm: "#FAF0E4", // 暖奶油（圆角别名保留）
        },
        sage: {
          50: "#F4F7F3",
          100: "#E8F0E4",
          200: "#D4E5D7",  // 鼠尾草绿 · 成功/正向背景
          300: "#B8CCBA",
          400: "#9FBF97",
          500: "#8AA87A",  // 主绿 · 成功状态
          600: "#739461",
          700: "#5C7A4D",
          800: "#48633D",
          900: "#384D30",
        },
        // ===== 点缀色（低饱和莫兰迪）=====
        accent: {
          pink: "#F5C6CB",     // 樱花粉 · 收藏/喜欢
          yellow: "#FCE192",   // 奶油黄 · 提醒/待办
          lavender: "#E0D4F0", // 薰衣草紫 · 标签/分类
          blue: "#B8D4E8",     // 天空蓝 · 链接/信息
        },
        // ===== 功能色（柔和版）=====
        success: "#8FBC8F",    // 莫兰迪绿
        warning: "#DEB887",    // 暖沙色
        error: "#CD919E",      // 玫瑰粉
        info: "#A8C4DB",       // 雾霾蓝
      },
      fontFamily: {
        sans: [
          "PingFang SC",
          "Hiragino Sans GB",
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      borderRadius: {
        warm: "1rem",       // 卡片圆角（保留）
        "warm-lg": "1.25rem", // 弹窗大圆角
        "warm-xl": "20px",   // 弹窗超大圆角
      },
      backdropBlur: {
        xs: "2px",
        glass: "12px",
        "glass-lg": "18px",
        "glass-xl": "20px",
      },
      boxShadow: {
        glass:
          "0 2px 8px rgba(90,74,58,0.06), 0 8px 24px rgba(90,74,58,0.04)",
        "glass-lg":
          "0 8px 32px rgba(90,74,58,0.12), 0 2px 8px rgba(90,74,58,0.08)",
        soft: "0 1px 3px rgba(90,74,58,0.08)",
      },
    },
  },
  plugins: [],
};
