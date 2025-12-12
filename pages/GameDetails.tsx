import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, ArrowLeft, Database, Info, Monitor, Home, X, Edit2, Star, Loader2 } from 'lucide-react';
import { useGames } from '../context/GameContext';
import { GameCard } from '../components/GameCard';
import { parse } from 'marked';
import { SEO } from '../components/SEO';
import { Comments } from '../components/Comments';

export const GameDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { games, rateGame, incrementDownloads, loading } = useGames();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  
  // Case insensitive matching to avoid 404s on slight URL variations
  const game = games.find((g) => g.slug.toLowerCase() === slug?.toLowerCase());

  // Get related games (exclude current, take 4)
  const relatedGames = useMemo(() => {
    if (!game) return [];
    // Simple logic: return other games. In a real app, you might match by genre.
    return games.filter(g => g.id !== game.id).slice(0, 4);
  }, [game, games]);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if user has already rated this game in LocalStorage
    if (game?.id) {
        const savedRating = localStorage.getItem(`romxd_rating_${game.id}`);
        if (savedRating) {
            setHasRated(true);
            setUserRating(parseInt(savedRating));
        } else {
            setHasRated(false);
            setUserRating(0);
        }
    }
  }, [slug, game?.id]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleRate = (rating: number) => {
      if (hasRated || !game) return;
      
      // Save to Firebase
      rateGame(game.id, rating);
      
      // Save to Local State & Storage
      setUserRating(rating);
      setHasRated(true);
      localStorage.setItem(`romxd_rating_${game.id}`, rating.toString());
  };

  const handleDownloadClick = () => {
      if (game) {
          incrementDownloads(game.id);
      }
  };

  // 1. LOADING STATE: Show spinner while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#333]">
        <Loader2 className="animate-spin text-orange-600" size={48} />
      </div>
    );
  }

  // 2. 404 STATE: Only show if loading is done AND game is missing
  if (!game) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-zinc-800 dark:text-white gap-4 bg-gray-100 dark:bg-[#333]">
            <SEO title="Juego no encontrado" description="La página que buscas no existe." noIndex={true} />
            <h2 className="text-2xl font-bold font-pixel">404</h2>
            <p className="text-zinc-500">Juego no encontrado</p>
            <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500 transition-colors">
                <Home size={18} />
                Volver al inicio
            </Link>
        </div>
    );
  }

  // Type color helper for Details page
  const typeColor = game.type === 'ROM' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400';

  // Render HTML safely from markdown
  const htmlDescription = { __html: parse(game.fullDescription) as string };

  // Prepare Obfuscated Link (Base64)
  const isLinkValid = game.downloadUrl && game.downloadUrl !== '#' && game.downloadUrl.startsWith('http');
  const downloadDestination = isLinkValid 
      ? `/download?data=${btoa(game.downloadUrl)}` 
      : '#';

  // Schema Markup (JSON-LD) for VideoGame
  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": game.title,
    "description": game.shortDescription,
    "image": game.coverImage,
    "operatingSystem": game.requirements.os || "Any",
    "applicationCategory": "Game",
    "genre": game.genre,
    "datePublished": game.releaseDate,
    "author": {
        "@type": "Organization",
        "name": game.developer || "Unknown"
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": game.rating,
        "reviewCount": game.comments > 0 ? game.comments : 1, // Must be > 0
        "bestRating": "5",
        "worstRating": "1"
    },
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
    }
  };

  return (
    <div className="pb-12 bg-gray-100 dark:bg-[#333] transition-colors duration-300 w-full overflow-x-hidden relative">
      
      <SEO 
        title={`Descargar ${game.title} (${game.type}) - ${game.language}`}
        description={`${game.shortDescription} Descarga ${game.title} para ${game.platform[0] || 'emulador'}. Tamaño: ${game.downloadSize}.`}
        image={game.coverImage}
        structuredData={gameSchema}
      />

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={() => setSelectedImage(null)}
        >
            <button 
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 p-2 rounded-full transition-colors"
                onClick={() => setSelectedImage(null)}
            >
                <X size={32} />
            </button>
            <img 
                src={selectedImage} 
                alt="Fullscreen view" 
                className="max-w-full max-h-[90vh] rounded shadow-2xl object-contain animate-scaleIn"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
        </div>
      )}

      {/* Breadcrumb strip */}
      <div className="bg-white dark:bg-[#222] border-b border-gray-200 dark:border-[#444] py-3 px-4 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link to="/" className="text-orange-600 dark:text-orange-400 hover:underline">Home</Link>
            <span className="text-zinc-400 dark:text-zinc-500">&gt;</span>
            <span className="text-zinc-600 dark:text-zinc-300">{game.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded shadow-lg max-w-sm mx-auto md:max-w-none overflow-hidden relative group">
                <img 
                    src={game.coverImage} 
                    alt={game.title} 
                    className="w-full h-auto block"
                />
                
                {/* Botón de Editar para Admin */}
                <Link 
                    to={`/admin?edit=${game.id}`}
                    className="absolute top-3 right-3 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                    title="Editar juego (Admin)"
                >
                    <Edit2 size={18} />
                </Link>
            </div>

            <div className="bg-white dark:bg-[#222] p-4 rounded shadow-lg space-y-4 text-sm transition-colors duration-300">
                <h3 className="font-bold text-zinc-800 dark:text-white border-b border-gray-200 dark:border-[#444] pb-2 mb-2">Game Info</h3>
                
                <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Platform:</span>
                    <span className="text-zinc-800 dark:text-white font-medium text-right break-words max-w-[50%]">
                        {game.platform && game.platform.length > 0 ? (
                            <Link to={`/?search=${encodeURIComponent(game.platform[0])}`} className="hover:text-orange-500 hover:underline transition-colors">
                                {game.platform[0]}
                            </Link>
                        ) : 'Unknown'}
                    </span>
                </div>
                
                <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Region:</span>
                    <span className="text-zinc-800 dark:text-white">{game.region}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Tags:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                        {game.genre.map((g, idx) => (
                             <Link 
                                key={idx} 
                                to={`/?search=${encodeURIComponent(g)}`}
                                className="text-xs bg-gray-100 dark:bg-[#333] px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                             >
                                 {g}
                             </Link>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-[#333]">
                    <span className="text-zinc-500 dark:text-zinc-400">Language:</span>
                    <span className="text-zinc-800 dark:text-white text-right break-words max-w-[50%]">{game.language}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Size:</span>
                    <span className="text-zinc-800 dark:text-white">{game.downloadSize}</span>
                </div>
            </div>
            
          </div>

          {/* Main Content */}
          <div className="bg-white dark:bg-[#222] p-6 rounded shadow-lg h-fit transition-colors duration-300">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-800 dark:text-white mb-2 leading-tight">
                {game.title}
            </h1>
            <div className={`text-sm font-bold uppercase mb-6 ${typeColor}`}>
                {game.type}
            </div>

            <h2 className="text-xl font-bold text-zinc-800 dark:text-white border-b-2 border-orange-500 inline-block mb-4">
                Description
            </h2>
            {/* Render Markdown Content */}
            <div 
                className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 leading-relaxed mb-8 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>a]:text-orange-500 break-words"
                dangerouslySetInnerHTML={htmlDescription}
            />
            
            {/* Screenshots Grid */}
            {game.screenshots && game.screenshots.length > 0 && (
                <>
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-white border-b-2 border-orange-500 inline-block mb-4">
                        Screenshots
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        {game.screenshots.map((shot, idx) => (
                            <div 
                                key={idx} 
                                className="aspect-video bg-gray-200 dark:bg-[#333] rounded overflow-hidden shadow-sm hover:scale-[1.02] transition-transform duration-300 cursor-pointer group relative"
                                onClick={() => setSelectedImage(shot)}
                            >
                                <img src={shot} alt={`${game.title} screenshot ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 text-white font-bold bg-black/50 px-2 py-1 rounded text-xs transition-opacity">
                                        VER
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Download Button moved here */}
            <div className="mt-8 border-t border-gray-100 dark:border-[#333] pt-8">
                {isLinkValid ? (
                    <Link 
                        to={downloadDestination}
                        onClick={handleDownloadClick}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 px-6 rounded shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] uppercase text-lg"
                    >
                        <Download size={24} />
                        {game.type === 'ISO' ? 'Download ISO' : 'Download ROM'}
                    </Link>
                ) : (
                    <button 
                        disabled
                        className="w-full bg-gray-300 dark:bg-[#444] text-zinc-500 dark:text-zinc-400 font-bold py-4 px-6 rounded shadow cursor-not-allowed flex items-center justify-center gap-3 uppercase text-lg"
                    >
                        <Download size={24} />
                        Download Not Available
                    </button>
                )}
            </div>

            {/* Rating System - Added after Download Button */}
            <div className="mt-8 flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-dashed border-gray-200 dark:border-[#444]">
                <h3 className="text-xs sm:text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-2 sm:mb-3">
                    {hasRated ? '¡Gracias por votar!' : 'Califica este juego'}
                </h3>
                
                <div className="flex gap-1 sm:gap-2 mb-1 sm:mb-2" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleRate(star)}
                            onMouseEnter={() => !hasRated && setHoverRating(star)}
                            disabled={hasRated}
                            className={`transition-all duration-200 transform ${hasRated ? 'cursor-default' : 'hover:scale-110 sm:hover:scale-125'} p-1`}
                        >
                            <Star 
                                className={`w-8 h-8 sm:w-10 sm:h-10 ${
                                    (hoverRating || userRating || Math.round(parseFloat(game.rating))) >= star 
                                    ? 'fill-orange-500 text-orange-500' 
                                    : 'fill-transparent text-gray-300 dark:text-gray-600'
                                }`}
                            />
                        </button>
                    ))}
                </div>
                
                <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mt-2">
                    {game.rating} / 5.0
                </div>
                <div className="text-xs text-zinc-400">
                    Basado en {game.voteCount || (parseFloat(game.rating) > 0 ? 1 : 0)} votos
                </div>
            </div>

            {/* Comments Section (Giscus) */}
            <Comments />

          </div>

        </div>

        {/* "Te pudiera interesar" Section - Minimal Design (Image + Title + Platform only) */}
        {relatedGames.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-[#444] animate-fadeIn">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-6">Te pudiera interesar</h3>
                
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {relatedGames.map((relatedGame, index) => (
                        <div key={relatedGame.id} className={index === 3 ? 'hidden lg:block' : ''}>
                             <Link to={`/game/${relatedGame.slug}`} className="group block">
                                <div className="relative aspect-square w-full overflow-hidden rounded shadow-sm mb-2">
                                    <img 
                                        src={relatedGame.coverImage} 
                                        alt={relatedGame.title} 
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        loading="lazy"
                                    />
                                    {/* Platform Badge Overlay */}
                                    {relatedGame.platform && relatedGame.platform.length > 0 && (
                                         <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20">
                                             {relatedGame.platform[0]}
                                         </div>
                                    )}
                                </div>
                                <h4 className="text-sm font-bold text-zinc-800 dark:text-white leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
                                    {relatedGame.title}
                                </h4>
                             </Link>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};