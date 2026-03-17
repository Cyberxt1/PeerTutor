export type LandingThemeName = 'default' | 'neon-black' | 'neon-blue';

export const LANDING_THEME_STORAGE_KEY = 'campustutor-landing-theme';

export const landingThemeOptions: Array<{
  value: LandingThemeName;
  label: string;
  description: string;
}> = [
  {
    value: 'default',
    label: 'Current',
    description: 'The existing CampusTutor palette.',
  },
  {
    value: 'neon-black',
    label: 'Neon Black',
    description: 'A dark cyber look with electric accents.',
  },
  {
    value: 'neon-blue',
    label: 'Neon Blue',
    description: 'A vivid blue glow with cool glassy panels.',
  },
];
