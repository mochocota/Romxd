
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
 * MEJORA: Búsqueda flexible (Fuzzy/Wildcard) con operadores OR.
 * Permite encontrar resultados que contengan "algo" de la búsqueda.
 */
export const searchArchiveItems = async (query: string, collections: string[] = []): Promise<ArchiveItem[]> => {
  // 1. Limpieza básica
  const cleanQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, " ");
  
  const terms = cleanQuery.split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return [];

  // 2. Construcción de Query Flexible
  // Nivel 1: Frase Exacta (Prioridad Máxima ^20)
  const exactPhrase = `"${cleanQuery}"^20`;
  
  // Nivel 2: Contiene TODAS las palabras (Prioridad Alta ^10)
  const allTerms = terms.length > 1 ? `(${terms.join(' AND ')})^10` : '';

  // Nivel 3: Contiene ALGUNA palabra (Prioridad Media)
  const anyTerm = `(${terms.join(' OR ')})`;

  // Nivel 4: Búsqueda parcial/comodín (ej: busca "Mario" y encuentra "PaperMario")
  // Usamos el asterisco al final para autocompletar palabras
  const wildcardTerms = terms.map(t => `${t}*`).join(' OR ');

  // Combinamos todo en la query de texto
  // Buscamos tanto en el título como en el identificador (ID)
  const textQueryParts = [exactPhrase, allTerms, anyTerm, wildcardTerms].filter(Boolean).join(' OR ');
  const textQuery = `(title:(${textQueryParts}) OR identifier:(${anyTerm} OR ${wildcardTerms}))`;

  // 3. Lógica de Colecciones (Repositorios)
  let collectionQuery = '';
  
  if (collections.length > 0) {
      // Si hay colecciones de confianza, restringimos la búsqueda a ellas.
      // Buscamos si el item pertenece a la colección (collection:) O si el item ES la colección (identifier:)
      const collectionsOr = collections.map(c => `"${c}"`).join(' OR ');
      collectionQuery = `AND (collection:(${collectionsOr}) OR identifier:(${collectionsOr}))`;
  } else {
      // Si no hay colecciones definidas, buscamos globalmente solo software
      collectionQuery = `AND mediatype:(software)`;
  }

  // Query Final
  const q = `${textQuery} ${collectionQuery}`;
  
  const params = new URLSearchParams({
    q: q,
    fl: 'identifier,title,downloads,collection',
    sort: 'downloads desc',
    output: 'json',
    rows: '50', 
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

    // Filtramos para devolver solo archivos relevantes
    const validExtensions = ['.iso', '.cso', '.rom', '.bin', '.cue', '.7z', '.zip', '.rar', '.chd', '.rvz', '.wbfs', '.nds', '.gba', '.cia'];
    
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
    return `https://archive.org/download/${identifier}/${encodeURIComponent(filename)}`;
};
