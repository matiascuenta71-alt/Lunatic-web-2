import React, { useState, useEffect } from 'react';
import { Gift, Calendar, Users, Plus, Trash2, Clock, Trophy, Check, Sparkles, MapPin, AlertTriangle, MessageSquare, Ticket, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, type Giveaway, type CommunityEvent } from '../types.js';

// Helper to parse duration (e.g., 30s, 15m, 2h, 1d) or absolute dates to ISO strings
function parseDurationToIso(input: string, baseDate: Date = new Date()): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  
  // If it's a valid date or ISO format, return it
  if (trimmed.includes('-') || trimmed.includes('T') || (isNaN(Date.parse(trimmed)) === false && !/^\d+[smhd]$/i.test(trimmed))) {
    try {
      return new Date(trimmed).toISOString();
    } catch (e) {
      return null;
    }
  }

  const regex = /^(\d+)([smhd])$/i;
  const match = trimmed.match(regex);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  let ms = 0;
  switch (unit) {
    case 's': ms = num * 1000; break;
    case 'm': ms = num * 60 * 1000; break;
    case 'h': ms = num * 60 * 60 * 1000; break;
    case 'd': ms = num * 24 * 60 * 60 * 1000; break;
    default: return null;
  }
  return new Date(baseDate.getTime() + ms).toISOString();
}

// Live Countdown component that displays dynamic ticking time in seconds, minutes, hours, and days
function LiveCountdown({ targetDate, label = 'Termina en:', onFinish }: { targetDate: string; label?: string; onFinish?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft('Expirado/No definido');
      return;
    }
    let finishedTriggered = false;
    const update = () => {
      try {
        const target = new Date(targetDate).getTime();
        if (isNaN(target)) {
          setTimeLeft('Fecha inválida');
          return;
        }
        const now = Date.now();
        const diff = target - now;

        if (diff <= 0) {
          setTimeLeft('Finalizado');
          if (onFinish && !finishedTriggered) {
            finishedTriggered = true;
            onFinish();
          }
          return;
        }

        const secs = Math.floor(diff / 1000) % 60;
        const mins = Math.floor(diff / (1000 * 60)) % 60;
        const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (mins > 0) parts.push(`${mins}m`);
        parts.push(`${secs}s`);

        setTimeLeft(parts.join(' '));
      } catch (err) {
        setTimeLeft('Error de fecha');
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onFinish]);

  const isFinished = timeLeft === 'Finalizado';

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
      <span className="text-slate-500 font-sans text-[10px] uppercase tracking-wider font-bold">{label}</span>
      <span className={`font-bold tracking-wide ${isFinished ? 'text-red-400 font-sans' : 'text-indigo-400 animate-pulse'}`}>
        {timeLeft}
      </span>
    </div>
  );
}

interface GiveawaysEventsViewProps {
  user: any;
  token?: string | null;
}

