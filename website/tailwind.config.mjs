export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      fontFamily: {
        cd: ["ClashDisplay-Variable", "sans-serif"],
        sans: ["GeneralSans-Variable", "sans-serif"],
      },
      colors: {
        black: "var(--black)",
        primary: "var(--primary)",
        secondary: "var(--gray)",
        "off-black": "var(--off-black)",
        "off-white": "var(--off-white)",
      },
      fontSize: {
        // https://codebeautify.org/rem-to-px-converter
        xs: ["0.75rem", { lineHeight: "1.125rem" }], //12px
        sm: ["0.875rem", { lineHeight: "1.45rem" }], //14px
        base: ["1rem", { lineHeight: "1.5rem" }], //16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], //18px
        xl: ["1.25rem", { lineHeight: "1.5rem" }], //20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], //24px
        "2xxl": ["1.625", { lineHeight: "2rem" }], //26px
        "3xl": ["1.75rem", { lineHeight: "2rem" }], //28px
        "4xl": ["2rem", { lineHeight: "2.25rem" }], //32px
        "5xl": ["2.5rem", { lineHeight: "3.25rem" }], //40px
        "6xl": ["3rem", { lineHeight: "1" }], //48px
        "7xl": ["3.75rem", { lineHeight: "1" }], //60px
        "8xl": ["4rem", { lineHeight: "1" }], //64px
        "9xl": ["4.5rem", { lineHeight: "1" }], //72px
        "10xl": ["6rem", { lineHeight: "1" }], //96px
      },
    },
  },
  plugins: [],
};
