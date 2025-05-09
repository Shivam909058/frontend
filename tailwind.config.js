/** @type {import('tailwindcss').Config} */
import withMT from "@material-tailwind/react/utils/withMT";
import plugin from "tailwindcss/plugin";

export default withMT({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      purple: "#8E52DA",
      babyPink: "#F5EDFF",
      orange: "#FC5A30",
      darkYellow: "#DCEC59",
      lightYellow: "#F7FFB8",
      white: "#FFFFFF",
      black: "#000000",
      lightgreen: "#dceb5a",
      ui: {
        1: "#F6F8FB",
        5: "#ECEFF4",
        10: "#DEE4ED",
        20: "#CBD4E1",
        30: "#B6C2D3",
        40: "#9AA8BC",
        50: "#728197",
        60: "#525E6F",
        70: "#3B4554",
        80: "#27313F",
        90: "#120226",
      },
      informative: {
        1: "#F2F7FF",
        5: "#E0EDFF",
        10: "#BDDAFF",
        20: "#86B8FE",
        30: "#5598F6",
        40: "#2D7AE5",
        50: "#105FCE",
        60: "#004AB1",
        70: "#003B8D",
        80: "#002962",
        90: "#001532",
      },
      positive: {
        1: "#F4FFF2",
        5: "#E1FCDE",
        10: "#CDF9CA",
        20: "#A4F3A3",
        30: "#7EEB83",
        40: "#42D75B",
        50: "#17BF33",
        60: "#049B22",
        70: "#016A1C",
        80: "#005016",
        90: "#00300F",
      },
      warning: {
        1: "#FFFBF2",
        5: "#FFF2D2",
        10: "#FFE8B1",
        20: "#FFCF73",
        30: "#FCB33B",
        40: "#F2930D",
        50: "#D66F00",
        60: "#BA5900",
        70: "#943C00",
        80: "#662100",
        90: "#340D00",
      },
      negative: {
        1: "#FFF2F3",
        5: "#FFD4D8",
        10: "#FFB6BC",
        20: "#FA7D87",
        30: "#F14A58",
        40: "#E42131",
        50: "#CE0718",
        60: "#B1000F",
        70: "#8D000C",
        80: "#620008",
        90: "#320004",
      },
    },
    fontSize: {
      "h2-m": ["32px", { lineHeight: "34px" }],
      h3: ["32px", { lineHeight: "20px" }],
      "h3-m": ["24px", { lineHeight: "40px" }],
      h4: ["20px", { lineHeight: "68px" }],
      "h4-m": ["20px", { lineHeight: "28px" }],
      h5: ["16px", { lineHeight: "28px" }],
      "h5-m": ["10px", { lineHeight: "29.55px" }],
      "h6-m": ["8px", { lineHeight: "14.84px" }],
      big: ["20px", { lineHeight: "20px" }],
      body: ["16px", { lineHeight: "20px" }],
      medium: ["14px", { lineHeight: "20px" }],
      small: ["12px", { lineHeight: "20px" }],
      place: ["10px", { lineHeight: "12px" }],
      card: ["14px", { lineHeight: "20px" }],
      thin: ["12px", { lineHeight: "16px" }],
      logoTextBig: ["34px", { lineHeight: "48px" }],
    },
    fontFamily: {
      lexend: ["Lexend", "sans-serif"],
      anton: ["Anton", "sans-serif"],
      playfair: ["Playfair Display", "serif"],
      montserrat: ["Montserrat", "sans-serif"],
      clash: ["Clash Display", "sans-serif"],
    },
    borderWidth: {
      0: "0px",
      0.4: "0.4px",
      0.8: "0.8px",
      1: "1px",
      10: "10px",
    },
    extend: {
      boxShadow: {
        messageShadow: "0px 0px 4px rgba(0, 0, 0, 0.2)",
        searchShadow: "0px 4px 4px 0px #00000040",
      },
      spacing: {
        135: "33.625",
      },
      borderRadius: {
        "4xl": "60px",
      },
      backgroundImage: {
        "main-gradient":
          "radial-gradient(50% 50% at 50% 50%, rgba(248, 118, 49, 0.3) 0%, rgba(248, 118, 49, 0) 100%)",
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.2s ease-in',
      }
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        ".placeholder-lg": {
          "&::placeholder": {
            fontSize: "16px",
          },
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    }),
  ],
});
