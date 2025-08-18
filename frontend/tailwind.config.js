/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // YouTube-inspired VideoTube Color Palette
        // Day (Light) Theme
        day: {
          background: '#FFFFFF',      // pure white
          backgroundAlt: '#FAFAFA',   // slight off-white for less eye strain
          surface: '#FFFFFF',         // cards/panels same as background
          primary: '#FF3B30',         // vibrant red for subscribe buttons
          secondary: '#007AFF',       // calm blue for links/highlights
          textPrimary: '#1C1C1E',     // almost black for headings
          textSecondary: '#666666',   // subtle gray for metadata
          border: '#E5E5EA',          // light neutral gray for separation
          hover: '#F2F2F7',           // light gray hover effect
        },
        // Night (Dark) Theme
        night: {
          background: '#121212',      // deep black modern dark
          surface: '#1E1E1E',         // slightly lighter panels
          primary: '#FF453A',         // softer red for dark mode
          secondary: '#0A84FF',       // bright clean blue
          textPrimary: '#FFFFFF',     // pure white for titles
          textSecondary: '#B0B0B0',   // soft gray for descriptions
          border: '#2C2C2E',          // subtle contrast lines
          hover: '#2A2A2A',           // slight lift effect
        },
        // Legacy support (will be replaced)
        dark: {
          primary: '#121212',
          secondary: '#1E1E1E',
          tertiary: '#2A2A2A',
          accent: '#2C2C2E',
        },
        light: {
          primary: '#FFFFFF',
          secondary: '#FAFAFA',
          tertiary: '#F2F2F7',
          accent: '#E5E5EA',
        },
        brand: {
          primary: '#FF3B30',
          secondary: '#007AFF',
          tertiary: '#FF453A',
        }
      },
      fontFamily: {
        sans: ['Ubuntu', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