export default function GiveawaysEventsView({ user, token: propToken }: GiveawaysEventsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'giveaways' | 'events'>('giveaways');
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal / Form state for creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Giveaway Form State
  const [prize, setPrize] = useState('');
  const [requirements, setRequirements] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [minRole, setMinRole] = useState<string>(UserRole.Usuario);

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDateInput, setEventStartDateInput] = useState('0s');
  const [eventEndDateInput, setEventEndDateInput] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const isModerator = user.role === UserRole.Owner || user.role === UserRole.CoOwner;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = propToken || '';
      
      // Fetch giveaways
      const giveawayRes = await fetch('/api/giveaways', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const giveawayData = await giveawayRes.json();
      if (giveawayRes.ok) {
        setGiveaways(giveawayData.giveaways || []);
      }

      // Fetch events
      const eventRes = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eventData = await eventRes.json();
      if (eventRes.ok) {
        setEvents(eventData.events || []);
      }
    } catch (err: any) {
      setError('Error al cargar datos. Por favor reintenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!prize || !endDateInput) {
      setError('El premio y el tiempo de finalización son obligatorios.');
      return;
    }

    const calculatedEndDate = parseDurationToIso(endDateInput);
    if (!calculatedEndDate) {
      setError('Formato de fecha o duración inválido para el cierre. Usa formatos como 30s, 15m, 2h, 1d o selecciona una fecha.');
      return;
    }

    try {
      const token = propToken || '';
      const res = await fetch('/api/admin/giveaways', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prize, requirements, endDate: calculatedEndDate, minRole })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al crear el sorteo.');

      setSuccess('¡Sorteo creado exitosamente!');
      setPrize('');
      setRequirements('');
      setEndDateInput('');
      setMinRole(UserRole.Usuario);
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!eventTitle || !eventDescription || !eventStartDateInput || !eventEndDateInput) {
      setError('El título, descripción, inicio y finalización del evento son obligatorios.');
      return;
    }

    const calculatedStartDate = parseDurationToIso(eventStartDateInput);
    if (!calculatedStartDate) {
      setError('Formato de inicio inválido. Usa 0s para inmediato, o 15m, 2h, 1d o selecciona una fecha.');
      return;
    }

    // Pass calculatedStartDate as the base to parse relative duration
    const calculatedEndDate = parseDurationToIso(eventEndDateInput, new Date(calculatedStartDate));
    if (!calculatedEndDate) {
      setError('Formato de finalización inválido. Usa 2h, 1d o selecciona una fecha.');
      return;
    }

    if (new Date(calculatedEndDate) <= new Date(calculatedStartDate)) {
      setError('La fecha de finalización debe ser posterior a la fecha de inicio del evento.');
      return;
    }

    try {
      const token = propToken || '';
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          startDate: calculatedStartDate,
          endDate: calculatedEndDate,
          location: eventLocation
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al crear el evento.');

      setSuccess('¡Evento de la comunidad creado exitosamente!');
      setEventTitle('');
      setEventDescription('');
      setEventStartDateInput('0s');
      setEventEndDateInput('');
      setEventLocation('');
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEnterGiveaway = async (giveawayId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const token = propToken || '';
      const res = await fetch(`/api/giveaways/${giveawayId}/enter`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'No se pudo ingresar al sorteo.');

      setSuccess('¡Te has registrado en el sorteo correctamente! Buena suerte. 🍀');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDrawWinner = async (giveawayId: string) => {
    if (!window.confirm('¿Deseas cerrar las inscripciones y seleccionar un ganador aleatorio ahora mismo?')) return;
    setError(null);
    setSuccess(null);
    try {
      const token = propToken || '';
      const res = await fetch(`/api/admin/giveaways/${giveawayId}/draw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al realizar el sorteo.');

      setSuccess(`¡Sorteo finalizado! El ganador elegido es: ${data.giveaway.winner?.username || 'Nadie'}`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRedrawWinner = async (giveawayId: string) => {
    if (!window.confirm('¿Deseas volver a sortear un ganador para este sorteo? El ganador actual será excluido del resorteo.')) return;
    setError(null);
    setSuccess(null);
    try {
      const token = propToken || '';
      const res = await fetch(`/api/admin/giveaways/${giveawayId}/redraw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al volver a sortear.');

      setSuccess(`¡Resorteo completado! El nuevo ganador es: ${data.giveaway.winner?.username || 'Nadie'}`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteGiveaway = async (giveawayId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este sorteo? Esta acción es irreversible.')) return;
    try {
      const token = propToken || '';
      const res = await fetch(`/api/admin/giveaways/${giveawayId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Sorteo eliminado.');
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar sorteo.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEventRsvp = async (eventId: string, rsvpStatus: 'going' | 'maybe' | 'not_going') => {
    try {
      const token = propToken || '';
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: rsvpStatus })
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Error al marcar asistencia.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este evento?')) return;
    try {
      const token = propToken || '';
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Evento eliminado.');
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar evento.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Feedbacks */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-950/40 border border-red-900/40 rounded-xl flex items-center gap-3 text-red-400 text-xs"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-950/40 border border-emerald-900/40 rounded-xl flex items-center gap-3 text-emerald-400 text-xs"
          >
            <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Gift className="h-44 w-44 text-indigo-500" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-3 w-3" /> Eventos & Sorteos
            </span>
            <h3 className="font-display font-extrabold text-2xl md:text-3xl text-slate-100 tracking-tight leading-none">
              Sorteos Activos y <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Eventos de la Comunidad</span>
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Participa en sorteos semanales con premios increíbles o asiste a eventos cooperativos organizados en nuestro Discord. ¡Tu asistencia y apoyo hacen crecer a la comunidad!
            </p>
          </div>

          {isModerator && (
            <button
              onClick={() => {
                setError(null);
                setSuccess(null);
                setShowCreateModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/10 self-start md:self-auto shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{activeSubTab === 'giveaways' ? 'Crear Nuevo Sorteo' : 'Crear Nuevo Evento'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => { setActiveSubTab('giveaways'); setError(null); setSuccess(null); }}
          className={`px-6 py-3.5 font-display text-xs font-semibold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'giveaways'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift className="h-4 w-4" />
          <span>Sorteos Activos</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('events'); setError(null); setSuccess(null); }}
          className={`px-6 py-3.5 font-display text-xs font-semibold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'events'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Eventos de la Comunidad</span>
        </button>
      </div>

      {/* Create Modal overlay */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-850 bg-slate-950 flex items-center justify-between">
                <h4 className="font-display font-bold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  {activeSubTab === 'giveaways' ? <Gift className="h-4.5 w-4.5 text-indigo-400" /> : <Calendar className="h-4.5 w-4.5 text-indigo-400" />}
                  {activeSubTab === 'giveaways' ? 'Crear Nuevo Sorteo' : 'Crear Nuevo Evento'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-semibold transition"
                >
                  Cerrar
                </button>
              </div>

              {activeSubTab === 'giveaways' ? (
                /* GIVEAWAY FORM */
                <form onSubmit={handleCreateGiveaway} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Premio del Sorteo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. VIP Rango por 1 Mes, Cuenta Netflix Ultra HD, etc."
                      value={prize}
                      onChange={(e) => setPrize(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Requisitos de Participación</label>
                    <textarea
                      placeholder="Ej. Estar en el servidor de Discord / Tener rango de Invitaciones"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rango Mínimo Requerido</label>
                    <select
                      value={minRole}
                      onChange={(e) => setMinRole(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 text-xs focus:border-indigo-500 focus:outline-none transition"
                    >
                      {Object.values(UserRole).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tiempo de Finalización (Duración)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 30s, 15m, 2h, 1d"
                      value={endDateInput}
                      onChange={(e) => setEndDateInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition"
                    />
                    <p className="text-[9px] text-slate-500 leading-normal mt-1">
                      Usa <strong>s</strong> (segundos), <strong>m</strong> (minutos), <strong>h</strong> (horas) o <strong>d</strong> (días).
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-xs transition mt-2 cursor-pointer"
                  >
                    Publicar Sorteo Oficial
                  </button>
                </form>
              ) : (
                /* EVENT FORM */
                <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Título del Evento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Torneo de Minecraft Bedrock, Noche de Películas, Sorteo en Vivo, etc."
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción y Detalles del Evento</label>
                    <textarea
                      required
                      placeholder="Describe de qué se tratará el evento, reglas y cómo participar."
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tiempo de Inicio</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 0s (Inmediato), 10m, 2h"
                        value={eventStartDateInput}
                        onChange={(e) => setEventStartDateInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition"
                      />
                      <p className="text-[9px] text-slate-500 mt-1">Usa <strong>0s</strong> para iniciar inmediatamente o escribe duración (ej. 15m, 2h).</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ubicación / Canal</label>
                      <input
                        type="text"
                        placeholder="Ej. Discord Canal de Voz #1"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition h-[38px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tiempo de Finalización (Duración)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 2h, 1d (desde el inicio)"
                      value={eventEndDateInput}
                      onChange={(e) => setEventEndDateInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition"
                    />
                    <p className="text-[9px] text-slate-500 leading-normal mt-1">
                      Especifica la duración total del evento (ej. <strong>2h</strong>, <strong>3d</strong>).
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-xs transition mt-2 cursor-pointer"
                  >
                    Publicar Evento de la Comunidad
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Grid List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs font-mono">
          Cargando contenido, por favor espera...
        </div>
      ) : (
        <>
          {activeSubTab === 'giveaways' && (
            <div className="space-y-6">
              {giveaways.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <Gift className="h-10 w-10 mx-auto text-slate-700 mb-3" />
                  <p className="text-xs">No hay sorteos disponibles en este momento.</p>
                  {isModerator && (
                    <p className="text-[11px] text-slate-600 mt-1">¡Crea el primer sorteo usando el botón de arriba!</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {giveaways.map((giveaway) => {
                    const participantsList = giveaway.participants || [];
                    const alreadyEntered = participantsList.some(p => p.userId === user.id);
                    const isClosed = giveaway.status === 'closed' || (giveaway.endDate ? new Date() > new Date(giveaway.endDate) : false);

                    return (
                      <div
                        key={giveaway.id}
                        className={`bg-slate-900 border ${
                          giveaway.winner ? 'border-amber-500/40' : alreadyEntered ? 'border-indigo-500/30' : 'border-slate-800'
                        } rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden transition-all`}
                      >
                        {/* Status Label badge */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          {giveaway.winner ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Trophy className="h-2.5 w-2.5" /> Finalizado
                            </span>
                          ) : isClosed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                              Cerrado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                              Activo
                            </span>
                          )}

                          {isModerator && (
                            <button
                              onClick={() => handleDeleteGiveaway(giveaway.id)}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                              title="Eliminar Sorteo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Top prize section */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-xl shrink-0 ${giveaway.winner ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                              <Gift className="h-5 w-5" />
                            </span>
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Premio</span>
                              <h4 className="font-display font-extrabold text-base text-slate-100 tracking-tight leading-tight">
                                {giveaway.prize}
                              </h4>
                            </div>
                          </div>

                          {/* Requirements & Info */}
                          <div className="p-3 bg-slate-950/60 border border-slate-850/60 rounded-xl space-y-2">
                            {giveaway.minRole && giveaway.minRole !== UserRole.Usuario && (
                              <div className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1.5 w-fit uppercase font-mono mb-2">
                                <AlertTriangle className="h-3 w-3 text-amber-400" />
                                <span>Rango Mínimo: {giveaway.minRole}</span>
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-300">Requisitos:</span> {giveaway.requirements}
                            </div>
                            <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-900/40">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span>Cierre: {formatDateTime(giveaway.endDate)}</span>
                              </div>
                              {!giveaway.winner && (
                                <LiveCountdown targetDate={giveaway.endDate} label="Tiempo restante:" onFinish={fetchData} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Draw Winner Area / Closed State */}
                        {giveaway.winner ? (
                          <div className="p-4 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3.5">
                            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg animate-bounce">
                              <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="block text-[9px] text-amber-400 uppercase tracking-wider font-mono font-bold">¡Ganador Oficial Seleccionado!</span>
                              <span className="font-display font-extrabold text-sm text-slate-100">
                                @{giveaway.winner.username}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Active Participation list / stats */
                          <div className="flex items-center justify-between text-xs pt-1">
                            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                              <Users className="h-4 w-4 text-indigo-400" />
                              <span>{participantsList.length} {participantsList.length === 1 ? 'participante' : 'participantes'}</span>
                            </div>

                            {alreadyEntered && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-bold bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/15">
                                <Check className="h-3.5 w-3.5" /> Registrado
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        {isModerator && giveaway.winner && (
                          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-850">
                            <button
                              onClick={() => handleRedrawWinner(giveaway.id)}
                              className="w-full bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-400 hover:text-amber-300 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Volver a Sortear (Resortear)</span>
                            </button>
                          </div>
                        )}
                        {!giveaway.winner && (
                          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-850">
                            {!isClosed && !alreadyEntered && (
                              <button
                                onClick={() => handleEnterGiveaway(giveaway.id)}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
                              >
                                Participar en el Sorteo
                              </button>
                            )}

                            {isModerator && !giveaway.winner && participantsList.length > 0 && (
                              <button
                                onClick={() => handleDrawWinner(giveaway.id)}
                                className="w-full bg-slate-950 hover:bg-slate-850 border border-indigo-900/30 text-indigo-400 hover:text-indigo-300 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                              >
                                <Trophy className="h-3.5 w-3.5" />
                                <span>Realizar Sorteo (Elegir Ganador)</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'events' && (
            <div className="space-y-6">
              {events.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <Calendar className="h-10 w-10 mx-auto text-slate-700 mb-3" />
                  <p className="text-xs">No hay eventos comunitarios programados en este momento.</p>
                  {isModerator && (
                    <p className="text-[11px] text-slate-600 mt-1">¡Planifica el primer evento del servidor usando el botón de arriba!</p>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {events.map((event) => {
                    const rsvps = event.rsvps || [];
                    const myRsvp = rsvps.find(r => r.userId === user.id)?.status;
                    const goingCount = rsvps.filter(r => r.status === 'going').length;
                    const maybeCount = rsvps.filter(r => r.status === 'maybe').length;
                    const notGoingCount = rsvps.filter(r => r.status === 'not_going').length;

                    return (
                      <div
                        key={event.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-start relative overflow-hidden"
                      >
                        <div className="space-y-4 max-w-2xl flex-1">
                          {/* Event badge/author */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Evento Oficial
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">Organizado por @{event.creatorName}</span>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="font-display font-extrabold text-lg text-slate-100 tracking-tight leading-none">
                              {event.title}
                            </h4>
                            <p className="text-slate-400 text-xs leading-relaxed">
                              {event.description}
                            </p>
                          </div>

                          {/* Event details grid metadata */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-850/60">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-slate-300">
                                <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
                                <div>
                                  <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold">Inicio</span>
                                  <span>{formatDateTime(event.startDate)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-slate-300">
                                <Clock className="h-4 w-4 text-purple-400 shrink-0" />
                                <div>
                                  <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold">Finalización</span>
                                  <span>{formatDateTime(event.endDate)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                            <div className="flex items-center gap-2.5 text-xs text-slate-300">
                              <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                              <span>{event.location}</span>
                            </div>

                            {/* Active Countdown logic */}
                            <div className="flex items-center gap-2.5">
                              {new Date() < new Date(event.startDate) ? (
                                <LiveCountdown targetDate={event.startDate} label="Comienza en:" />
                              ) : new Date() < new Date(event.endDate) ? (
                                <LiveCountdown targetDate={event.endDate} label="Termina en:" />
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                                  Evento Finalizado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* RSVPs stats bar */}
                          <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                            <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] font-mono">Asistencias:</span>
                            <span className="flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/15">
                              {goingCount} Asistirán
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-lg border border-indigo-500/15">
                              {maybeCount} Tal vez
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-500 bg-slate-800/10 px-2 py-0.5 rounded-lg border border-slate-800">
                              {notGoingCount} No asistirán
                            </span>
                          </div>
                        </div>

                        {/* Interactive RSVP Actions */}
                        <div className="w-full md:w-auto shrink-0 space-y-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-850 md:pl-6 flex flex-col justify-between self-stretch">
                          <div className="space-y-2">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono text-center md:text-left">Tu Asistencia</span>
                            <div className="flex flex-row md:flex-col gap-2">
                              <button
                                onClick={() => handleEventRsvp(event.id, 'going')}
                                className={`flex-1 md:w-44 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5 border ${
                                  myRsvp === 'going'
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                                } cursor-pointer`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Asistiré</span>
                              </button>

                              <button
                                onClick={() => handleEventRsvp(event.id, 'maybe')}
                                className={`flex-1 md:w-44 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5 border ${
                                  myRsvp === 'maybe'
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                                } cursor-pointer`}
                              >
                                <span>Tal vez</span>
                              </button>

                              <button
                                onClick={() => handleEventRsvp(event.id, 'not_going')}
                                className={`flex-1 md:w-44 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5 border ${
                                  myRsvp === 'not_going'
                                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                                    : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-400'
                                } cursor-pointer`}
                              >
                                <span>No asistiré</span>
                              </button>
                            </div>
                          </div>

                          {/* Admin action or help ticket */}
                          <div className="flex items-center gap-2 pt-2 md:pt-0 justify-end">
                            {isModerator && (
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="w-full md:w-auto px-3 py-2 text-xs font-semibold text-red-400 hover:text-white bg-red-950/20 hover:bg-red-900/40 border border-red-900/30 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Eliminar Evento</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Ticket info helper footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Ticket className="h-5 w-5" />
          </span>
          <div>
            <h5 className="font-semibold text-xs text-slate-200">¿Tienes dudas o quieres reportar un problema?</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">Abre un ticket de soporte dentro de nuestro Discord para recibir atención oficial.</p>
          </div>
        </div>
        
        <a
          href="https://dc.gg/lunatic"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Discord de Lunatic</span>
        </a>
      </div>
    </div>
  );
}
