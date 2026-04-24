/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New GOFIT Color Scheme - Golden & Pure Black
        // Golden Yellow Variants (#F2C228)
        'fitnix-gold': '#F2C228',            // Primary golden yellow
        'fitnix-gold-light': '#F5D563',      // Light golden (20% lighter)
        'fitnix-gold-lighter': '#F8E89B',    // Lighter golden (40% lighter)
        'fitnix-gold-dark': '#C29A1F',       // Dark golden (20% darker)
        'fitnix-gold-darker': '#8F7317',     // Darker golden (40% darker)
        
        // Pure Black Variants - All darker
        'fitnix-dark': '#000000',            // Pure black
        'fitnix-dark-light': '#0a0a0a',      // Almost black (4% lighter)
        'fitnix-dark-lighter': '#141414',    // Very dark gray (8% lighter)
        'fitnix-dark-darker': '#000000',     // Pure black
        'fitnix-dark-darkest': '#000000',    // Pure black
        
        // Neutral tones - darker
        'fitnix-gray': '#333333',            // Dark gray
        'fitnix-gray-light': '#4d4d4d',      // Medium gray
        'fitnix-off-white': '#f5f5f5',       // Off-white
        
        // Semantic colors (keeping for success/error/warning)
        'fitnix-red': '#FF3B30',             // Error/danger
        'fitnix-orange': '#FF9500',          // Warning
        'fitnix-green': '#34C759',           // Success
        'fitnix-blue': '#0EA5E9',            // Info
        
        // Legacy colors for backward compatibility
        primary: '#F2C228',
        secondary: '#1C191F',
        danger: '#FF3B30',
        warning: '#FF9500',
        success: '#34C759',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontWeight: {
        'thin': 100,
        'extralight': 200,
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
        'extrabold': 800,
        'black': 900,
      },
      boxShadow: {
        'fitnix': '0 2px 12px rgba(242, 194, 40, 0.15)',
        'fitnix-lg': '0 6px 24px rgba(242, 194, 40, 0.2)',
        'fitnix-xl': '0 10px 30px rgba(242, 194, 40, 0.25)',
        'fitnix-glow': '0 0 20px rgba(242, 194, 40, 0.3)',
        'fitnix-inner': 'inset 0 2px 8px rgba(28, 25, 31, 0.4)',
        'gold-glow': '0 0 20px rgba(242, 194, 40, 0.6), 0 0 40px rgba(242, 194, 40, 0.4), 0 0 60px rgba(242, 194, 40, 0.2)',
        'dark-glow': '0 0 10px rgba(28, 25, 31, 0.5), 0 0 20px rgba(28, 25, 31, 0.3)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #F2C228 0%, #F5D563 100%)',
        'gradient-dark': 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
        'gradient-gold-dark': 'linear-gradient(135deg, #F2C228 0%, #000000 100%)',
        'gradient-dark-gold': 'linear-gradient(135deg, #000000 0%, #F2C228 100%)',
        'gradient-glow': 'linear-gradient(135deg, #F2C228 0%, #F8E89B 50%, #F2C228 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(242, 194, 40, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0, 0, 0, 0.5) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(242, 194, 40, 0.1) 0px, transparent 50%)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scan-line': 'scanLine 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(242, 194, 40, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(242, 194, 40, 0.7)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        scanLine: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}