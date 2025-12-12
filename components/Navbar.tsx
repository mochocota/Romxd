import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, Sun, Moon, User, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useGames } from '../context/GameContext';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { menuLinks } = useGames();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    } else {
      navigate('/');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Explicitly reset scroll when clicking Logo or Home to ensure "Start" behavior
  const handleHomeClick = () => {
    setIsMenuOpen(false);
    if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="w-full relative">
      {/* Top Header - Logo & Menu */}
      <div className="bg-white dark:bg-[#222222] border-b border-gray-200 dark:border-[#333] transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link 
                to="/" 
                onClick={handleHomeClick}
                className="flex items-center group logo-anim-container gap-2"
            >
                 {/* 
                    Pixel Font applied here. 
                    Colors are handled by CSS variables.
                 */}
                 <h1 className="text-lg md:text-xl font-bold tracking-tight leading-none font-pixel mt-1 transition-transform duration-200 flex items-center">
                   <span className="logo-rom">Rom</span>
                   <span className="logo-xd">XD</span>
                 </h1>
            </Link>

            <div className="flex items-center gap-2 relative">
                
                {/* DESKTOP MENU (Hidden on mobile, Visible on MD+) */}
                <nav className="hidden md:flex items-center gap-6 mr-4 border-r border-gray-200 dark:border-[#444] pr-4 h-8">
                    {menuLinks.map(link => {
                        const isExternal = link.url.startsWith('http') || link.url.startsWith('https');
                        const isHome = link.url === '/';
                        const commonClasses = "text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors";

                        if (isExternal) {
                            return (
                                <a 
                                    key={link.id} 
                                    href={link.url}
                                    className={commonClasses}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {link.label}
                                </a>
                            );
                        }
                        return (
                            <Link 
                                key={link.id} 
                                to={link.url}
                                className={commonClasses}
                                onClick={isHome ? handleHomeClick : undefined}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <Link to="/admin" className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-white transition-colors" title="Login / Admin">
                    <User size={24} />
                </Link>
                
                {/* MOBILE MENU BUTTON (Visible on mobile, Hidden on MD+) */}
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`md:hidden p-2 transition-colors ${isMenuOpen ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-white'}`}
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Dropdown Menu Overlay (Mobile Only) */}
                {isMenuOpen && (
                    <div 
                        ref={menuRef}
                        className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#222] shadow-2xl rounded-lg border border-gray-200 dark:border-[#444] z-50 overflow-hidden animate-fadeIn origin-top-right md:hidden"
                    >
                        <div className="flex flex-col py-2">
                            {menuLinks.length > 0 ? (
                                menuLinks.map(link => {
                                    const isExternal = link.url.startsWith('http') || link.url.startsWith('https');
                                    const isHome = link.url === '/';
                                    const commonClasses = "px-6 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-[#333] hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-left block w-full";
                                    
                                    if (isExternal) {
                                        return (
                                            <a 
                                                key={link.id} 
                                                href={link.url}
                                                className={commonClasses}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                {link.label}
                                            </a>
                                        );
                                    }

                                    return (
                                        <Link 
                                            key={link.id} 
                                            to={link.url}
                                            className={commonClasses}
                                            onClick={isHome ? handleHomeClick : () => setIsMenuOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="px-6 py-3 text-xs text-zinc-500 italic">No hay enlaces</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Search Bar & Tools Row */}
      <div className="bg-white dark:bg-[#2c3e50] shadow-md dark:shadow-lg relative z-20 transition-colors duration-300">
         <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex w-full">
                {/* Search Input Group with Integrated Tools */}
                <div className="w-full flex items-center bg-gray-100 dark:bg-[#34495e] border border-gray-200 dark:border-[#465f79] h-10 overflow-hidden focus-within:border-orange-400 dark:focus-within:border-blue-400 transition-colors">
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none text-zinc-800 dark:text-white h-full px-4 text-sm focus:outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                    />
                    
                    {/* Integrated Controls */}
                    <div className="flex items-center gap-1 px-2 h-full border-r border-gray-300 dark:border-[#465f79]">
                        <button 
                            onClick={toggleTheme}
                            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors" 
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>

                    <button 
                        onClick={handleSearch}
                        className="h-full w-12 bg-gray-200 dark:bg-[#ecf0f1] hover:bg-gray-300 dark:hover:bg-white text-zinc-600 dark:text-zinc-700 flex items-center justify-center transition-colors"
                    >
                        <Search size={18} />
                    </button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};