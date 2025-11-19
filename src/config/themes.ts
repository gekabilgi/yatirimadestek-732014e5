export interface ThemeColors {
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  background: string;
  foreground: string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  sidebar: string;
  'sidebar-foreground': string;
  'sidebar-primary': string;
  'sidebar-primary-foreground': string;
  'sidebar-accent': string;
  'sidebar-accent-foreground': string;
  'sidebar-border': string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  preview: string; // Preview color for UI
}

export const themes: Record<string, Theme> = {
  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional business theme with blue accents',
    preview: '#3b82f6',
    colors: {
      primary: '214 84% 56%',
      'primary-foreground': '0 0% 100%',
      secondary: '210 40% 96.1%',
      'secondary-foreground': '222.2 47.4% 11.2%',
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      muted: '210 40% 96.1%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      'accent-foreground': '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
      card: '0 0% 100%',
      'card-foreground': '222.2 84% 4.9%',
      popover: '0 0% 100%',
      'popover-foreground': '222.2 84% 4.9%',
      sidebar: '0 0% 98%',
      'sidebar-foreground': '240 5.3% 26.1%',
      'sidebar-primary': '214 84% 56%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '240 4.8% 95.9%',
      'sidebar-accent-foreground': '240 5.9% 10%',
      'sidebar-border': '220 13% 91%',
    },
  },
  'modern-purple': {
    id: 'modern-purple',
    name: 'Modern Purple',
    description: 'Creative and innovative purple design',
    preview: '#a855f7',
    colors: {
      primary: '271 91% 65%',
      'primary-foreground': '0 0% 100%',
      secondary: '270 60% 98%',
      'secondary-foreground': '271 91% 15%',
      background: '0 0% 100%',
      foreground: '271 50% 10%',
      muted: '270 60% 96%',
      'muted-foreground': '271 20% 45%',
      accent: '270 60% 96%',
      'accent-foreground': '271 91% 15%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '270 60% 98%',
      border: '270 40% 90%',
      input: '270 40% 90%',
      ring: '271 91% 65%',
      card: '0 0% 100%',
      'card-foreground': '271 50% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '271 50% 10%',
      sidebar: '270 60% 98%',
      'sidebar-foreground': '271 50% 25%',
      'sidebar-primary': '271 91% 65%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '270 60% 95%',
      'sidebar-accent-foreground': '271 50% 15%',
      'sidebar-border': '270 40% 88%',
    },
  },
  'green-nature': {
    id: 'green-nature',
    name: 'Green Nature',
    description: 'Eco-friendly sustainable design',
    preview: '#22c55e',
    colors: {
      primary: '142 71% 45%',
      'primary-foreground': '0 0% 100%',
      secondary: '138 76% 97%',
      'secondary-foreground': '142 71% 15%',
      background: '0 0% 100%',
      foreground: '142 50% 10%',
      muted: '138 50% 96%',
      'muted-foreground': '142 20% 45%',
      accent: '138 50% 96%',
      'accent-foreground': '142 71% 15%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '138 76% 97%',
      border: '138 40% 90%',
      input: '138 40% 90%',
      ring: '142 71% 45%',
      card: '0 0% 100%',
      'card-foreground': '142 50% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '142 50% 10%',
      sidebar: '138 76% 97%',
      'sidebar-foreground': '142 50% 25%',
      'sidebar-primary': '142 71% 45%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '138 50% 94%',
      'sidebar-accent-foreground': '142 50% 15%',
      'sidebar-border': '138 40% 88%',
    },
  },
  'ocean-teal': {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    description: 'Calm and trustworthy teal palette',
    preview: '#14b8a6',
    colors: {
      primary: '173 80% 40%',
      'primary-foreground': '0 0% 100%',
      secondary: '180 54% 97%',
      'secondary-foreground': '173 80% 15%',
      background: '0 0% 100%',
      foreground: '173 50% 10%',
      muted: '180 40% 96%',
      'muted-foreground': '173 20% 45%',
      accent: '180 40% 96%',
      'accent-foreground': '173 80% 15%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '180 54% 97%',
      border: '180 30% 90%',
      input: '180 30% 90%',
      ring: '173 80% 40%',
      card: '0 0% 100%',
      'card-foreground': '173 50% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '173 50% 10%',
      sidebar: '180 54% 97%',
      'sidebar-foreground': '173 50% 25%',
      'sidebar-primary': '173 80% 40%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '180 40% 94%',
      'sidebar-accent-foreground': '173 50% 15%',
      'sidebar-border': '180 30% 88%',
    },
  },
  'sunset-orange': {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Energetic and warm orange theme',
    preview: '#f97316',
    colors: {
      primary: '24 95% 53%',
      'primary-foreground': '0 0% 100%',
      secondary: '33 100% 97%',
      'secondary-foreground': '24 95% 15%',
      background: '0 0% 100%',
      foreground: '24 50% 10%',
      muted: '33 80% 96%',
      'muted-foreground': '24 20% 45%',
      accent: '33 80% 96%',
      'accent-foreground': '24 95% 15%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '33 100% 97%',
      border: '33 50% 90%',
      input: '33 50% 90%',
      ring: '24 95% 53%',
      card: '0 0% 100%',
      'card-foreground': '24 50% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '24 50% 10%',
      sidebar: '33 100% 97%',
      'sidebar-foreground': '24 50% 25%',
      'sidebar-primary': '24 95% 53%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '33 80% 94%',
      'sidebar-accent-foreground': '24 50% 15%',
      'sidebar-border': '33 50% 88%',
    },
  },
  'dark-professional': {
    id: 'dark-professional',
    name: 'Dark Professional',
    description: 'Enhanced dark mode for power users',
    preview: '#1e293b',
    colors: {
      primary: '217 91% 60%',
      'primary-foreground': '222.2 47.4% 11.2%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '224.3 76.3% 48%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      sidebar: '240 5.9% 10%',
      'sidebar-foreground': '240 4.8% 95.9%',
      'sidebar-primary': '224.3 76.3% 48%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '240 3.7% 15.9%',
      'sidebar-accent-foreground': '240 4.8% 95.9%',
      'sidebar-border': '240 3.7% 15.9%',
    },
  },
  'minimalist-gray': {
    id: 'minimalist-gray',
    name: 'Minimalist Gray',
    description: 'Clean, neutral, and modern design',
    preview: '#71717a',
    colors: {
      primary: '240 5.9% 10%',
      'primary-foreground': '0 0% 100%',
      secondary: '240 4.8% 95.9%',
      'secondary-foreground': '240 5.9% 10%',
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      muted: '240 4.8% 95.9%',
      'muted-foreground': '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      'accent-foreground': '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '240 4.8% 95.9%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 5.9% 10%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      sidebar: '240 4.8% 97%',
      'sidebar-foreground': '240 5.3% 26.1%',
      'sidebar-primary': '240 5.9% 10%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '240 4.8% 95.9%',
      'sidebar-accent-foreground': '240 5.9% 10%',
      'sidebar-border': '240 5.9% 90%',
    },
  },
};

export const themeList = Object.values(themes);
