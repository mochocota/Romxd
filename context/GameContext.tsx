import React, { createContext, useContext, useState, useEffect } from 'react';
import { Game, MenuLink, AdsConfig, GiscusConfig } from '../types';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface GameContextType {
  games: Game[];
  tags: string[];
  platforms: string[];
  menuLinks: MenuLink[];
  adsConfig: AdsConfig;
  giscusConfig: GiscusConfig;
  addGame: (game: Game) => Promise<void>;
  updateGame: (game: Game) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  rateGame: (id: string, rating: number) => Promise<void>;
  incrementDownloads: (id: string) => Promise<void>;
  addTag: (tag: string) => void;
  deleteTag: (tag: string) => void;
  addPlatform: (platform: string) => void;
  deletePlatform: (platform: string) => void;
  addMenuLink: (link: MenuLink) => void;
  updateMenuLink: (link: MenuLink) => void;
  deleteMenuLink: (id: string) => void;
  updateAdsConfig: (config: AdsConfig) => void;
  updateGiscusConfig: (config: GiscusConfig) => void;
  loading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// LocalStorage helpers for Settings (Non-Post data)
const DEFAULT_TAGS = [
  'Action', 'Action-Adventure', 'Action RPG', 'Adventure', 'Fighting', 
  'Hack', 'Platformer', 'Puzzle', 'Racing', 'Rhythm', 'RPG', 
  'Shooter', 'Sports', 'Strategy', 'Visual Novel', 'Horror', 'Open World'
];

const DEFAULT_PLATFORMS = [
  'PSP', 'Gameboy Advance', 'PlayStation 2', 'Nintendo DS', 'Nintendo 64', 'PlayStation 1', 'Sega Genesis'
];

const DEFAULT_MENU_LINKS: MenuLink[] = [
    { id: '1', label: 'Inicio', url: '/' },
];

const DEFAULT_ADS_CONFIG: AdsConfig = {
  topAdCode: '',
  bottomAdCode: '',
  globalHeadScript: '',
  globalBodyScript: ''
};

const DEFAULT_GISCUS_CONFIG: GiscusConfig = {
  repo: '',
  repoId: '',
  category: '',
  categoryId: '',
  mapping: 'pathname',
  enabled: false
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FIRESTORE SYNC FOR GAMES ---
  useEffect(() => {
    // Escuchar cambios en tiempo real en la colección 'games'
    const unsubscribe = onSnapshot(collection(db, "games"), (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Game));
      setGames(gamesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching games:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- LOCAL STORAGE FOR SETTINGS (Tags, Configs) ---
  const [tags, setTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('romxd_tags');
    return saved ? JSON.parse(saved) : DEFAULT_TAGS;
  });

  const [platforms, setPlatforms] = useState<string[]>(() => {
    const saved = localStorage.getItem('romxd_platforms');
    return saved ? JSON.parse(saved) : DEFAULT_PLATFORMS;
  });

  const [menuLinks, setMenuLinks] = useState<MenuLink[]>(() => {
      const saved = localStorage.getItem('romxd_menu_links');
      return saved ? JSON.parse(saved) : DEFAULT_MENU_LINKS;
  });

  const [adsConfig, setAdsConfig] = useState<AdsConfig>(() => {
      const saved = localStorage.getItem('romxd_ads_config');
      return saved ? JSON.parse(saved) : DEFAULT_ADS_CONFIG;
  });

  const [giscusConfig, setGiscusConfig] = useState<GiscusConfig>(() => {
      const saved = localStorage.getItem('romxd_giscus_config');
      return saved ? JSON.parse(saved) : DEFAULT_GISCUS_CONFIG;
  });

  // Persist Local Settings
  useEffect(() => localStorage.setItem('romxd_tags', JSON.stringify(tags)), [tags]);
  useEffect(() => localStorage.setItem('romxd_platforms', JSON.stringify(platforms)), [platforms]);
  useEffect(() => localStorage.setItem('romxd_menu_links', JSON.stringify(menuLinks)), [menuLinks]);
  useEffect(() => localStorage.setItem('romxd_ads_config', JSON.stringify(adsConfig)), [adsConfig]);
  useEffect(() => localStorage.setItem('romxd_giscus_config', JSON.stringify(giscusConfig)), [giscusConfig]);

  // --- FIRESTORE ACTIONS ---

  const addGame = async (game: Game) => {
    await setDoc(doc(db, "games", game.id), game);
  };

  const updateGame = async (updatedGame: Game) => {
    await setDoc(doc(db, "games", updatedGame.id), updatedGame, { merge: true });
  };

  const deleteGame = async (id: string) => {
    await deleteDoc(doc(db, "games", id));
  };

  const rateGame = async (id: string, rating: number) => {
    const game = games.find(g => g.id === id);
    if (!game) return;

    const currentRating = parseFloat(game.rating) || 0;
    const currentVotes = game.voteCount !== undefined ? game.voteCount : (currentRating > 0 ? 5 : 0);
    
    const newVotes = currentVotes + 1;
    const newRatingValue = ((currentRating * currentVotes) + rating) / newVotes;
    
    const updates = {
        rating: newRatingValue.toFixed(1),
        voteCount: newVotes
    };

    await updateDoc(doc(db, "games", id), updates);
  };

  const incrementDownloads = async (id: string) => {
    const game = games.find(g => g.id === id);
    if (!game) return;

    // Helper to safely parse string downloads (e.g. "1.5k" or "100")
    // For this implementation, we try to extract the number.
    let currentCount = 0;
    const raw = game.downloads.toString().toLowerCase().trim();
    
    if (raw.endsWith('k')) {
        currentCount = parseFloat(raw) * 1000;
    } else if (raw.endsWith('m')) {
        currentCount = parseFloat(raw) * 1000000;
    } else {
        currentCount = parseInt(raw.replace(/[^0-9]/g, '')) || 0;
    }

    const newCount = currentCount + 1;

    await updateDoc(doc(db, "games", id), {
        downloads: newCount.toString()
    });
  };

  // --- LOCAL ACTIONS ---
  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    const formatted = tag.trim();
    setTags(prev => prev.includes(formatted) ? prev : [...prev, formatted].sort());
  };

  const deleteTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const addPlatform = (platform: string) => {
    if (!platform.trim()) return;
    const formatted = platform.trim();
    setPlatforms(prev => prev.includes(formatted) ? prev : [...prev, formatted].sort());
  };

  const deletePlatform = (platform: string) => setPlatforms(prev => prev.filter(p => p !== platform));

  const addMenuLink = (link: MenuLink) => setMenuLinks(prev => [...prev, link]);
  const updateMenuLink = (l: MenuLink) => setMenuLinks(prev => prev.map(i => i.id === l.id ? l : i));
  const deleteMenuLink = (id: string) => setMenuLinks(prev => prev.filter(l => l.id !== id));
  
  const updateAdsConfig = (c: AdsConfig) => setAdsConfig(c);
  const updateGiscusConfig = (c: GiscusConfig) => setGiscusConfig(c);

  return (
    <GameContext.Provider value={{ 
      games, tags, platforms, menuLinks, adsConfig, giscusConfig, loading,
      addGame, updateGame, deleteGame, rateGame, incrementDownloads,
      addTag, deleteTag,
      addPlatform, deletePlatform,
      addMenuLink, updateMenuLink, deleteMenuLink,
      updateAdsConfig, updateGiscusConfig
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGames = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GameProvider');
  }
  return context;
};