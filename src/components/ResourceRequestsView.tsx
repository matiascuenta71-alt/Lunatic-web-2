import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, PlusCircle, FileText, ExternalLink, MessageSquare, 
  Calendar, Clock, User, CheckCircle2, AlertCircle, Folder, 
  CornerDownRight, Send, HelpCircle, RefreshCw, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  type ResourceRequest, 
  ResourceCategory, 
  RequestStatus, 
  UserRole,
  ROLE_HIERARCHY
} from '../types.js';

interface ResourceRequestsViewProps {
  currentUser: any;
  token: string | null;
}

export default function ResourceRequestsView({ currentUser, token }: ResourceRequestsViewProps) {
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<ResourceCategory>(ResourceCategory.Plugins);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [referenceLink, setReferenceLink] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Management State (Staff only)
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Deletion state
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);
  const [confirmDeleteRequestId, setConfirmDeleteRequestId] = useState<string | null>(null);

  const userLevel = ROLE_HIERARCHY[currentUser?.role] || 1;
  const isStaff = userLevel >= ROLE_HIERARCHY[UserRole.Recursos];
  const isOwner = currentUser?.role === UserRole.Owner || currentUser?.role === UserRole.CoOwner;

  const handleDeleteRequest = async (requestId: string) => {
    if (!token) return;
    if (confirmDeleteRequestId !== requestId) {
      setConfirmDeleteRequestId(requestId);
      setTimeout(() => setConfirmDeleteRequestId(null), 4000);
      return;
    }

    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(null);
        }
        setSuccess('Solicitud eliminada con éxito.');
        setConfirmDeleteRequestId(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Error al eliminar la solicitud.');
      }
    } catch (err) {
      setError('Error de conexión.');
    }
  };

  const handleDeleteComment = async (requestId: string, commentId: string) => {
    if (!token) return;
    if (confirmDeleteCommentId !== commentId) {
      setConfirmDeleteCommentId(commentId);
      setTimeout(() => setConfirmDeleteCommentId(null), 4000);
      return;
    }

    try {
      const res = await fetch(`/api/requests/${requestId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const updatedComments = (selectedRequest?.internalComments || []).filter(c => c.id !== commentId);
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, internalComments: updatedComments } : r));
        setSelectedRequest(prev => prev ? { ...prev, internalComments: updatedComments } : null);
        setConfirmDeleteCommentId(null);
        setSuccess('Comentario eliminado.');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(data.error || 'Error al eliminar comentario.');
      }
    } catch (err) {
      setError('Error de conexión.');
    }
  };

  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
      } else {
        setError(data.error || 'Error al cargar las solicitudes.');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Error de conexión al cargar solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || submitting) return;

    if (!name.trim() || !category) {
      setError('El nombre y la categoría son campos obligatorios.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          name,
          description,
          referenceLink
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('¡Solicitud creada con éxito!');
        setName('');
        setDescription('');
        setReferenceLink('');
        setShowAddForm(false);
        setRequests(prev => [data.request, ...prev]);
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || 'Error al crear la solicitud.');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Error de conexión al enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: RequestStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: data.request.status, updatedAt: data.request.updatedAt } : r));
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(prev => prev ? { ...prev, status: data.request.status, updatedAt: data.request.updatedAt } : null);
        }
        setSuccess(`Estado actualizado a "${status}" con éxito.`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al actualizar el estado.');
      }
    } catch (err) {
      setError('Error de conexión.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedRequest || !newComment.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      const data = await res.json();
      if (res.ok) {
        const updatedComments = [...(selectedRequest.internalComments || []), data.comment];
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, internalComments: updatedComments, updatedAt: new Date().toISOString() } : r));
        setSelectedRequest(prev => prev ? { ...prev, internalComments: updatedComments, updatedAt: new Date().toISOString() } : null);
        setNewComment('');
      } else {
        setError(data.error || 'Error al agregar comentario.');
      }
    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const getStatusStyle = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.Pendiente:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case RequestStatus.EnRevision:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case RequestStatus.Aprobada:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case RequestStatus.Rechazada:
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case RequestStatus.Completada:
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs hover:underline">Cerrar</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-xs hover:underline">Cerrar</button>
        </div>
      )}

      {/* Main Grid: List of solicitudes & submission */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Requests list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-400" />
                {isStaff ? 'Buzón de Solicitudes de Recursos' : 'Mis Solicitudes de Recursos'}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
                {isStaff ? 'Panel de revisión y gestión para el equipo' : 'Pide plugins, setups o modelos que falten'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchRequests}
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                title="Actualizar"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>

              {!isStaff && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow shadow-indigo-600/10"
                >
                  <PlusCircle className="h-4 w-4" />
                  Nueva Solicitud
                </button>
              )}
            </div>
          </div>

          {/* User Request Form as dropdown modal or embedded if toggled */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl"
              >
                <h4 className="font-display font-bold text-sm text-slate-200">Crear Nueva Solicitud</h4>
                <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1.5">Nombre del Recurso *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. EssentialsX Config, DeluxeMenus setup..."
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1.5">Categoría *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {Object.values(ResourceCategory).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1.5">Descripción o Detalles Adicionales</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Indica de qué trata, versión, o detalles útiles..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1.5">Imagen de referencia o enlace externo (Opcional)</label>
                    <input
                      type="url"
                      value={referenceLink}
                      onChange={(e) => setReferenceLink(e.target.value)}
                      placeholder="https://spigotmc.org/resources/..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 rounded-xl font-medium transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition disabled:opacity-50"
                    >
                      {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List of Requests Cards */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">Cargando solicitudes...</div>
          ) : requests.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-8 text-center text-slate-500 text-xs">
              <ClipboardList className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <span>No tienes solicitudes de recursos registradas.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`bg-slate-900 border rounded-2xl p-5 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    selectedRequest?.id === req.id 
                      ? 'border-indigo-500 shadow shadow-indigo-600/10' 
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Folder className="h-3 w-3" /> {req.category}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-slate-200">{req.name}</h4>
                    {req.description && (
                      <p className="text-slate-400 text-xs line-clamp-1 max-w-lg">{req.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-600" />
                        {req.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      {req.internalComments && req.internalComments.length > 0 && isStaff && (
                        <span className="flex items-center gap-1 text-indigo-400">
                          <MessageSquare className="h-3 w-3" />
                          {req.internalComments.length} {req.internalComments.length === 1 ? 'comentario' : 'comentarios'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / View details shortcut */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    {req.referenceLink && (
                      <a
                        href={req.referenceLink}
                        target="_blank"
                        rel="noreferrer referrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-white rounded-lg transition"
                        title="Enlace de referencia"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <span className="text-[10px] text-indigo-400 font-mono font-semibold uppercase tracking-wide group-hover:translate-x-1 transition-transform">
                      Ver Detalles &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Request Details Inspector & Response Panel */}
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-base text-slate-200 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" /> Detalle de Solicitud
            </h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
              Inspector de estado y comentarios internos
            </p>
          </div>

          {selectedRequest ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-mono">
                      ID: {selectedRequest.id.substring(0, 8)}
                    </span>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(selectedRequest.id);
                        }}
                        className={`p-1 px-2 rounded-lg border transition text-[10px] flex items-center gap-1 font-bold ${
                          confirmDeleteRequestId === selectedRequest.id 
                            ? 'bg-red-600 text-white border-red-500' 
                            : 'bg-red-950/20 text-red-400 border-red-900/30 hover:bg-red-900/20'
                        }`}
                        title="Eliminar Solicitud"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{confirmDeleteRequestId === selectedRequest.id ? '¿Seguro?' : 'Borrar'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="font-display font-extrabold text-base text-slate-200">{selectedRequest.name}</h4>
                
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 text-slate-300 text-xs leading-relaxed space-y-2">
                  <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Descripción del usuario:</span>
                  <p className="italic">{selectedRequest.description || 'Sin descripción adicional.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono p-3 bg-slate-950/40 rounded-xl border border-slate-850/50">
                  <div>
                    <span className="block text-slate-500 uppercase">Solicitante</span>
                    <span className="text-slate-300 truncate block font-semibold">{selectedRequest.username}</span>
                    <span className="text-slate-600 truncate block text-[8px]">{selectedRequest.userEmail}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 uppercase">Fecha Pedido</span>
                    <span className="text-slate-300 block">{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-850">
                    <span className="block text-slate-500 uppercase">Última Actualización</span>
                    <span className="text-slate-300 block">{new Date(selectedRequest.updatedAt).toLocaleString()}</span>
                  </div>
                </div>

                {selectedRequest.referenceLink && (
                  <a
                    href={selectedRequest.referenceLink}
                    target="_blank"
                    rel="noreferrer referrer"
                    className="w-full flex items-center justify-center gap-2 py-2 border border-slate-800 hover:border-indigo-500 bg-slate-950/50 hover:bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white rounded-xl transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Visitar Enlace Externo</span>
                  </a>
                )}
              </div>

              {/* STAFF SECTION: Change Status controls */}
              {isStaff && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    GESTIÓN DE ESTADO (Staff Only)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 text-[10px] font-bold">
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, RequestStatus.EnRevision)}
                      className="py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition shrink-0"
                    >
                      En revisión
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, RequestStatus.Aprobada)}
                      className="py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition shrink-0"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, RequestStatus.Rechazada)}
                      className="py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition shrink-0"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, RequestStatus.Completada)}
                      className="py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition shrink-0"
                    >
                      Completar
                    </button>
                  </div>
                </div>
              )}

              {/* COMMENTS SECTION (Visible only to Staff/Admin) */}
              {isStaff ? (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      COMENTARIOS INTERNOS ({selectedRequest.internalComments?.length || 0})
                    </span>
                    <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-bold font-mono">
                      SOLO STAFF
                    </span>
                  </div>

                  {/* Private Comments List */}
                  <div className="max-h-[160px] overflow-y-auto space-y-2.5 pr-1 font-sans text-xs">
                    {!selectedRequest.internalComments || selectedRequest.internalComments.length === 0 ? (
                      <p className="text-slate-600 text-center py-2 text-[11px]">No hay notas internas agregadas.</p>
                    ) : (
                      selectedRequest.internalComments.map((comment) => (
                        <div key={comment.id} className="p-2.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1 relative group/comment">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-slate-300">{comment.authorName}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-600 font-mono">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteComment(selectedRequest.id, comment.id);
                                  }}
                                  className={`p-1 rounded transition text-xs flex items-center ${
                                    confirmDeleteCommentId === comment.id 
                                      ? 'bg-red-600 text-white font-bold px-1.5 py-0.5 text-[8px]' 
                                      : 'text-red-400 hover:bg-red-500/10'
                                  }`}
                                  title="Eliminar Comentario"
                                >
                                  {confirmDeleteCommentId === comment.id ? '¿Sí?' : <Trash2 className="h-3 w-3" />}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-400 leading-relaxed text-[11px] pr-5">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input form */}
                  <form onSubmit={handleAddComment} className="flex gap-2 text-xs">
                    <input
                      type="text"
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe una nota interna..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={commentSubmitting}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-800 text-center py-4 space-y-2">
                  <HelpCircle className="h-6 w-6 text-slate-600 mx-auto" />
                  <p className="text-slate-500 text-[11px] max-w-xs mx-auto">
                    Los comentarios internos de revisión y aprobación son visibles únicamente para el equipo de Recursos y los Administradores.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              <span>Selecciona una solicitud de la lista para ver su estado, detalles y actualizaciones de moderación.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
