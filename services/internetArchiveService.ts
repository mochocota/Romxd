
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
 * Filtra por software para evitar libros o películas.
 */
export const searchArchiveItems = async (query: string): Promise<ArchiveItem[]> => {
  // Construimos una query para buscar en título o identificador, solo software/juegos
  const q = `(title:(${query}) OR identifier:(${query})) AND mediatype:(software)`;
  
  const params = new URLSearchParams({
    q: q,
    fl: 'identifier,title,downloads,collection', // Campos a devolver
    sort: 'downloads desc', // Ordenar por popularidad
    output: 'json',
    rows: '20',
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
 */
export const getArchiveFiles = async (identifier: string): Promise<ArchiveFile[]> => {
  try {
    const response = await fetch(`${BASE_METADATA_URL}/${identifier}`);
    const data = await response.json();
    
    if (!data.files || !Array.isArray(data.files)) return [];

    // Filtramos para devolver solo archivos relevantes (ROMs, ISOs, ZIPs, 7z, RAR)
    // Ignoramos XML, JPG, TXT, etc.
    const validExtensions = ['.iso', '.cso', '.rom', '.bin', '.cue', '.7z', '.zip', '.rar', '.chd', '.rvz', '.wbfs', '.nds', '.gba', '.cia'];
    
    return data.files.filter((file: any) => {
        const name = file.name.toLowerCase();
        return validExtensions.some(ext => name.endsWith(ext));
    }) as ArchiveFile[];

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
