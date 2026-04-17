/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // RoyalGuard AI — Unique Design System (CSS Variable driven for theme switching)
        // Uses rgb(var(--rgb) / <alpha-value>) pattern for Tailwind opacity modifier support
        'rg': {
          // Backgrounds
          'bg-deep': 'rgb(var(--rg-bg-deep-rgb) / <alpha-value>)',
          'bg-primary': 'rgb(var(--rg-bg-primary-rgb) / <alpha-value>)',
          'bg-secondary': 'rgb(var(--rg-bg-secondary-rgb) / <alpha-value>)',
          'bg-tertiary': 'rgb(var(--rg-bg-tertiary-rgb) / <alpha-value>)',
          'bg-elevated': 'rgb(var(--rg-bg-elevated-rgb) / <alpha-value>)',
          'bg-card': 'rgb(var(--rg-bg-card-rgb) / <alpha-value>)',
          
          // Accents
          'gold': 'rgb(var(--rg-accent-gold-rgb) / <alpha-value>)',
          'gold-dim': 'var(--rg-accent-gold-dim)',
          'gold-bright': 'rgb(var(--rg-accent-gold-rgb) / 1)',
          'cyan': 'rgb(var(--rg-accent-cyan-rgb) / <alpha-value>)',
          'cyan-dim': 'var(--rg-accent-cyan-dim)',
          'rose': 'rgb(var(--rg-accent-rose-rgb) / <alpha-value>)',
          'rose-dim': 'var(--rg-accent-rose-dim)',
          'violet': 'rgb(var(--rg-accent-violet-rgb) / <alpha-value>)',
          'violet-dim': 'var(--rg-accent-violet-dim)',
          
          // Status
          'success': 'rgb(var(--rg-success-rgb) / <alpha-value>)',
          'warning': 'rgb(var(--rg-warning-rgb) / <alpha-value>)',
          'danger': 'rgb(var(--rg-danger-rgb) / <alpha-value>)',
          'error': 'rgb(var(--rg-danger-rgb) / <alpha-value>)',
          'info': 'rgb(var(--rg-info-rgb) / <alpha-value>)',
          
          // Text
          'text-primary': 'rgb(var(--rg-text-primary-rgb) / <alpha-value>)',
          'text-secondary': 'rgb(var(--rg-text-secondary-rgb) / <alpha-value>)',
          'text-tertiary': 'rgb(var(--rg-text-tertiary-rgb) / <alpha-value>)',
          'text-muted': 'rgb(var(--rg-text-muted-rgb) / <alpha-value>)',
          
          // Border
          'border-subtle': 'var(--rg-border-subtle)',
          'border-default': 'var(--rg-border-default)',
          'border-highlight': 'var(--rg-border-highlight)',
        },
        
        // Shadcn compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      
      borderRadius: {
        'rg-sm': '6px',
        'rg-md': '10px',
        'rg-lg': '16px',
        'rg-xl': '24px',
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      
      boxShadow: {
        'rg-sm': 'var(--rg-shadow-sm)',
        'rg-md': 'var(--rg-shadow-md)',
        'rg-lg': 'var(--rg-shadow-lg)',
        'rg-gold': 'var(--rg-shadow-gold)',
        'rg-cyan': 'var(--rg-shadow-cyan)',
        'rg-rose': '0 0 40px rgba(255, 77, 109, 0.15)',
        'rg-inner': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      
      backgroundImage: {
        'gradient-gold': 'var(--rg-gradient-gold)',
        'gradient-cyan': 'var(--rg-gradient-cyan)',
        'gradient-rose': 'var(--rg-gradient-rose)',
        'gradient-dark': 'var(--rg-gradient-dark)',
        'gradient-shine': 'var(--rg-gradient-shine)',
        'gradient-radial-gold': 'radial-gradient(ellipse at 50% 0%, rgba(255, 184, 0, 0.08) 0%, transparent 50%)',
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            opacity: "1",
            boxShadow: "0 0 20px rgba(255, 184, 0, 0.3)"
          },
          "50%": { 
            opacity: "0.9",
            boxShadow: "0 0 40px rgba(255, 184, 0, 0.5)"
          },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "progress-shine": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-500%)" },
        },
        "status-pulse": {
          "0%": { transform: "scale(1)", opacity: "0.4" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "progress-shine": "progress-shine 1.5s ease-in-out infinite",
        "status-pulse": "status-pulse 2s ease-out infinite",
      },
      
      transitionTimingFunction: {
        'rg-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
