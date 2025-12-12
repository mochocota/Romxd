import React from 'react';
import Giscus from '@giscus/react';
import { useTheme } from '../context/ThemeContext';
import { useGames } from '../context/GameContext';
import { MessageSquare } from 'lucide-react';

export const Comments: React.FC = () => {
  const { theme } = useTheme();
  const { giscusConfig } = useGames();

  // If not configured/enabled, don't render anything or render placeholder
  if (!giscusConfig.enabled || !giscusConfig.repo || !giscusConfig.repoId) {
    return null; 
  }

  return (
    <div className="w-full animate-fadeIn mt-8">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-[#444] pb-2">
        <MessageSquare className="text-orange-600 dark:text-orange-400" size={24} />
        <h3 className="text-xl font-bold text-zinc-800 dark:text-white">Comentarios</h3>
      </div>
      
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#333]">
        <Giscus
          id="comments"
          repo={giscusConfig.repo as any}
          repoId={giscusConfig.repoId}
          category={giscusConfig.category}
          categoryId={giscusConfig.categoryId}
          mapping={giscusConfig.mapping as any}
          term="Welcome to RomXD!"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme={theme === 'dark' ? 'transparent_dark' : 'light'}
          lang="es"
          loading="lazy"
        />
      </div>
    </div>
  );
};