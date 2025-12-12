import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga todas las variables de entorno, incluyendo las que no tienen prefijo VITE_ si es necesario
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Polyfill para que el SDK de Gemini encuentre process.env.API_KEY en el navegador
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || '')
    }
  };
});