import React, { useMemo, useState, useRef, useEffect } from 'react';
import { GameCard } from '../components/GameCard';
import { SearchX, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useGames } from '../context/GameContext';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { AdUnit } from '../components/AdUnit';
import { SEO } from '../components/SEO';

export const Home: React.FC = () => {
  const { games, adsConfig } = useGames();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const location = useLocation();

  // Ensure we start at the top when loading Home (Standard behavior for "Inicio")
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [searchQuery, location.pathname]);

  const filteredGames = useMemo(() => {
    if (!searchQuery) return games;
    const lowerQuery = searchQuery.toLowerCase();
    return games.filter(game => 
      game.title.toLowerCase().includes(lowerQuery) ||
      game.genre.some(g => g.toLowerCase().includes(lowerQuery)) ||
      game.platform.some(p => p.toLowerCase().includes(lowerQuery))
    );
  }, [games, searchQuery]);

  // Logic for Featured Games (Hero Slider)
  // Only show slider if no search query
  const showHero = !searchQuery && filteredGames.length > 0;
  
  // Take first 6 games for slider, the rest for grid
  const heroGames = showHero ? filteredGames.slice(0, 6) : [];
  const gridGames = showHero ? filteredGames.slice(6) : filteredGames;

  // Scroll Handler for Carousel
  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
        const { clientWidth } = sliderRef.current;
        // Scroll amount is roughly half the container width to show next items smoothly
        const scrollAmount = clientWidth / 2;
        sliderRef.current.scrollBy({ 
            left: direction === 'left' ? -scrollAmount : scrollAmount, 
            behavior: 'smooth' 
        });
    }
  };

  // Auto-Play Logic
  useEffect(() => {
    if (!showHero || heroGames.length === 0 || isPaused) return;

    const interval = setInterval(() => {
        if (sliderRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
            
            // Check if we've reached the end (with tolerance)
            const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 10;

            if (isAtEnd) {
                // Smoothly scroll back to start
                sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                // Scroll one "card" width approximately based on breakpoints
                let divisor = 2; // Mobile
                if (window.innerWidth >= 1024) divisor = 4; // Desktop
                else if (window.innerWidth >= 768) divisor = 3; // Tablet
                
                const cardWidth = (clientWidth / divisor);
                
                sliderRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
            }
        }
    }, 3500); // 3.5 seconds

    return () => clearInterval(interval);
  }, [showHero, heroGames.length, isPaused]);

  return (
    <div className="min-h-screen pb-12 w-full overflow-x-hidden">
      <SEO 
        title={searchQuery ? `Resultados para "${searchQuery}"` : "RomXD - Catálogo Principal"}
        description="Explora nuestra colección de ROMs, ISOs y juegos traducidos. Descarga directa y rápida para tus emuladores favoritos."
      />

      <div className="max-w-6xl mx-auto px-4">
        
        {/* Ad Space Top (Only on Home) */}
        {!searchQuery && (
          <div className="w-full flex justify-center py-6">
              <AdUnit 
                adCode={adsConfig.topAdCode} 
                className="w-full max-w-[728px] min-h-[90px]" 
              />
          </div>
        )}

        {/* FEATURED CAROUSEL (Multi-column Slider) */}
        {showHero && heroGames.length > 0 && (
            <div 
                className="mb-10 mt-4 relative group animate-fadeIn"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2 px-1">
                    <Star className="text-orange-500 fill-orange-500" size={18} /> 
                    Destacados
                </h2>

                {/* Navigation Buttons */}
                <button 
                    onClick={() => scrollSlider('left')}
                    className="absolute -left-3 top-1/2 z-20 p-2 bg-white/90 dark:bg-black/60 text-zinc-800 dark:text-white rounded-full shadow-lg border border-gray-200 dark:border-[#444] hover:scale-110 transition-transform hidden md:flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-300"
                >
                    <ChevronLeft size={24} />
                </button>
                <button 
                    onClick={() => scrollSlider('right')}
                    className="absolute -right-3 top-1/2 z-20 p-2 bg-white/90 dark:bg-black/60 text-zinc-800 dark:text-white rounded-full shadow-lg border border-gray-200 dark:border-[#444] hover:scale-110 transition-transform hidden md:flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-300"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Slider Container - Scroll Snap */}
                <div 
                    ref={sliderRef}
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 pt-2"
                    style={{ scrollBehavior: 'smooth' }}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    {heroGames.map((game) => (
                        <div 
                            key={game.id}
                            // Responsive Widths: 2 cols (mobile), 3 cols (tablet), 4 cols (desktop)
                            className="flex-shrink-0 w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] snap-start"
                        >
                             <Link 
                                to={`/game/${game.slug}`}
                                className="block relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg group/card transform transition-transform duration-300 hover:-translate-y-1"
                            >
                                <img 
                                    src={game.coverImage} 
                                    alt={game.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover/card:opacity-90 transition-opacity"></div>
                                
                                {/* Content Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        <span className="text-[10px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded uppercase shadow-sm">
                                            {game.type}
                                        </span>
                                        {game.platform[0] && (
                                            <span className="text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded uppercase border border-white/10">
                                                {game.platform[0]}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">
                                        {game.title}
                                    </h3>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Section Title - Only show if we have grid games or if we are searching. */}
        {(gridGames.length > 0 || searchQuery) && (
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 dark:border-[#333] pb-4 mt-8">
                <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 leading-tight flex items-center gap-2">
                    {searchQuery ? 'Resultados de Búsqueda' : 'Más Juegos'}
                    {!searchQuery && <span className="text-xs bg-zinc-100 dark:bg-[#333] text-zinc-500 px-2 py-1 rounded-full font-normal">{gridGames.length}</span>}
                </h1>
                
                {searchQuery && (
                    <h2 className="text-lg text-zinc-600 dark:text-zinc-400 break-words">
                        para: <span className="font-bold text-orange-500">"{searchQuery}"</span>
                    </h2>
                )}
            </div>
        )}
       

        {/* Catalog Grid (Standard List) */}
        {gridGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
              {gridGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
        ) : (
            // Only show empty state if we have NO games at all matching the criteria
            (filteredGames.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
                    <SearchX size={64} className="text-zinc-300 dark:text-zinc-600 mb-4" />
                    <h3 className="text-xl font-bold text-zinc-500 dark:text-zinc-400">
                        {searchQuery ? 'No se encontraron resultados' : 'No hay juegos disponibles'}
                    </h3>
                    {searchQuery && <p className="text-zinc-400 dark:text-zinc-500 mt-2">Prueba con otros términos o revisa la ortografía.</p>}
                </div>
            )
        )}
        
        {/* Pagination mock - Only if we have enough games in grid */}
        {!searchQuery && gridGames.length > 8 && (
            <div className="mt-16 flex justify-center gap-2">
                <button className="px-4 py-2 bg-orange-600 text-white font-bold rounded-full shadow hover:bg-orange-500 transition-colors">1</button>
                <button className="px-4 py-2 bg-white dark:bg-[#222] text-zinc-600 dark:text-zinc-400 font-bold rounded-full shadow hover:bg-gray-100 dark:hover:bg-[#444] transition-colors">2</button>
            </div>
        )}

      </div>
    </div>
  );
};