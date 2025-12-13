
export interface ArchiveItem {
  identifier: string;
  title: string;
  downloads: number;
  collection?: string[];
}

export interface ArchiveFile {
  name: string;
  size?: string;
  format?: string;
}

const BASE_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const BASE_METADATA_URL = 'https://archive.org/metadata';

/**
 * Busca "Items" (Colecciones o Juegos sueltos) en Internet Archive.
 * MEJORA: Búsqueda profunda y tolerante a fallos (Fuzzy Search).
 * Permite encontrar "Castlevania Portrain" (typo) como "Castlevania Portrait".
 */
export const searchArchiveItems = async (query: string): Promise<ArchiveItem[]> => {
  // 1. Limpieza básica: Quitamos acentos y caracteres raros, dejamos espacios.
  const cleanQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, " ");
  
  const terms = cleanQuery.split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return [];

  // 2. Construcción de términos fuzzy
  // Añadimos '~' a las palabras significativas (>2 letras) para permitir errores tipográficos (Distance 1-2)
  // Ejemplo: "Portrain" -> "Portrain~" machea con "Portrait"
  const fuzzyQuery = terms.map(t => t.length > 2 ? `${t}~` : t).join(' AND ');
  
  // 3. Query exacta para dar prioridad (Boost ^10) si el usuario lo escribió bien
  const exactQuery = terms.join(' AND ');

  // 4. Query compuesta
  // Buscamos en 'title' (con boost exacto y fallback fuzzy) y en 'identifier'
  const q = `(title:(${exactQuery}^10 OR ${fuzzyQuery}) OR identifier:(${fuzzyQuery})) AND mediatype:(software)`;
  
  const params = new URLSearchParams({
    q: q,
    fl: 'identifier,title,downloads,collection', // Campos a devolver
    sort: 'downloads desc', // Ordenar por popularidad
    output: 'json',
    rows: '35', // Un poco más de resultados para deep search
    page: '1'
  });

  try {
    const response = await fetch(`${BASE_SEARCH_URL}?${params.toString()}`);
    const data = await response.json();
    return data.response.docs as ArchiveItem[];
  } catch (error) {
    console.error('Error searching Archive.org:', error);
    throw new Error('Error de conexión con Internet Archive');
  }
};

/**
 * Obtiene la lista de archivos dentro de un Item específico.
 * ORDENADO: Los archivos con nombres "Spanish/Europe" aparecen primero.
 */
export const getArchiveFiles = async (identifier: string): Promise<ArchiveFile[]> => {
  try {
    const response = await fetch(`${BASE_METADATA_URL}/${identifier}`);
    const data = await response.json();
    
    if (!data.files || !Array.isArray(data.files)) return [];

    // Filtramos para devolver solo archivos relevantes (ROMs, ISOs, ZIPs, 7z, RAR)
    const validExtensions = ['.iso', '.cso', '.rom', '.bin', '.cue', '.7z', '.zip', '.rar', '.chd', '.rvz', '.wbfs', '.nds', '.gba', '.cia'];
    
    const validFiles = data.files.filter((file: any) => {
        const name = file.name.toLowerCase();
        return validExtensions.some(ext => name.endsWith(ext));
    }) as ArchiveFile[];

    // Algoritmo de ordenamiento: Priorizar Europa/Español al principio de la lista
    const priorityTerms = [
        'europe', 'eur', 'eu', 
        'spain', 'spanish', 'español', 'castellano', 'latino', 
        'multi', 'traducido', 'patch',
        // Variantes específicas para "es"
        '(es)', '[es]', '_es_', ' es ', '-es-', '.es.',
        // Patrones para listas de idiomas ej: (En,Fr,Es,De)
        ',es,', ',es)', '(es,', 'es,', ', es', 'es)' 
    ];
    
    validFiles.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        
        const scoreA = priorityTerms.some(term => nameA.includes(term)) ? 1 : 0;
        const scoreB = priorityTerms.some(term => nameB.includes(term)) ? 1 : 0;
        
        // Si B tiene prioridad y A no, B va primero.
        return scoreB - scoreA;
    });

    return validFiles;

  } catch (error) {
    console.error('Error fetching Archive files:', error);
    throw new Error('Error obteniendo archivos');
  }
};

/**
 * Genera el enlace de descarga directa final.
 */
export const generateDirectLink = (identifier: string, filename: string): string => {
    // Es crucial codificar el nombre del archivo porque suele tener espacios y símbolos
    return `https://archive.org/download/${identifier}/${encodeURIComponent(filename)}`;
};
