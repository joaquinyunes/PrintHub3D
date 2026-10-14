/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },

        // --- Identidad de la tienda: papel / tinta / un solo acento ---
        paper: '#f2efe8',
        'paper-2': '#e6e2d6',
        ink: '#0d0e0f',
        'ink-soft': '#3b3e42',
        'steel-100': '#d7dbe0',
        'steel-200': '#b4b9be',
        'steel-300': '#9aa1a8',
        signal: '#ffd21f',
        'signal-dark': '#e8b900',
        danger: '#d92d20',
        // Alias usados por el panel admin (no tocar)
        'tone-red': '#ff5c1a',
        'tone-pink': '#ff2e88',
        'tone-amber': '#f5a524',
        'tone-dark': '#111114',
        'tone-darker': '#0a0a0c',
      },
      fontFamily: {
        display: ['var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        hard: '4px 4px 0 0 #0d0e0f',
        'hard-sm': '2px 2px 0 0 #0d0e0f',
        'hard-lg': '8px 8px 0 0 #0d0e0f',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'marquee-x': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'grain-shift': {
          '0%,100%': { transform: 'translate(0,0)' },
          '10%': { transform: 'translate(-3%,-5%)' },
          '30%': { transform: 'translate(4%,-2%)' },
          '50%': { transform: 'translate(-2%,4%)' },
          '70%': { transform: 'translate(3%,3%)' },
          '90%': { transform: 'translate(-4%,2%)' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-22px) rotate(6deg)' },
        },
      },
      animation: {
        marquee: 'marquee-x var(--marquee-duration,32s) linear infinite',
        grain: 'grain-shift 8s steps(6) infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
