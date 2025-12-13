import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Send, User, Loader2, Sparkles, ChevronDown, ChevronUp, CornerDownRight, Reply } from 'lucide-react';
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

// Formatear fecha
const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// --- SUB-COMPONENT: Individual Comment Item ---
interface CommentItemProps {
    comment: Comment;
    allComments: Comment[];
    onReply: (parentId: string) => void;
    replyingTo: string | null;
    submitReply: (e: React.FormEvent, parentId: string, author: string, content: string) => Promise<void>;
    submitting: boolean;
    depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
    comment, 
    allComments, 
    onReply, 
    replyingTo, 
    submitReply, 
    submitting,
    depth = 0 
}) => {
    const [replyAuthor, setReplyAuthor] = useState('');
    const [replyContent, setReplyContent] = useState('');

    const avatarColor = stringToColor(comment.author);
    const initial = comment.author.charAt(0).toUpperCase();

    // Find children
    const replies = allComments.filter(c => c.parentId === comment.id).sort((a,b) => a.createdAt - b.createdAt);
    
    // Logic for "Vertical Line" visualization
    // If depth > 0, we don't indent heavily again to avoid "pyramid" effect on mobile
    // We just keep everything in the same "thread" container
    const isRoot = depth === 0;

    return (
        <div className={`relative animate-fadeIn ${!isRoot ? 'mt-4' : 'mb-6'}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <div 
                    className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm z-10
                        ${isRoot ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'}`}
                    style={{ backgroundColor: avatarColor }}
                >
                    {initial}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Bubble */}
                    <div className={`bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl rounded-tl-none border border-gray-100 dark:border-[#333] ${isRoot ? 'p-4' : 'p-3'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold text-zinc-800 dark:text-zinc-200 ${isRoot ? 'text-sm' : 'text-xs'}`}>
                                {comment.author}
                            </span>
                            <span className="text-[10px] uppercase font-medium text-zinc-400 flex items-center gap-1 whitespace-nowrap ml-2">
                                {formatDate(comment.createdAt)}
                            </span>
                        </div>
                        <p className={`text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words ${isRoot ? 'text-sm' : 'text-xs'}`}>
                            {comment.content}
                        </p>
                        
                        {/* Action Bar */}
                        <div className="mt-2 flex items-center gap-4">
                            <button 
                                onClick={() => onReply(comment.id)}
                                className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-orange-600 transition-colors uppercase tracking-wide"
                            >
                                <Reply size={12} /> Responder
                            </button>
                        </div>
                    </div>

                    {/* Reply Form (Inline) */}
                    {replyingTo === comment.id && (
                        <div className="mt-3 ml-2 animate-fadeIn bg-white dark:bg-[#222] p-3 rounded-lg border border-orange-200 dark:border-orange-900/30 shadow-lg">
                            <form onSubmit={(e) => {
                                submitReply(e, comment.id, replyAuthor, replyContent);
                                setReplyContent(''); // Clear after submit
                            }} className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                        <CornerDownRight size={12}/> Respondiendo a {comment.author}
                                    </span>
                                    <button type="button" onClick={() => onReply('')} className="text-zinc-400 hover:text-red-500"><ChevronUp size={14}/></button>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Tu Nombre" 
                                    value={replyAuthor}
                                    onChange={e => setReplyAuthor(e.target.value)}
                                    className="w-full p-2 text-xs border border-gray-200 dark:border-[#444] rounded bg-gray-50 dark:bg-[#111] dark:text-white focus:border-orange-500 outline-none"
                                    required
                                />
                                <textarea 
                                    placeholder="Escribe tu respuesta..." 
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    className="w-full p-2 text-xs border border-gray-200 dark:border-[#444] rounded bg-gray-50 dark:bg-[#111] dark:text-white focus:border-orange-500 outline-none resize-none h-20"
                                    required
                                />
                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-orange-500"
                                    >
                                        {submitting ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>} Enviar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Nested Replies with Vertical Line */}
                    {replies.length > 0 && (
                        <div className="relative mt-2">
                             {/* The Vertical Line */}
                            <div className="absolute left-[-22px] top-0 bottom-4 w-[2px] bg-gray-200 dark:bg-[#333]"></div>
                            
                            {/* Render children recursively but flatter visually */}
                            <div className="ml-0">
                                {replies.map(reply => (
                                    <CommentItem 
                                        key={reply.id} 
                                        comment={reply} 
                                        allComments={allComments}
                                        onReply={onReply}
                                        replyingTo={replyingTo}
                                        submitReply={submitReply}
                                        submitting={submitting}
                                        depth={depth + 1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
export const Comments: React.FC<CommentsProps> = ({ gameId }) => {
  const { addComment } = useGames();
  const { toast } = useUI();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Accordion State
  const [isOpen, setIsOpen] = useState(false);
  
  // Root Form State
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  // Replying State (stores the ID of the comment being replied to)
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

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

  // Filter only root comments for the main list
  const rootComments = useMemo(() => {
      return comments.filter(c => !c.parentId);
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string, customAuthor?: string, customContent?: string) => {
    e.preventDefault();
    if (!gameId) return;
    
    const finalAuthor = customAuthor || author;
    const finalContent = customContent || content;

    if (!finalAuthor.trim() || !finalContent.trim()) {
        toast.warning("Por favor completa todos los campos");
        return;
    }

    setSubmitting(true);
    try {
        await addComment(gameId, finalAuthor.trim(), finalContent.trim(), parentId);
        
        if (!parentId) {
            setContent(''); // Clear root form
        } else {
            setReplyingTo(null); // Close reply form
        }
        
        toast.success(parentId ? "Respuesta publicada" : "Comentario publicado");
    } catch (error) {
        console.error(error);
        toast.error("Error al publicar");
    } finally {
        setSubmitting(false);
    }
  };

  if (!gameId) return null;

  return (
    <div className="w-full animate-fadeIn mt-12 bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-100 dark:border-[#444] overflow-hidden transition-all duration-300">
      {/* Accordion Header / Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors text-left"
      >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-[#333] text-zinc-500'}`}>
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
          
          <div className="text-zinc-400 dark:text-zinc-500">
             {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
      </button>
      
      {/* Accordion Content */}
      {isOpen && (
        <div className="p-6 md:p-8 pt-0 border-t border-gray-100 dark:border-[#444] animate-fadeIn">
          <div className="grid lg:grid-cols-[1fr_350px] gap-10 mt-6">
              
              {/* List of Comments */}
              <div className="space-y-2 order-2 lg:order-1">
                 {loading ? (
                     <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                         <Loader2 className="animate-spin" size={24} />
                         <span className="text-sm">Cargando comentarios...</span>
                     </div>
                 ) : rootComments.length > 0 ? (
                    rootComments.map(comment => (
                        <CommentItem 
                            key={comment.id}
                            comment={comment}
                            allComments={comments}
                            onReply={setReplyingTo}
                            replyingTo={replyingTo}
                            submitReply={(e, pid, auth, cont) => handleSubmit(e, pid, auth, cont)}
                            submitting={submitting}
                        />
                    ))
                 ) : (
                     <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-dashed border-gray-200 dark:border-[#333] text-center">
                         <Sparkles className="text-zinc-300 dark:text-zinc-600 mb-3" size={32} />
                         <p className="text-zinc-600 dark:text-zinc-400 font-medium">Aún no hay comentarios.</p>
                         <p className="text-zinc-400 dark:text-zinc-500 text-sm">Sé el primero en compartir tu experiencia.</p>
                     </div>
                 )}
              </div>

              {/* Root Comment Form */}
              <div className="order-1 lg:order-2">
                 <div className="bg-gray-50 dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-[#333] sticky top-24">
                     <h4 className="font-bold text-zinc-800 dark:text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                        Escribe tu comentario
                     </h4>
                     <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
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
      )}
    </div>
  );
};