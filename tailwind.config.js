/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tv: {
          dark: '#131722',
          surface: '#1e222d',
          border: '#2a2e39',
          hover: '#2a2e39',
          text: '#d1d4dc',
          muted: '#787b86'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    }
  },
  plugins: []
};
