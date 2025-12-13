
import React, { useState, useRef, useEffect } from 'react';
import { useGames } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Game, MenuLink } from '../types';
import { 
    Plus, Trash2, Edit2, Save, Eye, Layout, FileText, Cpu, 
    Bold, Italic, List, Heading, Link as LinkIcon, Quote, Image as ImageIcon,
    ArrowLeft, Search, Tags, X, Upload, Youtube, Layers, Menu as MenuIcon,
    RotateCcw, Wand2, Loader2, Download, Database, Megaphone, Code, Globe, 
    MessageSquare, LogOut, AlertTriangle, Copy, Check, Shield, Library, Archive, Globe2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchIGDBGames, getIGDBGameDetails } from '../services/igdbService';
import { searchArchiveItems, getArchiveFiles, generateDirectLink, ArchiveItem, ArchiveFile } from '../services/internetArchiveService';

const INITIAL_FORM_STATE: Game = {
  id: '',
  title: '',
  slug: '',
  shortDescription: '',
  fullDescription: '',
  coverImage: '',
  heroImage: '',
  screenshots: [],
  genre: [], 
  platform: [],
  releaseDate: '',
  developer: '',
  downloadSize: '',
  requirements: {
    os: 'PSP',
    processor: 'N/A',
    memory: 'N/A',
    graphics: 'N/A',
    storage: '1GB'
  },
  downloadUrl: '#',
  type: 'ISO',
  region: 'US',
  language: 'English',
  downloads: '0',
  rating: '0',
  comments: 0
};

