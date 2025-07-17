/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sky-blue': '#87CEEB',
        'cockpit-dark': '#1a1a1a',
        'cockpit-green': '#00FF00',
        'warning-amber': '#FFA500',
        'danger-red': '#FF0000',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'digital': ['Orbitron', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
