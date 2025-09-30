/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6366F1',
        accent: '#F59E0B',
        neutral: '#6B7280',
        base: '#F9FAFB',
        info: '#38BDF8',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      fontSize: {
        '2xs': '.625rem',
      },
    },
  },
  plugins: [],
};
