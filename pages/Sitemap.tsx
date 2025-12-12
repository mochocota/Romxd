import React from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../context/GameContext';
import { SEO } from '../components/SEO';
import { FileText, Gamepad2, Home, ExternalLink } from 'lucide-react';
import { Game } from '../types';

export const Sitemap: React.FC = () => {
  const { games, menuLinks } = useGames();

  // Group games by platform for better organization
  const gamesByPlatform = games.reduce<Record<string, Game[]>>((acc, game) => {
    const plat = game.platform[0] || 'Otros';
    if (!acc[plat]) acc[plat] = [];
    acc[plat].push(game);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-12 w-full bg-gray-100 dark:bg-[#333]">
      <SEO 
        title="Mapa del Sitio" 
        description="Índice completo de todos los videojuegos, roms, isos y páginas disponibles en RomXD."
      />

      <div className="bg-white dark:bg-[#222] border-b border-gray-200 dark:border-[#444] py-8 mb-8">
        <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-zinc-800 dark:text-white flex items-center gap-3">
                <FileText className="text-orange-600" />
                Mapa del Sitio
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                Índice de contenido y enlaces directos.
            </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* General Pages Section */}
        <section className="bg-white dark:bg-[#222] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#444]">
            <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-4 border-b border-gray-100 dark:border-[#444] pb-2 flex items-center gap-2">
                <Home size={20} className="text-blue-500" />
                Páginas Principales
            </h2>
            <ul className="space-y-3">
                <li>
                    <Link to="/" className="text-zinc-600 dark:text-zinc-300 hover:text-orange-500 hover:underline">
                        Inicio / Catálogo
                    </Link>
                </li>
                {menuLinks.map(link => (
                    <li key={link.id}>
                        {link.url.startsWith('http') ? (
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 dark:text-zinc-300 hover:text-orange-500 hover:underline flex items-center gap-1">
                                {link.label} <ExternalLink size={12} />
                            </a>
                        ) : (
                            <Link to={link.url} className="text-zinc-600 dark:text-zinc-300 hover:text-orange-500 hover:underline">
                                {link.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </section>

        {/* Games Section */}
        <section className="bg-white dark:bg-[#222] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-[#444] md:col-span-2">
            <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-6 border-b border-gray-100 dark:border-[#444] pb-2 flex items-center gap-2">
                <Gamepad2 size={20} className="text-purple-500" />
                Catálogo de Juegos
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {Object.entries(gamesByPlatform).map(([platform, platformGames]) => (
                    <div key={platform}>
                        <h3 className="font-bold text-orange-600 dark:text-orange-400 mb-3 text-sm uppercase tracking-wider">
                            {platform}
                        </h3>
                        <ul className="space-y-2">
                            {(platformGames as Game[]).map(game => (
                                <li key={game.id}>
                                    <Link 
                                        to={`/game/${game.slug}`} 
                                        className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-orange-500 hover:underline block truncate"
                                        title={game.title}
                                    >
                                        {game.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>

      </div>
    </div>
  );
};