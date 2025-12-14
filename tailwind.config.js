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
        primary: {
          DEFAULT: '#007AFF',
          hover: '#0056CC',
          light: '#4DA3FF'
        },
        secondary: {
          DEFAULT: '#5856D6',
          hover: '#4240A8',
          light: '#7F7EE8'
        },
        success: {
          DEFAULT: '#34C759',
          hover: '#28A745'
        },
        warning: {
          DEFAULT: '#FF9500',
          hover: '#E58600'
        },
        danger: {
          DEFAULT: '#FF3B30',
          hover: '#E02D24'
        },
        surface: {
          DEFAULT: '#2C2C2E',
          light: '#3C3C3E',
          dark: '#1C1C1E'
        },
        border: {
          DEFAULT: '#38383A',
          light: '#48484A'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#98989D',
          muted: '#636366'
        }
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px'
      },
      borderRadius: {
        'card': '8px',
        'input': '6px'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace']
      },
      fontSize: {
        'heading': ['20px', { fontWeight: '600' }],
        'body': ['14px', { fontWeight: '400' }],
        'caption': ['12px', { fontWeight: '400' }]
      },
      transitionDuration: {
        'fast': '200ms'
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'dropdown': '0 8px 24px rgba(0, 0, 0, 0.4)'
      }
    },
  },
  plugins: [],
}
