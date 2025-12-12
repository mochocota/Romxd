export interface SystemRequirements {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
}

export type GameType = 'ISO' | 'ROM';

export interface MenuLink {
  id: string;
  label: string;
  url: string;
}

export interface AdsConfig {
  topAdCode: string;
  bottomAdCode: string;
  globalHeadScript: string; // Script injection for <head> (e.g. AdSense meta/script)
  globalBodyScript: string; // Script injection for <body>
}

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: string; // e.g., 'pathname' or 'url'
  enabled: boolean;
}

export interface Game {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  heroImage: string;
  screenshots: string[]; // New field
  genre: string[];
  platform: string[];
  releaseDate: string;
  developer: string;
  downloadSize: string;
  requirements: SystemRequirements;
  downloadUrl: string;
  // New visual fields
  type: GameType;
  region: 'US' | 'EU' | 'JP' | 'PT'; // Flag code
  language: string;
  downloads: string;
  rating: string;
  voteCount?: number; // Added for rating system calculations
  comments: number;
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
}