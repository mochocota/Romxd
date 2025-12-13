
import { Game } from '../types';
import { translateToSpanish, translateKeywords } from './geminiService';

const CLIENT_ID = 'enys9zuc31puz2hj3k5enkviog5fvw';
const CLIENT_SECRET = 'qnd0id590kvr40gny1qz42k60a1ig6';

// Usamos corsproxy.io que suele ser el más estable para headers, 
// pero codificamos siempre la URL destino.
const CORS_PROXY = 'https://corsproxy.io/?'; 

let accessToken = '';

interface IGDBImage {
  image_id: string;
}

interface IGDBCompany {
  company: {
    name: string;
  };
  developer: boolean;
}

interface IGDBGameResult {
  id: number;
  name: string;
  first_release_date?: number;
  cover?: IGDBImage;
}

interface IGDBGameDetail extends IGDBGameResult {
  summary?: string;
  storyline?: string;
  screenshots?: IGDBImage[];
  genres?: { name: string }[];
  platforms?: { name: string }[];
  involved_companies?: IGDBCompany[];
}

const getAccessToken = async () => {
  if (accessToken) return accessToken;

  // Twitch Auth URL
  const authUrl = `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`;
  
  try {
    // Importante: EncodeURIComponent para asegurar que el proxy lea toda la URL
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(authUrl)}`, {
      method: 'POST',
    });

    if (!response.ok) {
        throw new Error(`Auth Error: ${response.status}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    return accessToken;
  } catch (error) {
    console.error('Error getting IGDB token:', error);
    // Lanzamos error legible para el catch del componente
    throw new Error('Fallo de autenticación con IGDB. Verifica las credenciales.');
  }
};

export const searchIGDBGames = async (query: string): Promise<IGDBGameResult[]> => {
  try {
    const token = await getAccessToken();
    
    const queryBody = `
      search "${query}";
      fields name, first_release_date, cover.image_id;
      limit 10;
    `;

    const targetUrl = 'https://api.igdb.com/v4/games';
    
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`, {
      method: 'POST',
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain', // IGDB exige text/plain para raw body
      },
      body: queryBody
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Token expirado o inválido, reseteamos para el próximo intento
            accessToken = ''; 
            throw new Error('Credenciales inválidas (401). Intenta de nuevo.');
        }
        throw new Error(`IGDB API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("IGDB Search Error:", error);
    throw error;
  }
};

export const getIGDBGameDetails = async (gameId: number): Promise<Partial<Game>> => {
  try {
      const token = await getAccessToken();

      const queryBody = `
        fields name, summary, storyline, first_release_date, 
        cover.image_id, 
        screenshots.image_id, 
        genres.name, 
        platforms.name,
        involved_companies.company.name, involved_companies.developer;
        where id = ${gameId};
      `;

      const targetUrl = 'https://api.igdb.com/v4/games';

      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`, {
        method: 'POST',
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: queryBody
      });

      const data: IGDBGameDetail[] = await response.json();
      const igdbGame = data[0];

      if (!igdbGame) throw new Error('Game not found');

      // Map IGDB data to our App Game format
      const getImageUrl = (imageId: string, size: 'cover_big' | 'screenshot_huge' | '1080p' | '720p' = '1080p') => 
        `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;

      const developer = igdbGame.involved_companies?.find(c => c.developer)?.company.name || '';
      
      const releaseDate = igdbGame.first_release_date 
        ? new Date(igdbGame.first_release_date * 1000).toISOString().split('T')[0] 
        : '';

      // Prepare text for translation
      const partsToTranslate = [];
      if (igdbGame.summary) partsToTranslate.push(igdbGame.summary);
      if (igdbGame.storyline) partsToTranslate.push(igdbGame.storyline);
      
      const rawDescription = partsToTranslate.join('\n\n');
      const rawGenres = igdbGame.genres?.map(g => g.name).join(', ') || '';

      // Execute translations in parallel for performance
      const [translatedDescription, translatedGenres] = await Promise.all([
        rawDescription ? translateToSpanish(rawDescription) : Promise.resolve(''),
        rawGenres ? translateKeywords(rawGenres) : Promise.resolve(rawGenres)
      ]);

      const finalGenres = translatedGenres ? translatedGenres.split(',').map(s => s.trim()) : [];

      return {
        title: igdbGame.name,
        shortDescription: translatedDescription ? translatedDescription.slice(0, 150) + '...' : '',
        fullDescription: translatedDescription || '',
        coverImage: igdbGame.cover ? getImageUrl(igdbGame.cover.image_id, '1080p') : '',
        screenshots: igdbGame.screenshots?.map(s => getImageUrl(s.image_id, '1080p')).slice(0, 4) || [],
        genre: finalGenres.length > 0 ? finalGenres : (igdbGame.genres?.map(g => g.name) || []),
        platform: igdbGame.platforms?.map(p => p.name) || [],
        releaseDate: releaseDate,
        developer: developer,
        downloadSize: 'TBD',
        type: 'ISO',
        language: 'English',
        region: 'US'
      };
  } catch (error) {
      console.error("IGDB Details Error:", error);
      throw error;
  }
};
