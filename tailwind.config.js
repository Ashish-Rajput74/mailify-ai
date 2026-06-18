/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: '#0D0D0D',
        paper: '#F7F6F3',
        muted: '#6B6B6B',
        accent: '#5B4FFF',
        'accent-light': '#EAE8FF',
        success: '#16A34A',
        danger: '#DC2626',
        border: '#E4E2DC',
      }
    }
  },
  plugins: []
}
