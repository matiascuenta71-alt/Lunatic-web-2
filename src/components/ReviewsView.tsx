import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Heart,
  Crown,
  Trash2,
  CornerDownRight,
  Send,
  Sparkles,
  MessageCircle,
  TrendingUp,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole, Review } from '../types.js';

interface ReviewsViewProps {
  currentUser: User | null;
  token: string | null;
}

const IMMUTABLE_OWNERS = ['matiascuenta71@gmail.com', 'arturocordo02@gmail.com'];

export default function ReviewsView({ currentUser, token }: ReviewsViewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New review form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Owners replies input map: { reviewId: replyText }
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else {
        setError('Error al cargar las reseñas de la plataforma.');
      }
    } catch (e) {
      console.error(e);
      setError('Error al conectarse con el servidor para cargar las reseñas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentUser) {
      setError('Debes iniciar sesión para publicar una reseña.');
      return;
    }
    if (currentUser.isSuspended) {
      setError('Tu cuenta está suspendida y no puedes enviar comentarios.');
      return;
    }
    if (!comment.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment: comment.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        setComment('');
        setRating(5);
        // Refresh
        fetchReviews();
      } else {
        setError(data.error || 'No se pudo publicar tu reseña.');
      }
    } catch (e) {
      console.error(e);
      setError('Ocurrió un error inesperado al enviar tu reseña.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHeartReview = async (id: string) => {
    if (!token || !currentUser) return;
    try {
      const res = await fetch(`/api/reviews/${id}/heart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(prev =>
          prev.map(r => (r.id === id ? { ...r, hearts: data.hearts } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (reviewId: string) => {
    const text = replyTextMap[reviewId];
    if (!text || !text.trim() || !token) return;

    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: text.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setReplyTextMap(prev => ({ ...prev, [reviewId]: '' }));
        setReplyingToId(null);
        fetchReviews();
      } else {
        alert(data.error || 'Error al enviar respuesta.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!token || !window.confirm('¿Seguro que deseas eliminar esta reseña permanentemente?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isOwnerOrCo = currentUser
    ? currentUser.role === UserRole.Owner ||
      currentUser.role === UserRole.CoOwner ||
      IMMUTABLE_OWNERS.includes(currentUser.email.toLowerCase())
    : false;

  // Statistics calculations
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? Number((reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1))
    : 0;

  const distribution = [0, 0, 0, 0, 0]; // Index 0 is 1 star, etc.
  reviews.forEach(r => {
    const starIdx = Math.floor(r.rating) - 1;
    if (starIdx >= 0 && starIdx < 5) {
      distribution[starIdx]++;
    }
  });

  return (
    <div id="reviews-channel-view" className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Upper stats card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full filter blur-[60px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Rating Display */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0">
            <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full mb-3">
              Calificación General
            </span>
            <div className="text-6xl font-black text-white tracking-tight leading-none flex items-baseline gap-1">
              {averageRating || '0.0'}
              <span className="text-lg font-medium text-slate-500">/5</span>
            </div>
            
            {/* Stars rendering */}
            <div className="flex gap-1.5 mt-3 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${
                    s <= Math.round(averageRating)
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>

            <span className="text-xs text-slate-500 mt-2 font-mono">
              Basado en {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas de usuarios'}
            </span>
          </div>

          {/* Bar Chart distribution */}
          <div className="md:col-span-5 space-y-2">
            <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-bold">Distribución de Votos</span>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars - 1];
              const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-10 text-slate-400 flex items-center justify-end gap-1 font-bold">
                    {stars} <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 inline" />
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-slate-500 text-right font-medium">{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Prompt/Welcome message */}
          <div className="md:col-span-3 text-center md:text-left space-y-2 md:pl-4">
            <h4 className="text-sm font-bold text-slate-200 flex items-center justify-center md:justify-start gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400" /> ¡Queremos saber de ti!
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Califica tu experiencia dentro de la plataforma Lunatic. Tu feedback directo ayuda a nuestros administradores a mejorar.
            </p>
          </div>
        </div>
      </div>

      {/* Review Entry Form */}
      {currentUser ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
            <MessageCircle className="h-4 w-4 text-emerald-400" /> Añadir Reseña de la Plataforma
          </h3>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Stars Selector Row */}
            <div className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
              <span className="text-xs text-slate-400 font-mono font-bold">Tu calificación:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="transition transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= (hoverRating ?? rating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">
                {rating === 5 ? '⭐ Excelente' : rating === 4 ? '👍 Muy Bueno' : rating === 3 ? '👌 Aceptable' : rating === 2 ? '⚠️ Regular' : '👎 Malo'}
              </span>
            </div>

            {/* Comment block */}
            <div className="space-y-1">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu reseña, qué es lo que más te gusta o en qué podemos mejorar..."
                rows={3}
                maxLength={400}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Tu reseña será auditable públicamente.</span>
                <span>{comment.length}/400</span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow shadow-indigo-600/20"
              >
                {submitting ? 'Publicando...' : 'Publicar Reseña'}
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
          Debes iniciar sesión con tu cuenta para dejar una reseña de estrellas y comentario sobre Lunatic.
        </div>
      )}

      {/* Reviews feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-400" /> Reseñas Recientes ({reviews.length})
          </h4>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-850 p-12 text-center rounded-2xl text-slate-500 text-xs">
            Aún no hay reseñas publicadas. ¡Sé el primero en calificar la web!
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const userHasHeart = currentUser ? rev.hearts?.includes(currentUser.id) : false;
              const isCreatorOfReview = currentUser ? rev.userId === currentUser.id : false;

              return (
                <motion.div
                  key={rev.id}
                  layoutId={rev.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-750 p-5 rounded-2xl transition space-y-4"
                >
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(rev.username)}`}
                        alt={rev.username}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-xs">{rev.username}</span>
                          <span className="text-[8px] font-mono font-bold bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-slate-400 uppercase">
                            {rev.userRole}
                          </span>
                        </div>
                        <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                          {new Date(rev.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating & Delete Action */}
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Deletion privilege for creator or staff */}
                      {(isCreatorOfReview || isOwnerOrCo) && (
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Eliminar Reseña"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment text body */}
                  <div className="pl-1 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {rev.comment}
                  </div>

                  {/* Interactive actions row: Love Hearts & Reply buttons */}
                  <div className="flex items-center gap-4 pl-1 border-t border-slate-850 pt-3">
                    {/* Heart toggling with dynamic scale */}
                    <button
                      onClick={() => handleHeartReview(rev.id)}
                      disabled={!currentUser}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition ${
                        userHasHeart
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                          : currentUser
                          ? 'bg-slate-950 text-slate-400 hover:text-red-400 hover:bg-slate-800'
                          : 'bg-slate-950 text-slate-600'
                      }`}
                      title={currentUser ? "Dar un corazón" : "Inicia sesión para dar un corazón"}
                    >
                      <Heart
                        className={`h-4 w-4 transition duration-300 ${
                          userHasHeart ? 'fill-red-500 text-red-500 scale-110' : 'text-current'
                        }`}
                      />
                      <span className="font-mono text-[10px] font-bold">
                        {rev.hearts?.length || 0}
                      </span>
                    </button>

                    {/* Reply launcher for OWNERS / ADMINS */}
                    {isOwnerOrCo && replyingToId !== rev.id && (
                      <button
                        onClick={() => {
                          setReplyingToId(rev.id);
                          setReplyTextMap(prev => ({ ...prev, [rev.id]: '' }));
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition font-semibold"
                      >
                        <CornerDownRight className="h-3.5 w-3.5" /> Responder como Owner
                      </button>
                    )}
                  </div>

                  {/* Threaded OWNER Replies */}
                  {rev.replies && rev.replies.length > 0 && (
                    <div className="pl-4 md:pl-8 space-y-2 border-l border-indigo-500/20 mt-3 pt-2">
                      {rev.replies.map((reply) => (
                        <div key={reply.id} className="bg-indigo-950/20 border border-indigo-950/40 p-3 rounded-xl flex items-start gap-2.5">
                          <Crown className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-amber-400">{reply.authorName}</span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-px bg-amber-400/10 text-amber-400 text-[8px] font-extrabold uppercase rounded border border-amber-400/20">
                                <Crown className="h-2 w-2" /> {reply.authorRole}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline REPLY entry editor */}
                  <AnimatePresence>
                    {replyingToId === rev.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-4 md:pl-8 space-y-2"
                      >
                        <div className="bg-[#121212] border border-indigo-500/20 p-4 rounded-xl space-y-3">
                          <label className="block text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                            Escribiendo respuesta oficial como {currentUser?.username}...
                          </label>
                          <textarea
                            value={replyTextMap[rev.id] || ''}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({
                                ...prev,
                                [rev.id]: e.target.value
                              }))
                            }
                            placeholder="Agradece el feedback o responde la duda..."
                            rows={2}
                            maxLength={350}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setReplyingToId(null)}
                              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-xl text-xs transition"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendReply(rev.id)}
                              disabled={replySubmitting || !(replyTextMap[rev.id] || '').trim()}
                              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs transition font-bold"
                            >
                              {replySubmitting ? 'Enviando...' : 'Enviar Respuesta'}
                              <Send className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
