import { UserStory } from '../types';

const EPIC_PALETTES = {
  light: [
    { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
    { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500' },
  ],
  dark: [
    { bg: 'bg-purple-900/30', text: 'text-purple-300', dot: 'bg-purple-400' },
    { bg: 'bg-blue-900/30', text: 'text-blue-300', dot: 'bg-blue-400' },
    { bg: 'bg-emerald-900/30', text: 'text-emerald-300', dot: 'bg-emerald-400' },
    { bg: 'bg-amber-900/30', text: 'text-amber-300', dot: 'bg-amber-400' },
    { bg: 'bg-rose-900/30', text: 'text-rose-300', dot: 'bg-rose-400' },
    { bg: 'bg-cyan-900/30', text: 'text-cyan-300', dot: 'bg-cyan-400' },
    { bg: 'bg-orange-900/30', text: 'text-orange-300', dot: 'bg-orange-400' },
    { bg: 'bg-teal-900/30', text: 'text-teal-300', dot: 'bg-teal-400' },
    { bg: 'bg-indigo-900/30', text: 'text-indigo-300', dot: 'bg-indigo-400' },
    { bg: 'bg-pink-900/30', text: 'text-pink-300', dot: 'bg-pink-400' },
  ],
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getEpicColor(epicName: string, isDark: boolean) {
  const palette = isDark ? EPIC_PALETTES.dark : EPIC_PALETTES.light;
  const index = hashString(epicName) % palette.length;
  return palette[index];
}

export function getUniqueEpics(stories: UserStory[]): string[] {
  const epics = new Set<string>();
  for (const story of stories) {
    if (story.epic) epics.add(story.epic);
  }
  return Array.from(epics).sort();
}
