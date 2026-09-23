/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f3efe6',
        ink: '#1c1915',
        mute: '#6f675d',
        line: '#e2dacd',
        card: '#faf8f4',
        accent: '#9a3412',
        pine: '#1f4d3a',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sheet: '0 22px 50px rgba(48, 36, 22, 0.12), 0 2px 8px rgba(48, 36, 22, 0.05)',
      },
    },
  },
  plugins: [],
};
