import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#0a0a0a',
        'surface-hover': '#141414',
        'surface-active': '#1a1a1a',
        primary: '#00ff88',
        'primary-hover': '#00cc6a',
        secondary: '#ff3366',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0a0',
        'text-muted': '#606060',
        border: '#222222',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
