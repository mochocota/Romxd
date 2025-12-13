
export interface ArchiveItem {
  identifier: string;
  title: string;
  downloads: number;
  collection?: string[];
  // Campos opcionales para Deep Search (cuando el resultado es un archivo específico dentro de un repo)
  isFileSearch?: boolean;
  fileName?: string;
  fileSize?: string;
}

export interface ArchiveFile {
  name: string;
  size?: string;
  format?: string;
}

const BASE_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const BASE_METADATA_URL = 'https://archive.org/metadata';

// Cache simple para evitar descargar la lista de archivos de un repo gigante múltiples veces en la misma sesión
const repoFilesCache: Record<string, ArchiveFile[]> = {};

/**
 * Obtiene la lista de archivos dentro de un Item específico.
 * ORDENADO: Los archivos con nombres "Spanish/Europe" aparecen primero.
 */
export const getArchiveFiles = async (identifier: string): Promise<ArchiveFile[]> => {
  // Check cache first
  if (repoFilesCache[identifier]) {
      return repoFilesCache[identifier];
  }

  try {
    const response = await fetch(`${BASE_METADATA_URL}/${identifier}`);
    const data = await response.json();
    
    if (!data.files || !Array.isArray(data.files)) return [];

    // Filtramos para devolver solo archivos relevantes
    const validExtensions = ['.iso', '.cso', '.rom', '.bin', '.cue', '.7z', '.zip', '.rar', '.chd', '.rvz', '.wbfs', '.nds', '.gba', '.cia', '.apk'];
    
    const validFiles = data.files.filter((file: any) => {
        const name = file.name.toLowerCase();
        return validExtensions.some(ext => name.endsWith(ext));
    }) as ArchiveFile[];

    // Algoritmo de ordenamiento: Priorizar Europa/Español
    const priorityTerms = [
        'europe', 'eur', 'eu', 
        'spain', 'spanish', 'español', 'castellano', 'latino', 
        'multi', 'traducido', 'patch',
        '(es)', '[es]', '_es_', ' es ', '-es-', '.es.',
        ',es,', ',es)', '(es,', 'es,', ', es', 'es)' 
    ];
    
    validFiles.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        
        const scoreA = priorityTerms.some(term => nameA.includes(term)) ? 1 : 0;
        const scoreB = priorityTerms.some(term => nameB.includes(term)) ? 1 : 0;
        
        return scoreB - scoreA;
    });

    // Save to cache
    repoFilesCache[identifier] = validFiles;

    return validFiles;

  } catch (error) {
    console.error('Error fetching Archive files:', error);
    // Return empty array instead of throwing to allow other searches to proceed
    return [];
  }
};

/**
 * Busca "Items" (Colecciones o Juegos sueltos) en Internet Archive.
 * AHORA SOPORTA "DEEP SEARCH" EN REPOSITORIOS DE CONFIANZA.
 */
export const searchArchiveItems = async (query: string, collections: string[] = []): Promise<ArchiveItem[]> => {
  const cleanQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s\-\_\.]/g, " ").trim();
  if (!cleanQuery) return [];

  // --- 1. DEEP SEARCH (Buscar archivos DENTRO de los repositorios de confianza) ---
  let deepSearchResults: ArchiveItem[] = [];
  
  if (collections.length > 0) {
      const searchTerms = cleanQuery.toLowerCase().split(/\s+/);
      
      // Buscamos en paralelo dentro de todos los repositorios de confianza
      const deepSearchPromises = collections.map(async (repoId) => {
          const files = await getArchiveFiles(repoId);
          
          // Filtrar archivos que coincidan con TODOS los términos de búsqueda
          const matchingFiles = files.filter(file => {
              const fileName = file.name.toLowerCase();
              return searchTerms.every(term => fileName.includes(term));
          });

          // Convertir archivos encontrados en "ArchiveItems" virtuales
          return matchingFiles.map(file => ({
              identifier: repoId,
              title: file.name, // El título del resultado será el nombre del archivo
              downloads: 0, // No disponible por archivo individual fácilmente
              collection: ['Trusted Repo File'],
              isFileSearch: true,
              fileName: file.name,
              fileSize: file.size
          }));
      });

      const resultsArrays = await Promise.all(deepSearchPromises);
      deepSearchResults = resultsArrays.flat();
  }

  // --- 2. STANDARD SEARCH (Buscar Items/Páginas en Internet Archive) ---
  // Si encontramos muchos archivos específicos, tal vez no necesitamos buscar items genéricos, 
  // pero lo haremos igual por si acaso.
  
  const terms = cleanQuery.split(/\s+/).filter(t => t.length > 0);
  const fuzzyQuery = terms.map(t => t.length > 2 ? `${t}~` : t).join(' AND ');
  const exactQuery = terms.join(' AND ');
  const textQuery = `(title:(${exactQuery}^10 OR ${fuzzyQuery}) OR identifier:(${fuzzyQuery}))`;

  let collectionQuery = '';
  // Si hay repositorios, intentamos buscar items que pertenezcan a esas colecciones (si son colecciones reales)
  if (collections.length > 0) {
      const collectionsOr = collections.map(c => `"${c}"`).join(' OR ');
      collectionQuery = `AND collection:(${collectionsOr})`;
  } else {
      collectionQuery = `AND mediatype:(software)`;
  }

  const q = `${textQuery} ${collectionQuery}`;
  const params = new URLSearchParams({
    q: q,
    fl: 'identifier,title,downloads,collection',
    sort: 'downloads desc',
    output: 'json',
    rows: '20', 
    page: '1'
  });

  let standardResults: ArchiveItem[] = [];
  try {
    const response = await fetch(`${BASE_SEARCH_URL}?${params.toString()}`);
    const data = await response.json();
    standardResults = data.response.docs as ArchiveItem[];
  } catch (error) {
    console.warn('Standard search failed or empty');
  }

  // --- 3. MERGE RESULTS ---
  // Priorizamos los resultados "Deep Search" (archivos exactos encontrados en tus repos)
  return [...deepSearchResults, ...standardResults];
};

/**
 * Genera el enlace de descarga directa final.
 */
export const generateDirectLink = (identifier: string, filename: string): string => {
    return `https://archive.org/download/${identifier}/${encodeURIComponent(filename)}`;
};
