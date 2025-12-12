import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, LogIn, Mail, Key } from 'lucide-react';
import { SEO } from '../components/SEO';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
        setError('Por favor completa todos los campos.');
        return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('Credenciales incorrectas. Intenta de nuevo.');
      } else if (err.code === 'auth/invalid-email') {
          setError('El formato del correo es inválido.');
      } else if (err.code === 'auth/too-many-requests') {
          setError('Demasiados intentos fallidos. Intenta más tarde.');
      } else {
          setError('Error al iniciar sesión. Intenta más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#333] transition-colors duration-300 px-4">
      <SEO title="Admin Login" description="Acceso restringido" noIndex={true} />
      
      <div className="bg-white dark:bg-[#222] p-8 rounded-lg shadow-xl border border-gray-200 dark:border-[#444] w-full max-w-md animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4 ring-4 ring-orange-50 dark:ring-orange-900/10">
                <Lock className="text-orange-600" size={36} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white font-pixel mb-2">
                RomXD Admin
            </h1>
            <p className="text-zinc-500 text-sm">
                Acceso con Credenciales
            </p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2 text-left border border-red-100 dark:border-red-900/30">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">Correo Electrónico</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#444] text-zinc-800 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                        placeholder="admin@romxd.com"
                        required
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">Contraseña</label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#444] text-zinc-800 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-[0.98]"
            >
                {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <>
                        <LogIn size={20} />
                        <span>Entrar</span>
                    </>
                )}
            </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-zinc-400">
            Solo personal autorizado.
        </p>
      </div>
    </div>
  );
};