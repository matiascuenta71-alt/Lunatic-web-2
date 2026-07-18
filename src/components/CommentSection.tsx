import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CornerDownRight, Trash2, X, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { type Comment, UserRole } from '../types.js';

interface CommentSectionProps {
  resourceId: string;
  resourceName: string;
  currentUser: any;
  token: string | null;
  onClose: () => void;
}

export default function CommentSection({
  resourceId,
  resourceName,
  currentUser,
  token,
  onClose
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load comments
  const fetchComments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      } else {
        setError(data.error || 'Error al cargar comentarios.');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Error de conexión al cargar comentarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [resourceId]);

  // Handle post comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCommentText.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/resources/${resourceId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newCommentText })
      });
      const data = await res.json();

      if (res.ok) {
        setNewCommentText('');
        setComments(prev => [...prev, data.comment]);
        setSuccess('Comentario publicado.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al publicar el comentario.');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Error de conexión al publicar.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle post reply
  const handlePostReply = async (parentId: string) => {
    const replyText = replyTexts[parentId];
    if (!token || !replyText || !replyText.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/resources/${resourceId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyText, parentId })
      });
      const data = await res.json();

      if (res.ok) {
        setReplyTexts(prev => ({ ...prev, [parentId]: '' }));
        setActiveReplyId(null);
        setComments(prev => [...prev, data.comment]);
        setSuccess('Respuesta publicada.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al publicar la respuesta.');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      setError('Error de conexión al responder.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comentario? Las respuestas asociadas también se borrarán.')) {
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        // Remove comment and any children replies locally
        setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
        setSuccess('Comentario eliminado con éxito.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al eliminar el comentario.');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Error de conexión al eliminar.');
    }
  };

  const isAdmin = currentUser && (currentUser.role === UserRole.Owner || currentUser.role === UserRole.CoOwner);

  // Group comments: find parents and map their children replies
  const parentComments = comments.filter(c => !c.parentId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const getRepliesForParent = (parentId: string) => {
    return comments.filter(c => c.parentId === parentId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} a las ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
      {/* Click outside backdrop close handler */}
      <div className="flex-1" onClick={onClose} />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              <span>Comentarios</span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-[320px]" title={resourceName}>
              {resourceName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="px-6 py-3 bg-red-950/40 border-b border-red-900/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="px-6 py-3 bg-emerald-950/40 border-b border-emerald-900/30 text-emerald-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Comment list container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              <p className="text-[10px] text-slate-500 font-mono">CARGANDO COMENTARIOS...</p>
            </div>
          ) : parentComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="h-12 w-12 rounded-full bg-slate-950 flex items-center justify-center text-slate-600 border border-slate-850">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300 font-semibold">Sin comentarios aún</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Sé el primero en compartir tu opinión o hacer preguntas sobre este recurso.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {parentComments.map(comment => {
                const replies = getRepliesForParent(comment.id);
                const isCommentAuthor = comment.userId === currentUser.id;
                const canDelete = isCommentAuthor || isAdmin;

                return (
                  <div key={comment.id} className="space-y-4 group/item">
                    {/* Parent Comment Card */}
                    <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3 hover:border-slate-800 transition">
                      <div className="flex items-start justify-between gap-2">
                        {/* Author Info */}
                        <div className="flex items-center gap-2.5">
                          <img
                            src={comment.avatarUrl}
                            alt={comment.username}
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-900 object-cover"
                          />
                          <div>
                            <span className="font-semibold text-xs text-slate-200 block">
                              {comment.username}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-950/20 transition opacity-0 group-hover/item:opacity-100"
                            title="Eliminar comentario"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-xs text-slate-300 leading-relaxed pl-1">
                        {comment.content}
                      </p>

                      {/* Footer: Reply trigger */}
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => {
                            setActiveReplyId(activeReplyId === comment.id ? null : comment.id);
                            setReplyTexts(prev => ({ ...prev, [comment.id]: '' }));
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wide cursor-pointer"
                        >
                          {activeReplyId === comment.id ? 'Cancelar' : 'Responder'}
                        </button>
                      </div>
                    </div>

                    {/* Replies mapping */}
                    {replies.length > 0 && (
                      <div className="pl-6 space-y-3 border-l-2 border-slate-850">
                        {replies.map(reply => {
                          const isReplyAuthor = reply.userId === currentUser.id;
                          const canDeleteReply = isReplyAuthor || isAdmin;

                          return (
                            <div key={reply.id} className="flex gap-2 group/reply">
                              <div className="pt-2 text-slate-700">
                                <CornerDownRight className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 bg-slate-950/20 border border-slate-850/80 rounded-xl p-3.5 space-y-2 hover:border-slate-800 transition">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={reply.avatarUrl}
                                      alt={reply.username}
                                      referrerPolicy="no-referrer"
                                      className="h-6 w-6 rounded border border-slate-800 bg-slate-900 object-cover"
                                    />
                                    <div>
                                      <span className="font-semibold text-xs text-slate-200 block">
                                        {reply.username}
                                      </span>
                                      <span className="text-[8px] text-slate-500 font-mono block">
                                        {formatDate(reply.createdAt)}
                                      </span>
                                    </div>
                                  </div>

                                  {canDeleteReply && (
                                    <button
                                      onClick={() => handleDeleteComment(reply.id)}
                                      className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-950/10 transition opacity-0 group-hover/reply:opacity-100"
                                      title="Eliminar respuesta"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reply Input Box */}
                    <AnimatePresence>
                      {activeReplyId === comment.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-6 flex gap-2"
                        >
                          <div className="pt-3 text-slate-700">
                            <CornerDownRight className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 flex gap-2 bg-slate-950 border border-slate-850 rounded-xl p-2 focus-within:border-indigo-600 transition">
                            <input
                              type="text"
                              value={replyTexts[comment.id] || ''}
                              onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                              placeholder={`Responder a ${comment.username}...`}
                              className="flex-1 bg-transparent border-none text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0 px-2 py-1"
                              maxLength={500}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePostReply(comment.id);
                              }}
                            />
                            <button
                              onClick={() => handlePostReply(comment.id)}
                              disabled={submitting || !(replyTexts[comment.id] || '').trim()}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top-Level Comment Input Form */}
        <form onSubmit={handlePostComment} className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <div className="flex gap-2 items-center bg-slate-950 border border-slate-800 focus-within:border-indigo-500 rounded-xl p-2 transition">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-transparent border-none text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0 px-2 py-1.5"
              maxLength={500}
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-xl transition cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-between px-2">
            <span className="text-[9px] text-slate-600">
              Usa un lenguaje respetuoso • Spam protegido
            </span>
            <span className="text-[9px] text-slate-600 font-mono">
              {newCommentText.length}/500
            </span>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
