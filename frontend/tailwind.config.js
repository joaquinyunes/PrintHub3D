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

        // --- Sistema PrintHub3D ("additive / taller digital") ---
        ground: '#0a0a0c',
        'ground-2': '#111114',
        'ground-3': '#17171b',
        ink: '#f4f2ee',
        'ink-dim': '#9b9aa3',
        flame: '#ff5c1a',
        flare: '#ff2e88',
        resin: '#14e0c8',
        // Alias usados por el panel admin
        'tone-red': '#ff5c1a',
        'tone-pink': '#ff2e88',
        'tone-amber': '#f5a524',
        'tone-dark': '#111114',
        'tone-darker': '#0a0a0c',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
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
