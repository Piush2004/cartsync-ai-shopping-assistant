export const tokens = {
  colors: {
    background: {
      primary: '#0a0a0a',
      secondary: '#141414',
      tertiary: '#1a1a1a',
      glass: 'rgba(255, 255, 255, 0.05)',
      glassHover: 'rgba(255, 255, 255, 0.08)'
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.9)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      muted: 'rgba(255, 255, 255, 0.4)'
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.2)'
    },
    accent: {
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444',   // red-500
      brand: '#ffffff'    // stark white for luxury contrast
    }
  },
  typography: {
    fontFamily: {
      sans: 'Inter, sans-serif',
      display: 'Outfit, sans-serif'
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '5rem'
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px'
  },
  motion: {
    ease: {
      apple: [0.22, 1, 0.36, 1],
      smooth: [0.25, 0.1, 0.25, 1.0]
    },
    duration: {
      fast: 0.2,
      base: 0.4,
      slow: 0.8
    }
  }
};
