import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, Loader2, Sparkles } from 'lucide-react';
import { useGames } from '../context/GameContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Comment } from '../types';
import { useUI } from '../context/UIContext';

interface CommentsProps {
  gameId?: string;
}

// Helper to generate a consistent color from a string (name)
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
};

export const Comments: React.FC<CommentsProps> = ({ gameId }) => {
  const { addComment } = useGames();
  const { toast } = useUI();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  // Fetch comments
  useEffect(() => {
    if (!gameId) return;

    const q = query(
        collection(db, "games", gameId, "comments"), 
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedComments = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        })) as Comment[];
        setComments(fetchedComments);
        setLoading(false);
    }, (error) => {
        console.error("Error loading comments:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId) return;
    if (!author.trim() || !content.trim()) {
        toast.warning("Por favor completa todos los campos");
        return;
    }

    setSubmitting(true);
    try {
        await addComment(gameId, author.trim(), content.trim());
        setContent(''); // Clear content but keep author name for convenience
        toast.success("Comentario publicado");
    } catch (error) {
        console.error(error);
        toast.error("Error al publicar comentario");
    } finally {
        setSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
      // Relative time or formatted date
      const date = new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });
  };

  if (!gameId) return null;

  return (
    <div className="w-full animate-fadeIn mt-12 bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-100 dark:border-[#444] p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-[#444]">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
             <MessageSquare size={24} />
        </div>
        <div>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-white leading-none">
                Comentarios
            </h3>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                {comments.length} opiniones de la comunidad
            </span>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-[1fr_350px] gap-10">
          
          {/* List of Comments */}
          <div className="space-y-6 order-2 lg:order-1">
             {loading ? (
                 <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                     <Loader2 className="animate-spin" size={24} />
                     <span className="text-sm">Cargando comentarios...</span>
                 </div>
             ) : comments.length > 0 ? (
                 comments.map((comment) => {
                     const avatarColor = stringToColor(comment.author);
                     const initial = comment.author.charAt(0).toUpperCase();
                     
                     return (
                        <div key={comment.id} className="group flex gap-4 animate-fadeIn">
                             {/* Avatar */}
                             <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                                style={{ backgroundColor: avatarColor }}
                             >
                                 {initial}
                             </div>
                             
                             <div className="flex-1">
                                 <div className="bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-[#333]">
                                     <div className="flex items-center justify-between mb-2">
                                         <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                                             {comment.author}
                                         </span>
                                         <span className="text-[10px] uppercase font-medium text-zinc-400 flex items-center gap-1">
                                             {formatDate(comment.createdAt)}
                                         </span>
                                     </div>
                                     <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                                         {comment.content}
                                     </p>
                                 </div>
                             </div>
                        </div>
                     );
                 })
             ) : (
                 <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-dashed border-gray-200 dark:border-[#333] text-center">
                     <Sparkles className="text-zinc-300 dark:text-zinc-600 mb-3" size={32} />
                     <p className="text-zinc-600 dark:text-zinc-400 font-medium">Aún no hay comentarios.</p>
                     <p className="text-zinc-400 dark:text-zinc-500 text-sm">Sé el primero en compartir tu experiencia.</p>
                 </div>
             )}
          </div>

          {/* Comment Form */}
          <div className="order-1 lg:order-2">
             <div className="bg-gray-50 dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-[#333] sticky top-24">
                 <h4 className="font-bold text-zinc-800 dark:text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    Escribe tu comentario
                 </h4>
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="space-y-1">
                         <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Nombre / Alias</label>
                         <div className="relative">
                            <User className="absolute left-3 top-3 text-zinc-400" size={16} />
                            <input 
                                type="text" 
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Ej: RetroGamer99" 
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:text-white transition-all shadow-sm"
                                required
                            />
                         </div>
                     </div>
                     <div className="space-y-1">
                         <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Mensaje</label>
                         <textarea 
                             value={content}
                             onChange={(e) => setContent(e.target.value)}
                             placeholder="¿Qué te pareció el juego?" 
                             className="w-full p-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:text-white transition-all min-h-[120px] resize-y shadow-sm"
                             required
                         />
                     </div>
                     <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 shadow-lg shadow-orange-500/20"
                     >
                         {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                         Publicar Comentario
                     </button>
                 </form>
             </div>
          </div>

      </div>
    </div>
  );
};