import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Star, MessageSquare } from 'lucide-react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
}

// Flags mapping based on Language first, then Region
const RegionFlag = ({ region, language }: { region: string; language: string }) => {
    const lang = language.toLowerCase();

    // Language based overrides
    if (lang.includes('spanish') || lang.includes('español')) return <span className="text-lg" title="Español">🇪🇸</span>;
    if (lang.includes('japanese') || lang.includes('japonés')) return <span className="text-lg" title="Japanese">🇯🇵</span>;
    if (lang.includes('portuguese') || lang.includes('português')) return <span className="text-lg" title="Português">🇧🇷</span>;
    if (lang.includes('french') || lang.includes('francés')) return <span className="text-lg" title="Français">🇫🇷</span>;
    if (lang.includes('german') || lang.includes('alemán')) return <span className="text-lg" title="Deutsch">🇩🇪</span>;
    if (lang.includes('italian') || lang.includes('italiano')) return <span className="text-lg" title="Italiano">🇮🇹</span>;
    if (lang.includes('multi')) return <span className="text-lg" title="Multi-Language">🌍</span>;

    // Default flags based on region code if language is English or generic
    const flags: Record<string, string> = {
        'US': '🇺🇸',
        'EU': '🇪🇺',
        'JP': '🇯🇵',
        'PT': '🇧🇷'
    };

    // If English, try to respect region if it's EU, otherwise default to US flag
    if (lang.includes('english') || lang.includes('inglés')) {
        if (region === 'EU') return <span className="text-lg" title="English (EU)">🇪🇺</span>;
        return <span className="text-lg" title="English">🇺🇸</span>;
    }

    return <span className="text-lg" role="img" aria-label={region} title={region}>{flags[region] || '🏳️'}</span>;
};

const TypeRibbon = ({ type }: { type: string }) => {
    let colorClass = 'bg-zinc-600';
    if (type === 'ROM') colorClass = 'bg-[#00aeef]'; // Blue for ROM
    if (type === 'ISO') colorClass = 'bg-[#f39c12]'; // Orange for ISO

    return (
        <div className={`w-full py-1 text-center text-white text-xs font-bold uppercase tracking-wide ${colorClass}`}>
            {type}
        </div>
    );
};

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  return (
    <Link 
      to={`/game/${game.slug}`} 
      className="group block bg-white dark:bg-[#222] shadow-md hover:shadow-2xl dark:shadow-black/40 dark:hover:shadow-orange-500/10 transition-all duration-300 ease-out rounded-xl overflow-hidden transform hover:-translate-y-2 active:scale-95"
    >
      {/* Top Image */}
      <div className="relative aspect-square w-full overflow-hidden">
        <img
          src={game.coverImage}
          alt={game.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
          loading="lazy"
        />
        {/* Platform Badge Overlay */}
        {game.platform && game.platform.length > 0 && (
             <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 shadow-sm z-10">
                 {game.platform[0]}
             </div>
        )}
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
      </div>
      
      {/* Colored Ribbon */}
      <TypeRibbon type={game.type} />

      {/* Content */}
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-zinc-800 dark:text-white leading-tight mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {game.title}
        </h3>
        
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 truncate">
            {game.genre.join(', ')}
        </div>
        
        <div className="text-xs text-zinc-600 dark:text-zinc-500 font-mono">
            {game.language}
        </div>
      </div>

      {/* Footer / Stats */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-[#333] flex items-center justify-between text-zinc-400 dark:text-zinc-500 text-xs bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                <Download size={12} />
                <span>{game.downloads}</span>
            </div>
            <div className="flex items-center gap-1 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                <Star size={12} className="text-zinc-400 dark:text-zinc-600 group-hover:text-yellow-500 dark:group-hover:text-yellow-500" />
                <span>{game.rating}</span>
            </div>
            <div className="flex items-center gap-1 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                <MessageSquare size={12} />
                <span>{game.comments}</span>
            </div>
        </div>
        
        <div>
            <RegionFlag region={game.region} language={game.language} />
        </div>
      </div>
    </Link>
  );
};