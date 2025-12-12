import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, Loader2 } from 'lucide-react';
import { useGames } from '../context/GameContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Comment } from '../types';
import { useUI } from '../context/UIContext';

interface CommentsProps {
  gameId?: string;
}

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
      return new Date(timestamp).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });
  };

  if (!gameId) return null;

  return (
    <div className="w-full animate-fadeIn mt-8">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-[#444] pb-2">
        <MessageSquare className="text-orange-600 dark:text-orange-400" size={24} />
        <h3 className="text-xl font-bold text-zinc-800 dark:text-white">
            Comentarios <span className="text-sm font-normal text-zinc-500">({comments.length})</span>
        </h3>
      </div>
      
      <div className="grid md:grid-cols-[1fr_300px] gap-8">
          
          {/* List of Comments */}
          <div className="space-y-4 order-2 md:order-1">
             {loading ? (
                 <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-400" /></div>
             ) : comments.length > 0 ? (
                 comments.map((comment) => (
                     <div key={comment.id} className="bg-gray-50 dark:bg-[#1f1f1f] p-4 rounded-lg border border-gray-100 dark:border-[#333] animate-fadeIn">
                         <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                     <User size={16} />
                                 </div>
                                 <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{comment.author}</span>
                             </div>
                             <div className="flex items-center gap-1 text-xs text-zinc-400">
                                 <Clock size={12} />
                                 <span>{formatDate(comment.createdAt)}</span>
                             </div>
                         </div>
                         <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap pl-10">
                             {comment.content}
                         </p>
                     </div>
                 ))
             ) : (
                 <div className="text-center py-8 bg-gray-50 dark:bg-[#1f1f1f] rounded-lg border border-dashed border-gray-200 dark:border-[#333]">
                     <p className="text-zinc-500 text-sm">Sé el primero en comentar.</p>
                 </div>
             )}
          </div>

          {/* Comment Form */}
          <div className="order-1 md:order-2">
             <div className="bg-white dark:bg-[#222] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-[#333] sticky top-20">
                 <h4 className="font-bold text-zinc-800 dark:text-white mb-4 text-sm uppercase">Deja tu opinión</h4>
                 <form onSubmit={handleSubmit} className="space-y-3">
                     <div>
                         <label className="sr-only">Nombre</label>
                         <div className="relative">
                            <User className="absolute left-3 top-2.5 text-zinc-400" size={16} />
                            <input 
                                type="text" 
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Tu Nombre" 
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded text-sm focus:outline-none focus:border-orange-500 dark:text-white transition-colors"
                                required
                            />
                         </div>
                     </div>
                     <div>
                         <label className="sr-only">Comentario</label>
                         <textarea 
                             value={content}
                             onChange={(e) => setContent(e.target.value)}
                             placeholder="Escribe tu comentario aquí..." 
                             className="w-full p-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded text-sm focus:outline-none focus:border-orange-500 dark:text-white transition-colors min-h-[100px] resize-y"
                             required
                         />
                     </div>
                     <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                     >
                         {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                         Publicar
                     </button>
                 </form>
             </div>
          </div>

      </div>
    </div>
  );
};