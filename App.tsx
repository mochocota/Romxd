import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { GameDetails } from './pages/GameDetails';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { DownloadRedirect } from './pages/DownloadRedirect';
import { Sitemap } from './pages/Sitemap';
import { ScriptInjector } from './components/ScriptInjector';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GameProvider } from './context/GameContext';
import { UIProvider } from './context/UIContext';
import { Loader2 } from 'lucide-react';

// Componente para proteger rutas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#333]">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <UIProvider>
            <GameProvider>
                <AuthProvider>
                <Router>
                    <ScriptInjector />
                    <div className="min-h-screen bg-gray-100 text-zinc-800 dark:bg-[#333333] dark:text-zinc-200 font-sans transition-colors duration-300">
                    <Navbar />
                    <main>
                        <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/game/:slug" element={<GameDetails />} />
                        <Route path="/download" element={<DownloadRedirect />} />
                        <Route path="/login" element={<Login />} />
                        
                        <Route 
                            path="/admin" 
                            element={
                            <ProtectedRoute>
                                <Admin />
                            </ProtectedRoute>
                            } 
                        />
                        
                        <Route path="/sitemap" element={<Sitemap />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                    
                    <footer className="bg-white dark:bg-[#222] border-t border-gray-200 dark:border-[#444] py-8 mt-12 transition-colors duration-300">
                        <div className="max-w-6xl mx-auto px-4 text-center">
                        <div className="flex justify-center gap-4 mb-4 text-sm font-medium">
                            <Link to="/" className="text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white transition-colors">Home</Link>
                            <Link to="/login" className="text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white transition-colors">Admin</Link>
                            <Link to="/sitemap" className="text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white transition-colors">Mapa del Sitio</Link>
                        </div>
                        <p className="text-zinc-400 dark:text-zinc-600 text-xs">
                            &copy; {new Date().getFullYear()} RomXD. All rights reserved.
                        </p>
                        </div>
                    </footer>
                    </div>
                </Router>
                </AuthProvider>
            </GameProvider>
        </UIProvider>
    </ThemeProvider>
  );
};

export default App;