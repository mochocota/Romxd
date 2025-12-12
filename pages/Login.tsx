import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, Loader2, AlertCircle } from 'lucide-react';
import { SEO } from '../components/SEO';

export const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión. Verifica tu configuración de Firebase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#333] transition-colors duration-300 px-4">
      <SEO title="Admin Login" description="Acceso restringido" noIndex={true} />
      
      <div className="bg-white dark:bg-[#222] p-8 rounded-lg shadow-xl border border-gray-200 dark:border-[#444] w-full max-w-md text-center animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4 ring-4 ring-orange-50 dark:ring-orange-900/10">
                <Lock className="text-orange-600" size={36} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white font-pixel mb-2">
                RomXD Admin
            </h1>
            <p className="text-zinc-500 text-sm">
                Panel de gestión de contenido
            </p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2 text-left">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
        )}

        <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#444] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:border-orange-500 dark:hover:border-orange-500 text-zinc-700 dark:text-zinc-200 font-bold py-4 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 group relative overflow-hidden shadow-sm"
        >
            {loading ? (
                <Loader2 className="animate-spin text-orange-600" size={24} />
            ) : (
                <>
                    <Shield size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    <span>Iniciar sesión con Google</span>
                </>
            )}
        </button>
        
        <p className="mt-8 text-xs text-zinc-400">
            Solo personal autorizado.
        </p>
      </div>
    </div>
  );
};