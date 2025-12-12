import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Mail, Key, ArrowRight, ArrowLeft } from 'lucide-react';
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
      // Pequeña pausa para que la animación se sienta fluida al salir (opcional)
      setTimeout(() => navigate('/admin'), 500);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('Credenciales incorrectas.');
      } else if (err.code === 'auth/invalid-email') {
          setError('Email inválido.');
      } else if (err.code === 'auth/too-many-requests') {
          setError('Demasiados intentos. Espera un momento.');
      } else {
          setError('Error de conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full overflow-hidden bg-white dark:bg-[#111] transition-colors duration-300">
      <SEO title="Admin Login" description="Acceso restringido" noIndex={true} />

      {/* --- LEFT SIDE: ARTWORK (Slide In Left) --- */}
      <div className="hidden lg:flex w-1/2 bg-black relative animate-slide-in-left z-10">
         {/* Background Image */}
         <img 
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" 
            alt="Retro Gaming Art" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
         />
         
         {/* Gradient Overlay */}
         <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black/80"></div>

         {/* Content */}
         <div className="relative z-20 p-16 flex flex-col justify-between h-full w-full">
            <div>
               <Link to="/" className="flex items-center gap-2 group w-fit">
                    <h1 className="text-3xl font-bold tracking-tight leading-none font-pixel mt-1 text-white drop-shadow-lg">
                        <span className="text-white">Rom</span>
                        <span className="animate-pulse text-orange-500">XD</span>
                    </h1>
               </Link>
            </div>

            <div className="space-y-6 max-w-lg">
                <blockquote className="text-2xl font-light text-white leading-relaxed italic border-l-4 border-orange-500 pl-6">
                    "El catálogo definitivo para los amantes de la emulación y los clásicos retro."
                </blockquote>
                <div className="flex gap-2">
                    <div className="h-1 w-12 bg-white rounded-full opacity-50"></div>
                    <div className="h-1 w-4 bg-white rounded-full opacity-30"></div>
                    <div className="h-1 w-4 bg-white rounded-full opacity-30"></div>
                </div>
            </div>
         </div>
      </div>

      {/* --- RIGHT SIDE: FORM (Slide In Right) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative bg-white dark:bg-[#111] animate-slide-in-right">
        
        {/* Back Button Mobile */}
        <Link to="/" className="absolute top-6 left-6 lg:hidden p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
            <ArrowLeft size={24} />
        </Link>

        <div className="w-full max-w-md space-y-8">
            
            <div className="text-center lg:text-left space-y-2">
                <h2 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    Bienvenido
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Introduce tus credenciales de administrador para continuar.
                </p>
            </div>

            {error && (
                <div className="animate-fade-in-up p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3 shadow-sm">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6 mt-8">
                
                <div className="space-y-1 group">
                    <label className="text-xs font-bold uppercase text-zinc-400 group-focus-within:text-orange-600 transition-colors ml-1">Correo Electrónico</label>
                    <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.01]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                            placeholder="nombre@ejemplo.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1 group">
                    <label className="text-xs font-bold uppercase text-zinc-400 group-focus-within:text-orange-600 transition-colors ml-1">Contraseña</label>
                    <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.01]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Key className="h-5 w-5 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-500/30 text-base font-bold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transform transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {loading ? (
                        <Loader2 className="animate-spin h-6 w-6" />
                    ) : (
                        <>
                            Ingresar al Panel <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </button>
            </form>

            <div className="pt-6 text-center">
                <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors">
                    ← Volver a la página principal
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};