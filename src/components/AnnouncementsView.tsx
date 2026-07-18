import React, { useState } from 'react';
import { Megaphone, Calendar, User, Trash2, Send, Plus, X, AlertCircle } from 'lucide-react';
import { UserRole } from '../types.js';

interface AnnouncementsViewProps {
  announcements: any[];
  userRole: UserRole;
  token: string;
  onAnnouncementCreated: () => void;
  onAnnouncementDeleted: () => void;
}

export default function AnnouncementsView({
  announcements,
  userRole,
  token,
  onAnnouncementCreated,
  onAnnouncementDeleted
}: AnnouncementsViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = userRole === UserRole.Owner;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo publicar el anuncio.');
      }

      // Reset form
      setTitle('');
      setContent('');
      setImageUrl('');
      setShowCreateForm(false);
      onAnnouncementCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este anuncio?')) return;

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo eliminar el anuncio.');
      }

      onAnnouncementDeleted();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="announcements-view" className="space-y-8 max-w-3xl mx-auto">
      {/* Title Header with publish triggers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-100">Anuncios Oficiales</h2>
            <p className="text-xs text-slate-400">Novedades, comunicados y actualizaciones de la comunidad.</p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-xl text-xs transition"
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreateForm ? 'Cancelar' : 'Publicar Anuncio'}
          </button>
        )}
      </div>

      {/* Owner Publish Form */}
      {showCreateForm && isOwner && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider">Nuevo Anuncio Oficial</h3>
          
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Título del Anuncio</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition"
                placeholder="¡Gran actualización de setups!"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Imagen opcional (URL)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition font-mono"
                placeholder="https://ejemplo.com/banner.jpg"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Contenido</label>
              <textarea
                required
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition resize-none text-sm"
                placeholder="Describe las novedades de forma detallada..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <Send className="h-3.5 w-3.5" />
              {loading ? 'Publicando...' : 'Publicar ahora'}
            </button>
          </div>
        </form>
      )}

      {/* Announcements Feed */}
      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
            <Megaphone className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            No hay anuncios publicados en este momento.
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-750 transition flex flex-col relative group">
              {/* Optional banner image */}
              {ann.imageUrl && (
                <div className="h-56 w-full overflow-hidden bg-slate-950">
                  <img
                    src={ann.imageUrl}
                    alt={ann.title}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-101"
                  />
                </div>
              )}

              {/* Header metadata */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-indigo-400" />
                      Por: <strong className="text-slate-300 font-medium">{ann.authorName}</strong>
                      <span className="bg-red-500/15 text-red-400 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ml-1">Owner</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      {new Date(ann.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Delete button (only for Owner) */}
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition"
                      title="Eliminar Anuncio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-bold text-xl text-slate-100 group-hover:text-indigo-400 transition">{ann.title}</h3>
                  {/* Preserve whitespace and line breaks for content */}
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
