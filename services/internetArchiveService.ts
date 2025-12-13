
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
 * CAMBIO: Se ha eliminado el filtro estricto de región en el título del ITEM.
 * Esto corrige el problema donde juegos como "Pokemon X" no aparecían porque el contenedor
 * no tenía "Es" o "Europe" en su título principal, aunque sus archivos internos sí.
 */
export const searchArchiveItems = async (query: string): Promise<ArchiveItem[]> => {
  // 1. Normalizar la búsqueda: quitar acentos y caracteres especiales (Pokémon -> Pokemon)
  const cleanQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 2. Query General: Buscamos por título o identificador.
  // Nota: Ya no forzamos "AND (Europe OR Es...)" aquí para no ocultar resultados válidos.
  // La priorización de idioma se hace en el siguiente paso (getArchiveFiles).
  const q = `(title:(${cleanQuery}) OR identifier:(${cleanQuery})) AND mediatype:(software)`;
  
  const params = new URLSearchParams({
    q: q,
    fl: 'identifier,title,downloads,collection', // Campos a devolver
    sort: 'downloads desc', // Ordenar por popularidad
    output: 'json',
    rows: '30',
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
