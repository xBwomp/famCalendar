/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#EC4899',
        neutral: '#6B7280',
        base: '#F9FAFB',
        info: '#06B6D4',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
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
