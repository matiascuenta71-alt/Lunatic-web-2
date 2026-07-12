import React, { useState, useEffect } from 'react';
import { Vote, Calendar, Lock, Unlock, Plus, Trash2, Check, BarChart2, X, AlertCircle, Clock } from 'lucide-react';
import { UserRole } from '../types.js';

// Helper to parse duration (e.g., 30s, 15m, 2h, 1d) or absolute dates to ISO strings
function parseDurationToIso(input: string, baseDate: Date = new Date()): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  
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
function LiveCountdown({ targetDate, label = 'Termina en:' }: { targetDate: string; label?: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft('Expirado/No definido');
      return;
    }
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
  }, [targetDate]);

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

interface PollsViewProps {
  polls: any[];
  userRole: UserRole;
  userId: string;
  token: string;
  onPollCreated: () => void;
  onPollAction: () => void;
}

export default function PollsView({
  polls,
  userRole,
  userId,
  token,
  onPollCreated,
  onPollAction
}: PollsViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [endDateInput, setEndDateInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');

  const isOwner = userRole === UserRole.Owner;

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = [...options];
    updated.splice(index, 1);
    setOptions(updated);
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const filteredOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (filteredOptions.length < 2) {
      setError('Debes especificar al menos 2 opciones de voto.');
      return;
    }

    let parsedEndDate: string | undefined = undefined;
    if (endDateInput.trim()) {
      const parsed = parseDurationToIso(endDateInput);
      if (!parsed) {
        setError('El formato de duración de finalización no es válido. Usa ej: 30s, 15m, 2h, 1d');
        return;
      }
      parsedEndDate = parsed;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          options: filteredOptions,
          endDate: parsedEndDate
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear la votación.');
      }

      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setEndDateInput('');
      setShowCreateForm(false);
      onPollCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ optionId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo registrar el voto.');
      }

      onPollAction();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cerrar esta votación de forma definitiva?')) return;

    try {
      const res = await fetch(`/api/admin/polls/${pollId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo cerrar la votación.');
      }

      onPollAction();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta votación? Se perderán todos los registros.')) return;

    try {
      const res = await fetch(`/api/admin/polls/${pollId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo eliminar la votación.');
      }

      onPollAction();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter polls based on tab
  const pollsList = polls || [];
  const filteredPolls = pollsList.filter(p => {
    if (!p) return false;
    const isDateExpired = p.endDate ? new Date() > new Date(p.endDate) : false;
    const resolvedStatus = (p.status === 'closed' || isDateExpired) ? 'closed' : 'active';
    return resolvedStatus === activeTab;
  });

  return (
    <div id="polls-view" className="space-y-8 max-w-3xl mx-auto">
      {/* View Header with owner publish triggers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Vote className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-100">Votaciones y Encuestas</h2>
            <p className="text-xs text-slate-400">Opina y participa en la toma de decisiones de la plataforma.</p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-xl text-xs transition"
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreateForm ? 'Cancelar' : 'Crear Encuesta'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'active'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Encuestas Activas
        </button>
        <button
          onClick={() => setActiveTab('closed')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'closed'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Encuestas Cerradas / Histórico
        </button>
      </div>

      {/* Creator Panel (Owner only) */}
      {showCreateForm && isOwner && (
        <form onSubmit={handleCreatePoll} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fadeIn text-xs">
          <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider">Nueva Encuesta de Votación</h3>
          
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Título de la Encuesta</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition"
                  placeholder="¿Cuál debería ser el próximo plugin?"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Descripción o Contexto</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition resize-none text-sm"
                  placeholder="Explica el contexto del voto..."
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Tiempo de Duración (Cierre)</label>
                <input
                  type="text"
                  required
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  placeholder="Ej. 1h, 12h, 1d, 7d"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-indigo-500 focus:outline-none transition font-mono"
                />
                <p className="text-[10px] text-slate-500 leading-normal mt-1.5">
                  Usa <strong>s</strong> (segundos), <strong>m</strong> (minutos), <strong>h</strong> (horas) o <strong>d</strong> (días) para definir la duración de la votación.
                </p>
              </div>
            </div>

            {/* Options manager list */}
            <div>
              <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Opciones de Voto</label>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition"
                      placeholder={`Opción #${idx + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddOption}
                className="mt-3 text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline"
              >
                + Agregar otra opción
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-xl flex items-center gap-2 transition"
            >
              <Vote className="h-4 w-4" />
              {loading ? 'Creando...' : 'Publicar Votación'}
            </button>
          </div>
        </form>
      )}

      {/* Polls Feed */}
      <div className="space-y-6">
        {filteredPolls.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
            <Vote className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            No hay votaciones en esta categoría en este momento.
          </div>
        ) : (
          filteredPolls.map((poll) => {
            const votedUserIds = poll.votedUserIds || [];
            const hasVoted = votedUserIds.includes(userId);
            const isClosed = poll.status === 'closed' || (poll.endDate ? new Date() > new Date(poll.endDate) : false);
            const options = poll.options || [];
            const totalVotes = options.reduce((sum: number, opt: any) => sum + opt.votes, 0);

            return (
              <div key={poll.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 relative overflow-hidden shadow-xl">
                {/* Visual side accent */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isClosed ? 'bg-slate-700' : 'bg-indigo-600'}`} />

                {/* Card Title & Admin controls */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg text-slate-100">{poll.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        isClosed ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {isClosed ? 'Finalizado' : 'Activo'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 font-mono text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Termina: {(() => {
                          try {
                            if (!poll.endDate) return 'No definida';
                            const d = new Date(poll.endDate);
                            if (isNaN(d.getTime())) return 'Fecha inválida';
                            return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                          } catch (e) {
                            return 'Fecha inválida';
                          }
                        })()}</span>
                      </div>
                      <span className="hidden sm:inline text-slate-700">•</span>
                      <div>
                        <span>Votos Totales: {totalVotes}</span>
                      </div>
                      {!isClosed && (
                        <>
                          <span className="hidden sm:inline text-slate-700">•</span>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            <LiveCountdown targetDate={poll.endDate} label="Tiempo restante:" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Owner quick admin actions */}
                  {isOwner && (
                    <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                      {!isClosed && (
                        <button
                          onClick={() => handleClosePoll(poll.id)}
                          className="px-2 py-1 text-[9px] font-bold hover:bg-slate-850 text-slate-400 hover:text-white rounded uppercase transition"
                          title="Cerrar Encuesta"
                        >
                          Cerrar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-850 rounded transition"
                        title="Eliminar Encuesta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{poll.description}</p>

                {/* Options list breakdown */}
                <div className="space-y-3 pt-2">
                  {(poll.options || []).map((option: any) => {
                    const optionPercentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    
                    // User has voted OR poll is closed -> render results progress bar
                    if (hasVoted || isClosed) {
                      return (
                        <div key={option.id} className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-200">
                            <span className="font-medium flex items-center gap-1.5">
                              {option.text}
                              {(poll.votedUserIds || []).includes(userId) && (
                                // Draw a checkmark beside the option they actually voted for? Since we don't save option level voter, we just know if they voted.
                                null
                              )}
                            </span>
                            <span className="font-mono font-semibold text-indigo-400">
                              {optionPercentage}% <span className="text-[10px] text-slate-500">({option.votes} {option.votes === 1 ? 'voto' : 'votos'})</span>
                            </span>
                          </div>

                          {/* Visual progress bar bar */}
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isClosed ? 'bg-slate-700' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'
                              }`}
                              style={{ width: `${optionPercentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    } else {
                      // User can vote -> render interactive buttons
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVote(poll.id, option.id)}
                          className="w-full text-left p-3.5 bg-slate-950 border border-slate-850 hover:border-indigo-600/50 hover:bg-slate-900/40 rounded-xl transition-all duration-200 text-xs text-slate-300 hover:text-white flex items-center justify-between group"
                        >
                          <span className="font-medium">{option.text}</span>
                          <span className="text-[10px] text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            Votar <Check className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      );
                    }
                  })}
                </div>

                {hasVoted && !isClosed && (
                  <p className="text-[10px] text-slate-500 font-semibold italic text-center pt-2">
                    ✓ Ya registraste tu voto en esta encuesta. Gracias por participar.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
