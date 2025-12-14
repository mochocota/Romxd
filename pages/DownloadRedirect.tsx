
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Download, ExternalLink, Clock, Ghost } from 'lucide-react';
import { useGames } from '../context/GameContext';
import { AdUnit } from '../components/AdUnit';
import { SEO } from '../components/SEO';

export const DownloadRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { adsConfig } = useGames();
  
  // Contador para mostrar publicidad
  const [countdown, setCountdown] = useState(30);
  const [ready, setReady] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decoded = atob(data);
        setTargetUrl(decoded);
      } catch (e) {
        console.error("Failed to decode URL");
      }
    }

    // Timer Logic
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams]);

  // --- MODO FANTASMA: INYECCIÓN DE META NO-REFERRER ---
  // Esto asegura que ninguna petición saliente desde esta página lleve la cabecera "Referer".
  // Para Myrient/Archive, la visita parecerá "Directa" (sin origen web).
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);

    return () => {
      // Limpiamos al salir para no afectar estadísticas internas en otras páginas
      if (document.head.contains(meta)) {
        document.head.removeChild(meta);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-white dark:bg-[#111] text-zinc-800 dark:text-zinc-200 transition-colors duration-300">
      <SEO title="Descargando Archivo" description="Generando enlace anónimo..." noIndex={true} />
      
      {/* --- ESPACIO PUBLICITARIO SUPERIOR (Leaderboard 728x90) --- */}
      <div className="w-full flex justify-center mb-8 mx-4">
          <AdUnit 
            adCode={adsConfig.topAdCode} 
            label="728x90"
            className="w-full max-w-[728px] min-h-[90px]" 
          />
      </div>

      {/* Contenedor Principal del Contador */}
      <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] p-8 rounded-xl shadow-xl border border-gray-200 dark:border-[#333] text-center relative overflow-hidden mx-4 z-10">
        
        <div className="mb-6 flex justify-center">
            {ready ? (
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 animate-bounce">
                    <ShieldCheck size={56} />
                </div>
            ) : (
                <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-[#333]"></div>
                    <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xl font-mono">
                        {countdown}
                    </div>
                </div>
            )}
        </div>

        <h2 className="text-2xl font-bold mb-2">
            {ready ? 'Enlace Generado' : 'Preparando Descarga...'}
        </h2>
        
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm">
            {ready 
                ? 'El archivo está listo. La conexión ha sido anonimizada.' 
                : 'Por favor espera unos segundos mientras conectamos con el servidor seguro.'}
        </p>

        {ready ? (
            <a 
                href={targetUrl}
                target="_self"
                rel="noreferrer noopener"
                referrerPolicy="no-referrer"
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 px-6 rounded-lg transition-transform hover:scale-[1.02] shadow-lg shadow-orange-500/20 text-lg uppercase"
            >
                <Download size={24} />
                DESCARGAR AHORA
            </a>
        ) : (
             <button disabled className="w-full h-14 bg-gray-100 dark:bg-[#333] rounded-lg flex items-center justify-center text-zinc-400 gap-2 cursor-not-allowed font-medium">
                <Clock size={18} className="animate-pulse" />
                Espera {countdown} segundos...
             </button>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#333] text-xs text-zinc-400 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1">
                <Ghost size={12} className="text-purple-500" />
                <span className="font-bold text-purple-600 dark:text-purple-400">Modo Anónimo Activo</span>
            </div>
            <span>No se comparten datos de origen con el servidor.</span>
        </div>
      </div>

      {/* --- ESPACIO PUBLICITARIO INFERIOR (Rectangle 300x250) --- */}
      <div className="mt-8 w-full flex justify-center mx-4">
         <AdUnit 
            adCode={adsConfig.bottomAdCode} 
            label="300x250"
            className="w-full max-w-[300px] min-h-[250px]"
         />
      </div>

    </div>
  );
};
