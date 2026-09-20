/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#F5F0E5',
          50: '#FDFBF7',
          100: '#F5F0E5',
          200: '#E8DFC8',
          300: '#DBCFAC',
        },
        forest: {
          DEFAULT: '#173A2D',
          950: '#0B1A14',
          900: '#0F261E',
          800: '#173A2D',
          700: '#1F4C3C',
          600: '#2A634F',
        },
        earth: {
          DEFAULT: '#426047',
          light: '#567A5C',
          dark: '#314935',
        },
        gold: {
          DEFAULT: '#C49A45',
          light: '#D4B066',
          dark: '#A68031',
        },
        charcoal: {
          DEFAULT: '#20231F',
          muted: '#4A4E49',
          light: '#727771',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.02em',
        editorial: '0.2em',
        kicker: '0.25em',
        expansive: '0.3em',
      },
      aspectRatio: {
        '16/10': '16 / 10',
        '3/2': '3 / 2',
        '4/5': '4 / 5',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        editorial: '0 4px 20px -2px rgba(23, 58, 45, 0.06)',
        'editorial-hover': '0 12px 32px -4px rgba(23, 58, 45, 0.12)',
      },
    },
  },
  plugins: [],
};
