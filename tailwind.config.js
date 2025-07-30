/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		fontSize: {
  			xs: [
  				'0.875rem',
  				{
  					lineHeight: '1.5'
  				}
  			],
  			sm: [
  				'1rem',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			base: [
  				'1.125rem',
  				{
  					lineHeight: '1.7'
  				}
  			],
  			lg: [
  				'1.25rem',
  				{
  					lineHeight: '1.8'
  				}
  			],
  			xl: [
  				'1.5rem',
  				{
  					lineHeight: '1.8'
  				}
  			],
  			'2xl': [
  				'1.75rem',
  				{
  					lineHeight: '1.8'
  				}
  			],
  			'3xl': [
  				'2rem',
  				{
  					lineHeight: '1.8'
  				}
  			],
  			'4xl': [
  				'2.5rem',
  				{
  					lineHeight: '1.8'
  				}
  			],
  			'5xl': [
  				'3rem',
  				{
  					lineHeight: '1.8'
  				}
  			],
  			'6xl': [
  				'3.75rem',
  				{
  					lineHeight: '1.8'
  				}
  			],
  			'7xl': [
  				'4.5rem',
  				{
  					lineHeight: '1.8'
  				}
  			],
  			'8xl': [
  				'6rem',
  				{
  					lineHeight: '1.8'
  				}
  			],
  			'9xl': [
  				'8rem',
  				{
  					lineHeight: '1.8'
  				}
  			]
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'monospace'
  			]
  		},
  		colors: {
  			primary: {
  				'50': '#eff6ff',
  				'100': '#dbeafe',
  				'200': '#bfdbfe',
  				'300': '#93c5fd',
  				'400': '#60a5fa',
  				'500': '#3b82f6',
  				'600': '#2563eb',
  				'700': '#1d4ed8',
  				'800': '#1e40af',
  				'900': '#1e3a8a',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			jazz: {
  				'50': '#fdf2f8',
  				'100': '#fce7f3',
  				'200': '#fbcfe8',
  				'300': '#f9a8d4',
  				'400': '#f472b6',
  				'500': '#ec4899',
  				'600': '#db2777',
  				'700': '#be185d',
  				'800': '#9d174d',
  				'900': '#831843'
  			},
  			game: {
  				bg: '#0f0f23',
  				surface: '#1a1a2e',
  				accent: '#16213e',
  				highlight: '#0f3460'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'bounce-gentle': 'bounceGentle 1s infinite',
  			'shake': 'shake 0.5s ease-in-out'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			bounceGentle: {
  				'0%, 100%': {
  					transform: 'translateY(-5%)'
  				},
  				'50%': {
  					transform: 'translateY(0)'
  				}
  			},
  			shake: {
  				'0%, 100%': {
  					transform: 'translateX(0)'
  				},
  				'10%, 30%, 50%, 70%, 90%': {
  					transform: 'translateX(-10px)'
  				},
  				'20%, 40%, 60%, 80%': {
  					transform: 'translateX(10px)'
  				}
  			}
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-jazz': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  			'gradient-game': 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
  		},
  		padding: {
  			safe: 'env(safe-area-inset-bottom)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} 