// Helper to create URL-friendly slugs
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const Admin: React.FC = () => {
  const { 
      games, tags, platforms, menuLinks, adsConfig, trustedCollections,
      addGame, updateGame, deleteGame, 
      addTag, deleteTag, addPlatform, deletePlatform,
      addMenuLink, updateMenuLink, deleteMenuLink,
      updateAdsConfig, addTrustedCollection, deleteTrustedCollection
  } = useGames();
  
  const { logout, user } = useAuth();
  const { toast, dialog } = useUI();
  
  const [searchParams, setSearchParams] = useSearchParams();

  // View State
  const [view, setView] = useState<'list' | 'editor' | 'categories'>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'tech'>('basic');
  const [formData, setFormData] = useState<Game>(INITIAL_FORM_STATE);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rules Error Modal State
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  
  // Manager Local State
  const [managerTab, setManagerTab] = useState<'platforms' | 'tags' | 'menu' | 'ads' | 'repos'>('platforms');
  const [newItemName, setNewItemName] = useState('');
  
  // Menu specific state
  const [menuLabel, setMenuLabel] = useState('');
  const [menuUrl, setMenuUrl] = useState('');
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

  // Ads specific state
  const [topAdInput, setTopAdInput] = useState('');
  const [bottomAdInput, setBottomAdInput] = useState('');
  const [headScriptInput, setHeadScriptInput] = useState('');
  const [bodyScriptInput, setBodyScriptInput] = useState('');

  // Screenshot Local State
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');

  // IGDB State
  const [showIgdbModal, setShowIgdbModal] = useState(false);
  const [igdbQuery, setIgdbQuery] = useState('');
  const [igdbResults, setIgdbResults] = useState<any[]>([]);
  const [isIgdbLoading, setIsIgdbLoading] = useState(false);

  // Internet Archive State
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveQuery, setArchiveQuery] = useState('');
  const [searchGlobal, setSearchGlobal] = useState(false); // NEW STATE
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [archiveFiles, setArchiveFiles] = useState<ArchiveFile[]>([]);
  const [selectedArchiveItem, setSelectedArchiveItem] = useState<ArchiveItem | null>(null);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  // UPDATED RULES TO ALLOW PUBLIC VOTING/DOWNLOADS/COMMENTS
  const rulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      // 1. Lectura pública
      allow read: if true;
      
      // 2. Creación/Borrado solo Admin
      allow create, delete: if request.auth != null;
      
      // 3. Actualización pública (CRÍTICO para Comentarios/Votos/Descargas)
      // Permite que usuarios sin login incrementen contadores.
      allow update: if true;

      // 4. Subcolección Comentarios
      match /comments/{commentId} {
        allow read, create: if true;
        allow update, delete: if request.auth != null;
      }
    }
  }
}`;

  // Handle auto-edit from URL params
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && games.length > 0) {
        const gameToEdit = games.find(g => g.id === editId);
        if (gameToEdit) {
            handleEdit(gameToEdit);
        }
    }
  }, [searchParams, games]);

  // Initialize Ads inputs
  useEffect(() => {
      if (view === 'categories') {
          if (managerTab === 'ads') {
            setTopAdInput(adsConfig.topAdCode || '');
            setBottomAdInput(adsConfig.bottomAdCode || '');
            setHeadScriptInput(adsConfig.globalHeadScript || '');
            setBodyScriptInput(adsConfig.globalBodyScript || '');
          }
      }
  }, [view, managerTab, adsConfig]);

  // --- Handlers ---

  const handleCopyRules = () => {
    navigator.clipboard.writeText(rulesSnippet);
    setCopiedRules(true);
    toast.success('Reglas copiadas al portapapeles');
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const handleCreateNew = () => {
      setFormData(INITIAL_FORM_STATE);
      setIsEditing(false);
      setActiveTab('basic');
      setView('editor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (game: Game) => {
    setFormData({ 
        ...game, 
        screenshots: game.screenshots || [],
        platform: game.platform || [],
        genre: game.genre || []
    });
    setIsEditing(true);
    setActiveTab('basic');
    setView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManageCategories = () => {
      setView('categories');
      setManagerTab('platforms');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = async () => {
      if (view === 'editor') {
          const confirmed = await dialog.confirm('¿Salir sin guardar?', 'Los cambios no guardados se perderán permanentemente.');
          if (confirmed) {
            setView('list');
            setFormData(INITIAL_FORM_STATE);
            setSearchParams({}); 
          }
      } else if (view === 'categories') {
        setView('list');
      }
  };

  const forceBackToList = () => {
      setView('list');
      setFormData(INITIAL_FORM_STATE);
      setSearchParams({});
  }

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm('¿Eliminar videojuego?', 'Esta acción no se puede deshacer.');
    if (confirmed) {
      await deleteGame(id);
      toast.success('Juego eliminado correctamente');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ 
        ...prev, 
        title,
        slug: prev.slug ? prev.slug : slugify(title)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => {
        const currentTags = prev.genre;
        if (currentTags.includes(tag)) {
            return { ...prev, genre: currentTags.filter(t => t !== tag) };
        } else {
            return { ...prev, genre: [...currentTags, tag] };
        }
    });
  };

  const togglePlatform = (platform: string) => {
    setFormData(prev => {
        const currentPlatforms = prev.platform;
        if (currentPlatforms.includes(platform)) {
            return { ...prev, platform: currentPlatforms.filter(p => p !== platform) };
        } else {
            return { ...prev, platform: [...currentPlatforms, platform] };
        }
    });
  };

  const handleAddScreenshot = () => {
      if (newScreenshotUrl.trim()) {
          setFormData(prev => ({
              ...prev,
              screenshots: [...prev.screenshots, newScreenshotUrl.trim()]
          }));
          setNewScreenshotUrl('');
          toast.success('Captura añadida');
      }
  };

  const handleRemoveScreenshot = (indexToRemove: number) => {
      setFormData(prev => ({
          ...prev,
          screenshots: prev.screenshots.filter((_, index) => index !== indexToRemove)
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) { 
        toast.warning('El título es obligatorio'); 
        return; 
    }

    setIsSubmitting(true);
    try {
        const finalSlug = slugify(formData.slug || formData.title);
        
        // Sanitize data (prevent undefined values which Firestore hates)
        const gameToSave: Game = {
            ...formData,
            slug: finalSlug,
            voteCount: formData.voteCount || 0,
            screenshots: formData.screenshots || [],
            genre: formData.genre || [],
            platform: formData.platform || [],
        };

        if (isEditing) {
            await updateGame(gameToSave);
            toast.success('Juego actualizado correctamente');
        } else {
            const newId = Date.now().toString();
            await addGame({ ...gameToSave, id: newId });
            toast.success('Nuevo juego publicado');
        }
        
        forceBackToList();
    } catch (error: any) {
        console.error("Error saving game:", error);
        
        const errString = error.toString().toLowerCase();
        
        // Comprehensive check for permission errors
        if (error.code === 'permission-denied' || errString.includes('permission') || errString.includes('insufficient')) {
            setShowRulesModal(true);
        } else {
            const errorMessage = error.message || 'Ocurrió un error desconocido.';
            toast.error(`Error al publicar: ${errorMessage}`);
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGenerateSitemap = () => {
    // Generate clean URLs (without /#/)
    const baseUrl = window.location.origin; 
    const date = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${date}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    // ... rest of sitemap logic
    games.forEach(game => {
        const gameUrl = `${baseUrl}/game/${game.slug}`;
        xml += '  <url>\n';
        xml += `    <loc>${gameUrl}</loc>\n`;
        xml += `    <lastmod>${date}</lastmod>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sitemap.xml generado y descargado');
  };

  // --- IGDB handlers ---
  const handleOpenIgdbModal = () => {
      setIgdbQuery(formData.title || '');
      setIgdbResults([]);
      setShowIgdbModal(true);
  };

  const handleSearchIgdb = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!igdbQuery.trim()) return;
      setIsIgdbLoading(true);
      try {
          const results = await searchIGDBGames(igdbQuery);
          setIgdbResults(results);
          if (results.length === 0) toast.info('No se encontraron resultados en IGDB');
      } catch (error) {
          toast.error('Error buscando en IGDB. Revisa la consola.');
          console.error(error);
      } finally {
          setIsIgdbLoading(false);
      }
  };

  const handleSelectIgdbGame = async (gameId: number) => {
      setIsIgdbLoading(true);
      try {
          const details = await getIGDBGameDetails(gameId);
          if (details.platform) details.platform.forEach(p => addPlatform(p));
          if (details.genre) details.genre.forEach(t => addTag(t));

          setFormData(prev => ({
              ...prev,
              ...details,
              id: prev.id,
              slug: details.title ? slugify(details.title) : prev.slug,
          }));
          setShowIgdbModal(false);
          setActiveTab('media'); 
          toast.success('Datos importados de IGDB');
      } catch (error) {
          toast.error('Error obteniendo detalles del juego.');
      } finally {
          setIsIgdbLoading(false);
      }
  };

  // --- Internet Archive Handlers ---
  const handleOpenArchiveModal = () => {
      // Use title for initial search, but allow user to change it
      setArchiveQuery(formData.title || '');
      setArchiveItems([]);
      setArchiveFiles([]);
      setSelectedArchiveItem(null);
      setSearchGlobal(false); // Reset global search toggle
      setShowArchiveModal(true);
  };

  const handleSearchArchive = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!archiveQuery.trim()) return;
      setIsArchiveLoading(true);
      setArchiveItems([]);
      setSelectedArchiveItem(null);
      try {
          // Pass the global search flag
          const items = await searchArchiveItems(archiveQuery, trustedCollections, searchGlobal);
          setArchiveItems(items);
          if (items.length === 0) {
              if (trustedCollections.length > 0 && !searchGlobal) {
                  toast.info('No hay resultados en tus repositorios. Prueba activando la búsqueda global.');
              } else {
                  toast.info('No se encontraron items en Internet Archive.');
              }
          }
      } catch (error) {
          toast.error('Error buscando en Internet Archive');
      } finally {
          setIsArchiveLoading(false);
      }
  };

  const handleSelectArchiveItem = async (item: ArchiveItem) => {
      setIsArchiveLoading(true);
      setSelectedArchiveItem(item);
      try {
          const files = await getArchiveFiles(item.identifier);
          setArchiveFiles(files);
          if (files.length === 0) toast.warning('Este item no contiene archivos compatibles (ISO/ROM/ZIP).');
      } catch (error) {
          toast.error('Error cargando lista de archivos');
          setSelectedArchiveItem(null);
      } finally {
          setIsArchiveLoading(false);
      }
  };

  const handleSelectArchiveFile = (file: ArchiveFile) => {
      if (!selectedArchiveItem) return;
      const directLink = generateDirectLink(selectedArchiveItem.identifier, file.name);
      
      setFormData(prev => ({
          ...prev,
          downloadUrl: directLink,
          // Try to guess size if available
          downloadSize: file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : prev.downloadSize
      }));

      setShowArchiveModal(false);
      toast.success('Enlace directo generado correctamente');
  };

  const handleAddItem = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (managerTab === 'menu') {
          if (menuLabel.trim() && menuUrl.trim()) {
              if (editingMenuId) {
                  updateMenuLink({ id: editingMenuId, label: menuLabel.trim(), url: menuUrl.trim() });
                  setEditingMenuId(null);
                  toast.success('Enlace de menú actualizado');
              } else {
                  addMenuLink({ id: Date.now().toString(), label: menuLabel.trim(), url: menuUrl.trim() });
                  toast.success('Enlace añadido al menú');
              }
              setMenuLabel('');
              setMenuUrl('');
          }
          return;
      }
      
      if (managerTab === 'ads') {
          updateAdsConfig({ topAdCode: topAdInput, bottomAdCode: bottomAdInput, globalHeadScript: headScriptInput, globalBodyScript: bodyScriptInput });
          toast.success('Configuración de publicidad guardada');
          return;
      }

      if (newItemName.trim()) {
          if (managerTab === 'repos') {
              // Extraer ID y añadir a Trusted Collections
              addTrustedCollection(newItemName);
              toast.success(`Repositorio añadido`);
          }
          else if (managerTab === 'platforms') {
              addPlatform(newItemName);
              toast.success(`Plataforma "${newItemName}" añadida`);
          }
          else {
              addTag(newItemName);
              toast.success(`Etiqueta "${newItemName}" añadida`);
          }
          setNewItemName('');
      }
  };

  const handleEditMenuLink = (link: MenuLink) => {
      setMenuLabel(link.label);
      setMenuUrl(link.url);
      setEditingMenuId(link.id);
  };
  const handleDeleteMenuLink = async (id: string) => {
      const confirmed = await dialog.confirm('¿Borrar enlace?', 'Esta acción eliminará el enlace del menú.');
      if (confirmed) {
          deleteMenuLink(id);
          if (editingMenuId === id) {
             setMenuLabel(''); setMenuUrl(''); setEditingMenuId(null);
          }
          toast.success('Enlace eliminado');
      }
  }
  const handleQuickFill = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (!value) return;
      setMenuLabel(value);
      setMenuUrl(`/?search=${encodeURIComponent(value)}`);
      e.target.value = "";
  };
  const handleDeleteItem = async (item: string) => {
      const confirmed = await dialog.confirm(`¿Borrar "${item}"?`, 'Esto lo eliminará de la lista.');
      if (confirmed) {
          if (managerTab === 'platforms') deletePlatform(item);
          else if (managerTab === 'repos') deleteTrustedCollection(item);
          else deleteTag(item);
          toast.info('Elemento eliminado');
      }
  }

  const insertMarkdown = (prefix: string, suffix: string = '') => {
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const text = formData.fullDescription;
      const newText = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end);
      setFormData(prev => ({ ...prev, fullDescription: newText }));
  };

  const handleInsertYoutube = async () => {
      const url = await dialog.prompt('Insertar YouTube', 'Introduce la URL del video de YouTube:', 'https://www.youtube.com/watch?v=...');
      
      if (!url) return;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
          const videoId = match[2];
          const embedCode = `\n<div class="aspect-video w-full my-6 overflow-hidden rounded-lg shadow-md"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allowfullscreen></iframe></div>\n`;
          insertMarkdown(embedCode);
          toast.success('Video de YouTube insertado');
      } else {
          toast.error('URL de YouTube inválida');
      }
  };

  const filteredGames = games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- RENDER ---
  if (view === 'categories') {
    // ... Categories View (Simplified for brevity, logic remains same)
    let listItems: string[] = [];
    if (managerTab === 'platforms') listItems = platforms;
    if (managerTab === 'tags') listItems = tags;
    if (managerTab === 'repos') listItems = trustedCollections;

    return (
        <div className="min-h-screen pb-12 bg-gray-100 dark:bg-[#333] transition-colors duration-300 w-full">
            <div className="bg-white dark:bg-[#222] border-b border-gray-200 dark:border-[#444] sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={handleBackToList} className="flex items-center gap-2 text-zinc-500 hover:text-orange-500"><ArrowLeft size={20} /><span>Volver</span></button>
                    <span className="font-bold text-lg text-zinc-800 dark:text-white">Gestor de Contenido</span>
                    <div className="w-10"></div>
                </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-[#222] rounded shadow-lg p-6 border border-gray-200 dark:border-[#444]">
                    <div className="flex gap-4 border-b border-gray-200 dark:border-[#444] mb-6 overflow-x-auto">
                        <button onClick={() => setManagerTab('platforms')} className={`pb-2 px-1 font-bold ${managerTab === 'platforms' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-zinc-500'}`}>Categorías</button>
                        <button onClick={() => setManagerTab('tags')} className={`pb-2 px-1 font-bold ${managerTab === 'tags' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-zinc-500'}`}>Etiquetas</button>
                        <button onClick={() => setManagerTab('menu')} className={`pb-2 px-1 font-bold ${managerTab === 'menu' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-zinc-500'}`}>Menú</button>
                        <button onClick={() => setManagerTab('repos')} className={`pb-2 px-1 font-bold ${managerTab === 'repos' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-zinc-500'}`}>Repositorios</button>
                        <button onClick={() => setManagerTab('ads')} className={`pb-2 px-1 font-bold ${managerTab === 'ads' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-zinc-500'}`}>Publicidad</button>
                    </div>

                    {managerTab === 'ads' ? (
                        <div className="animate-fadeIn">
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 rounded mb-6 text-sm text-zinc-600 dark:text-zinc-300">
                                <strong>Nota:</strong> Utiliza estos campos para Google Adsense o Analytics. No utilices scripts de terceros no verificados.
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-orange-600 dark:text-orange-400">Scripts Globales</h4>
                                    <div><label className="block text-sm font-bold mb-2 dark:text-zinc-300">Scripts (Head)</label><textarea value={headScriptInput} onChange={(e) => setHeadScriptInput(e.target.value)} className="w-full h-32 bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded text-xs dark:text-white" placeholder="<!-- Códigos para <head> -->" /></div>
                                    <div><label className="block text-sm font-bold mb-2 dark:text-zinc-300">Scripts (Body)</label><textarea value={bodyScriptInput} onChange={(e) => setBodyScriptInput(e.target.value)} className="w-full h-32 bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded text-xs dark:text-white" placeholder="<!-- Códigos para fin de <body> -->" /></div>
                                </div>
                                <div className="space-y-4">
                                     <h4 className="font-bold text-orange-600 dark:text-orange-400">Bloques de Anuncios</h4>
                                    <div><label className="block text-sm font-bold mb-2 dark:text-zinc-300">Bloque Superior</label><textarea value={topAdInput} onChange={(e) => setTopAdInput(e.target.value)} className="w-full h-32 bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded text-xs dark:text-white" placeholder="<!-- Bloque 728x90 o Responsivo -->" /></div>
                                    <div><label className="block text-sm font-bold mb-2 dark:text-zinc-300">Bloque Inferior</label><textarea value={bottomAdInput} onChange={(e) => setBottomAdInput(e.target.value)} className="w-full h-32 bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded text-xs dark:text-white" placeholder="<!-- Bloque 300x250 o Responsivo -->" /></div>
                                </div>
                            </div>
                            <button onClick={handleAddItem} className="mt-8 bg-orange-600 text-white px-8 py-3 rounded font-bold shadow-lg flex items-center gap-2 ml-auto"><Save size={18} /> Guardar Configuración</button>
                        </div>
                    ) : managerTab === 'menu' ? (
                        <>
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-[#333]">
                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Relleno rápido:</label>
                                <select onChange={handleQuickFill} className="w-full bg-white dark:bg-[#1a1a1a] border dark:border-[#333] px-3 py-2 rounded text-sm dark:text-white outline-none">
                                    <option value="" disabled>Seleccionar...</option>
                                    <optgroup label="Plataformas">{platforms.map(p => <option key={p} value={p}>{p}</option>)}</optgroup>
                                    <optgroup label="Etiquetas">{tags.map(t => <option key={t} value={t}>{t}</option>)}</optgroup>
                                </select>
                            </div>
                            <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-4 mb-8">
                                <input type="text" value={menuLabel} onChange={(e) => setMenuLabel(e.target.value)} placeholder="Nombre" className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] px-4 py-2 rounded dark:text-white" />
                                <input type="text" value={menuUrl} onChange={(e) => setMenuUrl(e.target.value)} placeholder="URL" className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] px-4 py-2 rounded dark:text-white" />
                                <button type="submit" disabled={!menuLabel.trim() || !menuUrl.trim()} className={`text-white px-6 py-2 rounded font-bold flex items-center gap-2 ${editingMenuId ? 'bg-blue-600' : 'bg-orange-600'}`}>{editingMenuId ? <Save size={18} /> : <Plus size={18} />} {editingMenuId ? 'Actualizar' : 'Añadir'}</button>
                            </form>
                            <div className="space-y-2">
                                {menuLinks.map(link => (
                                    <div key={link.id} className="flex items-center justify-between p-3 border rounded bg-gray-100 dark:bg-[#1a1a1a] dark:border-[#333]">
                                        <div className="flex flex-col"><span className="font-bold dark:text-white">{link.label}</span><span className="text-xs text-zinc-500 truncate">{link.url}</span></div>
                                        <div className="flex gap-1"><button onClick={() => handleEditMenuLink(link)} className="p-2 text-zinc-400 hover:text-blue-500"><Edit2 size={18} /></button><button onClick={() => handleDeleteMenuLink(link.id)} className="p-2 text-zinc-400 hover:text-red-500"><Trash2 size={18} /></button></div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                           {/* Pestaña Genérica (Tags, Platforms, Repos) */}
                            {managerTab === 'repos' && (
                                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded text-sm text-orange-800 dark:text-orange-200">
                                    <h5 className="font-bold flex items-center gap-2 mb-1"><Archive size={16}/> Repositorios de Confianza</h5>
                                    <p className="opacity-90">
                                        Añade URLs de colecciones de Internet Archive (ej: <code>archive.org/details/Redump-Sony-PlayStation-2-USA</code>). 
                                        Cuando busques juegos, el sistema priorizará estos repositorios para dar resultados más precisos.
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-4 mb-8">
                                <input 
                                    type="text" 
                                    value={newItemName} 
                                    onChange={(e) => setNewItemName(e.target.value)} 
                                    placeholder={managerTab === 'platforms' ? "Ej: PSP..." : managerTab === 'repos' ? "URL de Internet Archive..." : "Ej: Acción..."} 
                                    className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] px-4 py-2 rounded dark:text-white" 
                                />
                                <button type="submit" disabled={!newItemName.trim()} className="bg-orange-600 text-white px-6 py-2 rounded font-bold flex items-center gap-2"><Plus size={18} /> Agregar</button>
                            </form>
                            <div className="flex flex-wrap gap-3">
                                {listItems.length > 0 ? listItems.map(item => (
                                    <div key={item} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] border dark:border-[#333] rounded dark:text-zinc-200">
                                        <span className={managerTab === 'repos' ? 'font-mono text-xs' : ''}>{item}</span>
                                        <button onClick={() => handleDeleteItem(item)} className="text-zinc-400 hover:text-red-500"><X size={14} /></button>
                                    </div>
                                )) : (
                                    <div className="text-zinc-400 italic text-sm">No hay elementos configurados.</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
  }

  // --- RENDER EDITOR ---
  if (view === 'editor') {
      return (
        <div className="min-h-screen pb-12 bg-gray-100 dark:bg-[#333] transition-colors duration-300 w-full overflow-x-hidden relative">
            
            {/* --- INTERNET ARCHIVE MODAL --- */}
            {showArchiveModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-[#222] w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-[#444] flex items-center justify-between bg-zinc-100 dark:bg-[#1f1f1f]">
                            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                <Library className="text-orange-600" size={22} /> 
                                {selectedArchiveItem ? 'Selecciona el Archivo' : 'Buscar en Internet Archive'}
                            </h3>
                            <button onClick={() => setShowArchiveModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-full transition-colors">
                                <X size={20} className="text-zinc-500" />
                            </button>
                        </div>

                        {/* Search Bar (Only visible if not selecting a file) */}
                        {!selectedArchiveItem && (
                            <div className="p-4 bg-white dark:bg-[#222] border-b border-gray-200 dark:border-[#444] space-y-4">
                                <form onSubmit={handleSearchArchive} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={archiveQuery} 
                                        onChange={(e) => setArchiveQuery(e.target.value)} 
                                        placeholder={trustedCollections.length > 0 ? "Buscando en tus repositorios..." : "Nombre del juego o colección..."} 
                                        className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#444] px-4 py-2 rounded dark:text-white focus:outline-none focus:border-orange-500" 
                                        autoFocus 
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isArchiveLoading} 
                                        className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2 transition-colors"
                                    >
                                        {isArchiveLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} 
                                        Buscar
                                    </button>
                                </form>
                                
                                <div className="flex items-center justify-between">
                                    {trustedCollections.length > 0 && !searchGlobal ? (
                                        <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 font-medium">
                                            <Archive size={12} /> Búsqueda restringida a {trustedCollections.length} repositorios.
                                        </div>
                                    ) : (
                                        <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                                            <Globe2 size={12} /> Búsqueda Global activada.
                                        </div>
                                    )}

                                    {/* GLOBAL SEARCH TOGGLE */}
                                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={searchGlobal} 
                                            onChange={(e) => setSearchGlobal(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        Buscar en todo Internet Archive
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Back button within modal */}
                        {selectedArchiveItem && (
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-900/20">
                                <button 
                                    onClick={() => { setSelectedArchiveItem(null); setArchiveFiles([]); }}
                                    className="flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-400 px-2 py-1 hover:underline"
                                >
                                    <ArrowLeft size={16} /> Volver a resultados
                                </button>
                            </div>
                        )}

                        {/* Results List */}
                        <div className="flex-1 overflow-y-auto p-0 bg-gray-50 dark:bg-[#1a1a1a]">
                            {isArchiveLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <span>Consultando la biblioteca infinita...</span>
                                </div>
                            ) : selectedArchiveItem ? (
                                // FILE LIST VIEW
                                <div className="divide-y divide-gray-200 dark:divide-[#333]">
                                    {archiveFiles.length > 0 ? (
                                        archiveFiles.map((file, idx) => (
                                            <button 
                                                key={idx} 
                                                onClick={() => handleSelectArchiveFile(file)}
                                                className="w-full text-left p-3 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-3 group"
                                            >
                                                <div className="bg-white dark:bg-[#222] p-2 rounded border dark:border-[#444] text-xs font-mono font-bold text-zinc-500 group-hover:text-orange-600">
                                                    {file.name.split('.').pop()?.toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-zinc-800 dark:text-zinc-200 truncate group-hover:text-orange-700 dark:group-hover:text-orange-400">
                                                        {file.name}
                                                    </div>
                                                    {file.size && <div className="text-xs text-zinc-400">{(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB</div>}
                                                </div>
                                                <Download size={18} className="text-zinc-300 group-hover:text-orange-500" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-zinc-500">No se encontraron archivos de juego en este item.</div>
                                    )}
                                </div>
                            ) : (
                                // ITEM LIST VIEW
                                <div className="divide-y divide-gray-200 dark:divide-[#333]">
                                    {archiveItems.length > 0 ? (
                                        archiveItems.map((item) => (
                                            <button 
                                                key={item.identifier} 
                                                onClick={() => handleSelectArchiveItem(item)} 
                                                className="w-full text-left p-4 hover:bg-white dark:hover:bg-[#222] transition-colors group"
                                            >
                                                <div className="font-bold text-zinc-800 dark:text-white text-base group-hover:text-orange-600 mb-1">
                                                    {item.title}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                    <span className="font-mono bg-gray-200 dark:bg-[#333] px-1.5 py-0.5 rounded">{item.identifier}</span>
                                                    {item.downloads && <span>Downloads: {item.downloads.toLocaleString()}</span>}
                                                    {item.collection && <span className="truncate max-w-[200px] opacity-75">Col: {item.collection[0]}</span>}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-zinc-500">
                                            {archiveQuery ? 'No se encontraron resultados.' : 'Busca un juego o colección para empezar.'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ... IGDB Modal and Header ... */}
            {showIgdbModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-[#222] w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-[#444] flex items-center justify-between">
                            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Search className="text-purple-600" size={20} /> Importar desde IGDB</h3>
                            <button onClick={() => setShowIgdbModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#333] rounded-full"><X size={20} className="text-zinc-500" /></button>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#444]">
                            <form onSubmit={handleSearchIgdb} className="flex gap-2">
                                <input type="text" value={igdbQuery} onChange={(e) => setIgdbQuery(e.target.value)} placeholder="Buscar juego..." className="flex-1 bg-white dark:bg-[#222] border dark:border-[#444] px-4 py-2 rounded dark:text-white" autoFocus />
                                <button type="submit" disabled={isIgdbLoading} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2">{isIgdbLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Buscar</button>
                            </form>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {igdbResults.map((result) => (
                                <button key={result.id} onClick={() => handleSelectIgdbGame(result.id)} className="w-full flex items-center gap-4 p-3 bg-white dark:bg-[#1f1f1f] border dark:border-[#333] hover:border-purple-500 rounded text-left group">
                                    <div className="w-12 h-16 bg-gray-200 dark:bg-[#333] shrink-0">{result.cover && <img src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${result.cover.image_id}.jpg`} className="w-full h-full object-cover" />}</div>
                                    <div className="flex-1"><div className="font-bold dark:text-white group-hover:text-purple-500">{result.name}</div><div className="text-xs text-zinc-500">{result.first_release_date ? new Date(result.first_release_date * 1000).getFullYear() : 'N/A'}</div></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="bg-white dark:bg-[#222] border-b border-gray-200 dark:border-[#444] sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={handleBackToList} className="flex items-center gap-2 text-zinc-500 hover:text-orange-500 font-medium"><ArrowLeft size={20} /><span className="hidden sm:inline">Volver</span></button>
                    <span className="font-bold text-lg dark:text-white truncate">{isEditing ? `Editando: ${formData.title}` : 'Nueva Publicación'}</span>
                    <div className="w-10 sm:w-20"></div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-[#222] rounded shadow-lg border dark:border-[#444] overflow-hidden animate-fadeIn">
                    <div className="flex border-b dark:border-[#444] bg-gray-50 dark:bg-[#1a1a1a] overflow-x-auto">
                        <button type="button" onClick={() => setActiveTab('basic')} className={`flex-1 min-w-[120px] py-4 font-bold uppercase ${activeTab === 'basic' ? 'bg-white dark:bg-[#222] text-orange-600 border-t-2 border-orange-500' : 'text-zinc-500'}`}><Layout size={16} className="inline mr-2"/> Básicos</button>
                        <button type="button" onClick={() => setActiveTab('media')} className={`flex-1 min-w-[120px] py-4 font-bold uppercase ${activeTab === 'media' ? 'bg-white dark:bg-[#222] text-orange-600 border-t-2 border-orange-500' : 'text-zinc-500'}`}><FileText size={16} className="inline mr-2"/> Contenido</button>
                        <button type="button" onClick={() => setActiveTab('tech')} className={`flex-1 min-w-[120px] py-4 font-bold uppercase ${activeTab === 'tech' ? 'bg-white dark:bg-[#222] text-orange-600 border-t-2 border-orange-500' : 'text-zinc-500'}`}><Cpu size={16} className="inline mr-2"/> Técnica</button>
                    </div>

                    <div className="p-4 sm:p-8">
                        {activeTab === 'basic' && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <div className="flex justify-between items-end mb-2"><label className="text-xs uppercase font-bold text-zinc-500">Título</label><button type="button" onClick={handleOpenIgdbModal} className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-bold flex items-center gap-1"><Search size={12}/> Importar IGDB</button></div>
                                    <input type="text" name="title" value={formData.title} onChange={handleTitleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-4 rounded text-lg font-medium dark:text-white" />
                                </div>
                                <div><label className="text-xs uppercase font-bold text-zinc-500">Slug</label><input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white" /></div>
                                <div className="md:col-span-2 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded border dark:border-[#333]">
                                    <label className="text-xs uppercase font-bold text-zinc-500 mb-3 block">Plataforma</label>
                                    <div className="flex flex-wrap gap-2">{platforms.map(plat => <button key={plat} type="button" onClick={() => togglePlatform(plat)} className={`px-3 py-1.5 rounded text-sm border ${formData.platform.includes(plat) ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#222] dark:text-zinc-300'}`}>{plat}</button>)}</div>
                                </div>
                                <div className="md:col-span-2 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded border dark:border-[#333]">
                                    <label className="text-xs uppercase font-bold text-zinc-500 mb-3 block">Etiquetas</label>
                                    <div className="flex flex-wrap gap-2">{tags.map(tag => <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded text-sm border ${formData.genre.includes(tag) ? 'bg-orange-500 text-white' : 'bg-white dark:bg-[#222] dark:text-zinc-300'}`}>{tag}</button>)}</div>
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-zinc-500">Tipo</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white"><option value="ISO">ISO</option><option value="ROM">ROM</option></select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-zinc-500">Región</label>
                                    <select name="region" value={formData.region} onChange={handleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white"><option value="US">USA</option><option value="EU">EU</option><option value="JP">Japón</option><option value="PT">Brasil</option></select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-zinc-500">Idioma</label>
                                    <select name="language" value={formData.language} onChange={handleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white"><option value="English">Inglés</option><option value="Spanish">Español</option><option value="Japanese">Japonés</option><option value="Multi-Language">Multi</option></select>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'media' && (
                            <div className="space-y-8">
                                <div>
                                    <label className="text-xs uppercase font-bold text-zinc-500">Portada URL</label>
                                    <div className="flex gap-4"><input type="text" name="coverImage" value={formData.coverImage} onChange={handleChange} className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white" /><div className="w-24 h-24 bg-gray-200 dark:bg-[#333] rounded overflow-hidden">{formData.coverImage && <img src={formData.coverImage} className="w-full h-full object-cover"/>}</div></div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded border dark:border-[#333]">
                                    <div className="flex gap-2 mb-4"><input type="text" value={newScreenshotUrl} onChange={(e) => setNewScreenshotUrl(e.target.value)} placeholder="URL Captura..." className="flex-1 p-2 rounded dark:bg-[#222] border dark:border-[#444] dark:text-white" /><button type="button" onClick={handleAddScreenshot} className="bg-zinc-700 text-white px-4 rounded"><Upload size={16}/></button></div>
                                    <div className="grid grid-cols-4 gap-4">{formData.screenshots.map((url, idx) => (<div key={idx} className="relative group aspect-video rounded overflow-hidden"><img src={url} className="w-full h-full object-cover"/><button type="button" onClick={() => handleRemoveScreenshot(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><Trash2/></button></div>))}</div>
                                </div>
                                <div><label className="text-xs uppercase font-bold text-zinc-500">Descripción Corta</label><input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white" /></div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-zinc-500">Descripción Completa (Markdown)</label>
                                    <div className="border dark:border-[#444] rounded overflow-hidden">
                                        <div className="flex gap-1 bg-gray-100 dark:bg-[#2a2a2a] p-2 border-b dark:border-[#444]"><button type="button" onClick={() => insertMarkdown('**', '**')} className="p-2"><Bold size={16}/></button><button type="button" onClick={() => insertMarkdown('*', '*')} className="p-2"><Italic size={16}/></button><button type="button" onClick={() => insertMarkdown('## ')} className="p-2"><Heading size={16}/></button><button type="button" onClick={handleInsertYoutube} className="p-2 text-red-500"><Youtube size={16}/></button></div>
                                        <textarea ref={textAreaRef} name="fullDescription" value={formData.fullDescription} onChange={handleChange} rows={15} className="w-full bg-gray-50 dark:bg-[#1a1a1a] p-4 dark:text-white font-mono" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tech' && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div><label className="text-xs uppercase font-bold text-zinc-500">Desarrollador</label><input type="text" name="developer" value={formData.developer} onChange={handleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white" /></div>
                                <div><label className="text-xs uppercase font-bold text-zinc-500">Fecha</label><input type="text" name="releaseDate" value={formData.releaseDate} onChange={handleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white" /></div>
                                <div><label className="text-xs uppercase font-bold text-zinc-500">Tamaño</label><input type="text" name="downloadSize" value={formData.downloadSize} onChange={handleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white" /></div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-zinc-500 flex justify-between">
                                        URL Descarga 
                                        <button type="button" onClick={handleOpenArchiveModal} className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-orange-200">
                                            <Library size={10} /> Buscar en IA
                                        </button>
                                    </label>
                                    <input type="text" name="downloadUrl" value={formData.downloadUrl} onChange={handleChange} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] p-3 rounded dark:text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-[#1f1f1f] border-t dark:border-[#444] flex justify-end gap-4">
                        <button type="button" onClick={handleBackToList} className="px-6 py-2 text-zinc-600 dark:text-zinc-400">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-orange-600 text-white px-8 py-2 rounded font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                            {isEditing ? 'Guardar Cambios' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      );
  }

  // --- RENDER LIST ---
  return (
    <div className="min-h-screen pb-12 bg-gray-100 dark:bg-[#333] transition-colors duration-300 w-full overflow-x-hidden">
        
      {/* --- MODAL DE REGLAS --- */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#222] w-full max-w-lg rounded-lg shadow-2xl overflow-hidden border border-red-500 animate-scaleIn">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-3">
                    <Shield className="text-red-600 dark:text-red-400" size={24} />
                    <h3 className="font-bold text-lg text-red-600 dark:text-red-400">Configuración de Seguridad Requerida</h3>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-zinc-700 dark:text-zinc-300 text-sm">
                        Para habilitar los <strong>comentarios públicos</strong> y los votos, necesitas actualizar las reglas en tu consola de Firebase.
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs italic">
                        Copia y pega este código en: Firestore Database {'>'} Rules
                    </p>
                    
                    <div className="relative group">
                        <pre className="bg-gray-800 text-gray-100 p-4 rounded text-xs font-mono overflow-x-auto border border-gray-700 whitespace-pre-wrap">
                            {rulesSnippet}
                        </pre>
                        <button 
                            onClick={handleCopyRules}
                            className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                            title="Copiar reglas"
                        >
                            {copiedRules ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            onClick={() => setShowRulesModal(false)}
                            className="px-4 py-2 bg-zinc-200 dark:bg-[#333] hover:bg-zinc-300 dark:hover:bg-[#444] rounded text-zinc-800 dark:text-white font-bold transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header and List logic same as before */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-zinc-800 dark:text-white font-pixel mb-2">Admin Dashboard</h1>
                <p className="text-zinc-500 flex items-center gap-2">
                    Hola, {user?.email} 
                    <button onClick={logout} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-red-200 ml-2">
                        <LogOut size={12} /> Salir
                    </button>
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setShowRulesModal(true)} className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded font-bold flex gap-2 items-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"><Shield size={20}/> Ver Reglas</button>
                <button onClick={handleGenerateSitemap} className="bg-zinc-800 text-white px-6 py-3 rounded font-bold flex gap-2 items-center"><Globe size={20}/> Sitemap</button>
                <button onClick={handleManageCategories} className="bg-white dark:bg-[#222] border dark:border-[#444] text-zinc-700 dark:text-white px-6 py-3 rounded font-bold flex gap-2 items-center"><Layers size={20}/> Gestor</button>
                <button onClick={handleCreateNew} className="bg-orange-600 text-white px-6 py-3 rounded shadow-lg font-bold flex gap-2 items-center"><Plus size={20}/> Nuevo</button>
            </div>
        </div>

        <div className="bg-white dark:bg-[#222] p-4 rounded shadow-sm border dark:border-[#444] mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1a1a1a] border dark:border-[#333] pl-10 pr-4 py-2 rounded dark:text-white" /></div>
            <div className="text-sm text-zinc-500">Total: <span className="font-bold dark:text-white">{games.length}</span> juegos</div>
        </div>

        <div className="space-y-3">
            {filteredGames.length === 0 ? <div className="text-center py-12 text-zinc-400">No hay juegos.</div> : filteredGames.map(game => (
                <div key={game.id} className="bg-white dark:bg-[#222] p-4 rounded shadow-sm flex flex-col md:flex-row items-center justify-between border dark:border-[#444] group">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-16 h-16 rounded overflow-hidden shrink-0"><img src={game.coverImage} className="w-full h-full object-cover" /></div>
                        <div><h3 className="font-bold dark:text-white">{game.title}</h3><div className="text-xs text-zinc-500">{game.platform[0]} • {game.language}</div></div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto justify-end mt-4 md:mt-0">
                        <Link to={`/game/${game.slug}`} target="_blank" className="p-2 text-zinc-500 hover:text-green-500"><Eye size={20} /></Link>
                        <button onClick={() => handleEdit(game)} className="p-2 text-zinc-500 hover:text-blue-500"><Edit2 size={20} /></button>
                        <button onClick={() => handleDelete(game.id)} className="p-2 text-zinc-500 hover:text-red-500"><Trash2 size={20} /></button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
