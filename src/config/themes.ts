export interface ThemeColors {
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  background: string;
  foreground: string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  border: string;
  input: string;
  ring: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  sidebar: string;
  "sidebar-foreground": string;
  "sidebar-primary": string;
  "sidebar-primary-foreground": string;
  "sidebar-accent": string;
  "sidebar-accent-foreground": string;
  "sidebar-border": string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  preview: string; // Preview color for UI
}

export const themes: Record<string, Theme> = {
  "corporate-blue": {
    id: "corporate-blue",
    name: "Corporate Blue",
    description: "Professional business theme with blue accents",
    preview: "#3b82f6",
    colors: {
      primary: "214 84% 56%",
      "primary-foreground": "0 0% 100%",
      secondary: "210 40% 96.1%",
      "secondary-foreground": "222.2 47.4% 11.2%",
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      muted: "210 40% 96.1%",
      "muted-foreground": "215.4 16.3% 46.9%",
      accent: "210 40% 96.1%",
      "accent-foreground": "222.2 47.4% 11.2%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "210 40% 98%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      ring: "221.2 83.2% 53.3%",
      card: "0 0% 100%",
      "card-foreground": "222.2 84% 4.9%",
      popover: "0 0% 100%",
      "popover-foreground": "222.2 84% 4.9%",
      sidebar: "0 0% 98%",
      "sidebar-foreground": "240 5.3% 26.1%",
      "sidebar-primary": "214 84% 56%",
      "sidebar-primary-foreground": "0 0% 100%",
      "sidebar-accent": "240 4.8% 95.9%",
      "sidebar-accent-foreground": "240 5.9% 10%",
      "sidebar-border": "220 13% 91%",
    },
  },
  "modern-purple": {
    id: "modern-purple",
    name: "Warm Olive-Gold",
    description: "Warm olive-gold theme with earthy tones",
    preview: "#807031",
    colors: {
      primary: "48 45% 35%",
      "primary-foreground": "0 0% 100%",
      secondary: "48 40% 96%",
      "secondary-foreground": "48 45% 20%",
      background: "0 0% 100%",
      foreground: "48 30% 12%",
      muted: "48 30% 94%",
      "muted-foreground": "48 20% 45%",
      accent: "48 30% 94%",
      "accent-foreground": "48 45% 20%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "48 40% 98%",
      border: "48 25% 88%",
      input: "48 25% 88%",
      ring: "48 45% 35%",
      card: "0 0% 100%",
      "card-foreground": "48 30% 12%",
      popover: "0 0% 100%",
      "popover-foreground": "48 30% 12%",
      sidebar: "48 30% 96%",
      "sidebar-foreground": "48 35% 25%",
      "sidebar-primary": "48 45% 35%",
      "sidebar-primary-foreground": "0 0% 100%",
      "sidebar-accent": "48 25% 94%",
      "sidebar-accent-foreground": "48 35% 20%",
      "sidebar-border": "48 25% 88%",
    },
  },
  "green-nature": {
    id: "green-nature",
    name: "Green Nature",
    description: "Eco-friendly sustainable design",
    preview: "#22c55e",
    colors: {
      primary: "142 71% 45%",
      "primary-foreground": "0 0% 100%",
      secondary: "138 76% 97%",
      "secondary-foreground": "142 71% 15%",
      background: "0 0% 100%",
      foreground: "142 50% 10%",
      muted: "138 50% 96%",
      "muted-foreground": "142 20% 45%",
      accent: "138 50% 96%",
      "accent-foreground": "142 71% 15%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "138 76% 97%",
      border: "138 40% 90%",
      input: "138 40% 90%",
      ring: "142 71% 45%",
      card: "0 0% 100%",
      "card-foreground": "142 50% 10%",
      popover: "0 0% 100%",
      "popover-foreground": "142 50% 10%",
      sidebar: "138 76% 97%",
      "sidebar-foreground": "142 50% 25%",
      "sidebar-primary": "142 71% 45%",
      "sidebar-primary-foreground": "0 0% 100%",
      "sidebar-accent": "138 50% 94%",
      "sidebar-accent-foreground": "142 50% 15%",
      "sidebar-border": "138 40% 88%",
    },
  },
  "ocean-teal": {
    id: "ocean-teal",
    name: "Ocean Teal",
    description: "Calm and trustworthy teal palette",
    preview: "#14b8a6",
    colors: {
      primary: "173 80% 40%",
      "primary-foreground": "0 0% 100%",
      secondary: "180 54% 97%",
      "secondary-foreground": "173 80% 15%",
      background: "0 0% 100%",
      foreground: "173 50% 10%",
      muted: "180 40% 96%",
      "muted-foreground": "173 20% 45%",
      accent: "180 40% 96%",
      "accent-foreground": "173 80% 15%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "180 54% 97%",
      border: "180 30% 90%",
      input: "180 30% 90%",
      ring: "173 80% 40%",
      card: "0 0% 100%",
      "card-foreground": "173 50% 10%",
      popover: "0 0% 100%",
      "popover-foreground": "173 50% 10%",
      sidebar: "180 54% 97%",
      "sidebar-foreground": "173 50% 25%",
      "sidebar-primary": "173 80% 40%",
      "sidebar-primary-foreground": "0 0% 100%",
      "sidebar-accent": "180 40% 94%",
      "sidebar-accent-foreground": "173 50% 15%",
      "sidebar-border": "180 30% 88%",
    },
  },
  "sunset-orange": {
    id: "sunset-orange",
    name: "Deep Blue",
    description: "Deep blue theme with rich tones",
    preview: "#0011B3",
    colors: {
      primary: "231 100% 35%",
      "primary-foreground": "0 0% 100%",
      secondary: "231 80% 96%",
      "secondary-foreground": "231 100% 20%",
      background: "0 0% 100%",
      foreground: "231 50% 10%",
      muted: "231 60% 94%",
      "muted-foreground": "231 20% 45%",
      accent: "231 60% 94%",
      "accent-foreground": "231 100% 20%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "231 80% 98%",
      border: "231 40% 88%",
      input: "231 40% 88%",
      ring: "231 100% 35%",
      card: "0 0% 100%",
      "card-foreground": "231 50% 10%",
      popover: "0 0% 100%",
      "popover-foreground": "231 50% 10%",
      sidebar: "231 80% 96%",
      "sidebar-foreground": "231 50% 25%",
      "sidebar-primary": "231 100% 35%",
      "sidebar-primary-foreground": "0 0% 100%",
      "sidebar-accent": "231 60% 92%",
      "sidebar-accent-foreground": "231 50% 20%",
      "sidebar-border": "231 40% 86%",
    },
  },
  "dark-professional": {
    id: "dark-professional",
    name: "Deep Navy",
    description: "Deep navy theme with professional dark tones",
    preview: "#04003C",
    colors: {
      primary: "244 100% 12%",
      "primary-foreground": "0 0% 100%",
      secondary: "244 60% 96%",
      "secondary-foreground": "244 100% 12%",
      background: "0 0% 100%",
      foreground: "244 50% 10%",
      muted: "244 40% 94%",
      "muted-foreground": "244 20% 45%",
      accent: "244 40% 94%",
      "accent-foreground": "244 100% 12%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "244 60% 98%",
      border: "244 30% 88%",
      input: "244 30% 88%",
      ring: "244 100% 12%",
      card: "0 0% 100%",
      "card-foreground": "244 50% 10%",
      popover: "0 0% 100%",
      "popover-foreground": "244 50% 10%",
      sidebar: "244 60% 96%",
      "sidebar-foreground": "244 50% 20%",
      "sidebar-primary": "244 100% 12%",
      "sidebar-primary-foreground": "0 0% 100%",
      "sidebar-accent": "244 40% 92%",
      "sidebar-accent-foreground": "244 50% 15%",
      "sidebar-border": "244 30% 86%",
    },
  },
  "minimalist-gray": {
    id: "minimalist-gray",
    name: "Minimalist Gray",
    description: "Clean, neutral, and modern design",
    preview: "#71717a",
    colors: {
      primary: "240 5.9% 10%",
      "primary-foreground": "0 0% 100%",
      secondary: "240 4.8% 95.9%",
      "secondary-foreground": "240 5.9% 10%",
      background: "0 0% 100%",
      foreground: "240 10% 3.9%",
      muted: "240 4.8% 95.9%",
      "muted-foreground": "240 3.8% 46.1%",
      accent: "240 4.8% 95.9%",
      "accent-foreground": "240 5.9% 10%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "240 4.8% 95.9%",
      border: "240 5.9% 90%",
      input: "240 5.9% 90%",
      ring: "240 5.9% 10%",
      card: "0 0% 100%",
      "card-foreground": "240 10% 3.9%",
      popover: "0 0% 100%",
      "popover-foreground": "240 10% 3.9%",
      sidebar: "240 4.8% 97%",
      "sidebar-foreground": "240 5.3% 26.1%",
      "sidebar-primary": "240 5.9% 10%",
      "sidebar-primary-foreground": "0 0% 100%",
      "sidebar-accent": "240 4.8% 95.9%",
      "sidebar-accent-foreground": "240 5.9% 10%",
      "sidebar-border": "240 5.9% 90%",
    },
  },
};

export const themeList = Object.values(themes);
