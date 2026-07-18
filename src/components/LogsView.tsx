import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Search,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { UserRole, ResourceCategory } from '../types.js';

interface LogsViewProps {
  token: string;
  userRole: UserRole;
  systemLogs: any[];
  onRefreshData: () => void;
}

export default function LogsView({
  token,
  userRole,
  systemLogs,
  onRefreshData
}: LogsViewProps) {
  const isOwnerOrCoOwner = userRole === UserRole.Owner || userRole === UserRole.CoOwner;
  const [activeTab, setActiveTab] = useState<'audit' | 'downloads'>('audit');

  // Download Logs states
  const [downloadLogs, setDownloadLogs] = useState<any[]>([]);
  const [dlLoading, setDlLoading] = useState(false);
  const [dlSearch, setDlSearch] = useState('');
  const [dlCategory, setDlCategory] = useState('All');
  const [dlStatus, setDlStatus] = useState('All');
  const [dlSort, setDlSort] = useState('desc');
  const [activitySearch, setActivitySearch] = useState('');

  // Confirmation states
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);
  const [confirmDeleteActivityId, setConfirmDeleteActivityId] = useState<string | null>(null);
  const [confirmDeleteDownloadId, setConfirmDeleteDownloadId] = useState<string | null>(null);

  const handleClearLogs = async () => {
    if (!token) return;
    if (!confirmClearLogs) {
      setConfirmClearLogs(true);
      setTimeout(() => setConfirmClearLogs(false), 5000);
      return;
    }

    try {
      const res = await fetch('/api/admin/logs/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onRefreshData();
        setConfirmClearLogs(false);
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudieron vaciar los logs.');
      }
    } catch (e) {
      console.error('Error de conexión al vaciar logs:', e);
    }
  };

  const handleDeleteActivityLog = async (logId: string) => {
    if (!token) return;
    if (confirmDeleteActivityId !== logId) {
      setConfirmDeleteActivityId(logId);
      setTimeout(() => setConfirmDeleteActivityId(null), 4000);
      return;
    }

    try {
      const res = await fetch(`/api/admin/logs/activity/${logId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onRefreshData();
        setConfirmDeleteActivityId(null);
      }
    } catch (e) {
      console.error('Error de conexión al eliminar el log:', e);
    }
  };

  const handleDeleteDownloadLog = async (logId: string) => {
    if (!token) return;
    if (confirmDeleteDownloadId !== logId) {
      setConfirmDeleteDownloadId(logId);
      setTimeout(() => setConfirmDeleteDownloadId(null), 4000);
      return;
    }

    try {
      const res = await fetch(`/api/admin/logs/download/${logId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDownloadLogs();
        setConfirmDeleteDownloadId(null);
      }
    } catch (e) {
      console.error('Error de conexión al eliminar el log:', e);
    }
  };

  const fetchDownloadLogs = async () => {
    if (!token) return;
    setDlLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (dlSearch) queryParams.append('search', dlSearch);
      if (dlCategory !== 'All') queryParams.append('category', dlCategory);
      if (dlStatus !== 'All') queryParams.append('status', dlStatus);
      queryParams.append('sort', dlSort);

      const res = await fetch(`/api/admin/download-logs?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDownloadLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error fetching download logs in dedicated view:', e);
    } finally {
      setDlLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'downloads') {
      fetchDownloadLogs();
    }
  }, [activeTab, dlSearch, dlCategory, dlStatus, dlSort]);

  const exportLogsToCSV = () => {
    if (downloadLogs.length === 0) return;
    const headers = ['ID', 'Usuario', 'Email', 'Recurso', 'Categoria', 'Fecha', 'Hora', 'IP', 'Dispositivo', 'Estado'];
    const rows = downloadLogs.map(log => {
      const dateObj = new Date(log.createdAt);
      return [
        log.id,
        log.username,
        log.userEmail,
        log.resourceName,
        log.category,
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString(),
        log.ip,
        `"${(log.device || '').replace(/"/g, '""')}"`,
        log.status
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `canal_logs_descargas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter local system audit logs
  const filteredSystemLogs = systemLogs.filter(log => {
    if (!activitySearch) return true;
    const term = activitySearch.toLowerCase();
    return (
      (log.userEmail || '').toLowerCase().includes(term) ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term) ||
      (log.ip || '').toLowerCase().includes(term)
    );
  });

  return (
    <div id="dedicated-logs-view" className="space-y-6 max-w-6xl mx-auto">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" /> Canal de Logs & Auditoría
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xl">
            Supervisa toda la actividad de la comunidad Lunatic. Registros en tiempo real de descargas, accesos, cambios de rol y eventos de seguridad.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {isOwnerOrCoOwner && (
            <button
              type="button"
              onClick={handleClearLogs}
              className={`p-2.5 border transition-all rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                confirmClearLogs 
                  ? 'bg-red-600 border-red-500 text-white font-bold animate-pulse' 
                  : 'bg-red-950/20 border-red-900/30 hover:bg-red-900/40 text-red-400 hover:text-white'
              }`}
              title="Vaciar todos los logs de auditoría (Solo Owner)"
            >
              <Trash2 className="h-4 w-4" />
              <span>{confirmClearLogs ? '¿Confirmar Vaciar Todo?' : 'Vaciar Logs'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onRefreshData();
              if (activeTab === 'downloads') {
                fetchDownloadLogs();
              }
            }}
            className="p-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refrescar Logs</span>
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
            activeTab === 'audit' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <History className="h-4 w-4" />
          Historial de Auditoría
        </button>
        <button
          onClick={() => setActiveTab('downloads')}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
            activeTab === 'downloads' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Download className="h-4 w-4" />
          Logs de Descargas
        </button>
      </div>

      {/* SUBTAB Content 1: System Activity Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/20 p-4 rounded-xl border border-slate-850">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Buscar por usuario, acción o IP..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none text-xs"
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Mostrando {filteredSystemLogs.length} de {systemLogs.length} registros recientes
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[9px] uppercase tracking-wider sticky top-0 z-10">
                    <th className="px-6 py-3.5">Fecha / Hora</th>
                    <th className="px-6 py-3.5">Usuario Responsable</th>
                    <th className="px-6 py-3.5">Acción</th>
                    <th className="px-6 py-3.5">Detalles del Suceso</th>
                    <th className="px-6 py-3.5 text-right font-mono">Dirección IP</th>
                    {isOwnerOrCoOwner && <th className="px-6 py-3.5 text-right">Borrar</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 text-[11px]">
                  {filteredSystemLogs.length === 0 ? (
                    <tr>
                      <td colSpan={isOwnerOrCoOwner ? 6 : 5} className="text-center py-16 text-slate-500">
                        No se encontraron registros de auditoría de sistema.
                      </td>
                    </tr>
                  ) : (
                    filteredSystemLogs.map((log) => {
                      const isDanger = log.action.includes('ELIMINAR') || log.action.includes('SUSPENDER');
                      const isSuccess = log.action.includes('CREAR') || log.action.includes('REGISTRO') || log.action.includes('VERIFICACIÓN');
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-950/10 transition">
                          <td className="px-6 py-3.5 font-mono text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="block font-semibold text-slate-200">{log.userEmail || 'Anónimo'}</span>
                            <span className="block text-[9px] text-slate-500 font-mono">ID: {log.userId || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-3.5 font-mono">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              isDanger 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                : isSuccess 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-300 max-w-sm truncate" title={log.details}>
                            {log.details}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono text-slate-500">
                            {log.ip || '127.0.0.1'}
                          </td>
                          {isOwnerOrCoOwner && (
                            <td className="px-6 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteActivityLog(log.id)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold ${
                                  confirmDeleteActivityId === log.id 
                                    ? 'bg-red-600 border-red-500 text-white font-bold px-2' 
                                    : 'bg-red-950/40 text-red-400 border-red-900/30 hover:bg-red-900/50 hover:text-white'
                                }`}
                                title="Eliminar Log de Auditoría"
                              >
                                <Trash2 className="h-3 w-3" />
                                {confirmDeleteActivityId === log.id && <span>¿Sí?</span>}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB Content 2: Download Logs Table */}
      {activeTab === 'downloads' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/20 p-4 rounded-xl border border-slate-850">
            <h4 className="text-xs font-bold text-slate-400">Descargas Premium Auditables</h4>
            <button
              onClick={exportLogsToCSV}
              disabled={downloadLogs.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-1.5 px-4 rounded-xl text-xs transition shadow shadow-indigo-600/10"
            >
              <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
            </button>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-850 text-xs">
            {/* Search */}
            <div className="space-y-1">
              <label className="block text-slate-500 font-mono text-[9px] uppercase tracking-wider">Buscar por texto</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={dlSearch}
                  onChange={(e) => setDlSearch(e.target.value)}
                  placeholder="Usuario, recurso, email..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none text-xs"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="block text-slate-500 font-mono text-[9px] uppercase tracking-wider">Filtrar por Categoría</label>
              <select
                value={dlCategory}
                onChange={(e) => setDlCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none text-xs"
              >
                <option value="All">Todas las categorías</option>
                {Object.values(ResourceCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="block text-slate-500 font-mono text-[9px] uppercase tracking-wider">Estado de Descarga</label>
              <select
                value={dlStatus}
                onChange={(e) => setDlStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none text-xs"
              >
                <option value="All">Todos los estados</option>
                <option value="Completada">Completada</option>
                <option value="Fallida">Fallida</option>
              </select>
            </div>

            {/* Sort */}
            <div className="space-y-1">
              <label className="block text-slate-500 font-mono text-[9px] uppercase tracking-wider">Orden Temporal</label>
              <select
                value={dlSort}
                onChange={(e) => setDlSort(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none text-xs"
              >
                <option value="desc">Más recientes primero</option>
                <option value="asc">Más antiguos primero</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[9px] uppercase sticky top-0 z-10">
                    <th className="px-6 py-3.5">Fecha y Hora</th>
                    <th className="px-6 py-3.5">Usuario</th>
                    <th className="px-6 py-3.5">Recurso / Categoría</th>
                    <th className="px-6 py-3.5 font-mono">Dirección IP</th>
                    <th className="px-6 py-3.5">Dispositivo / Navegador</th>
                    <th className="px-6 py-3.5 text-right">Estado</th>
                    {isOwnerOrCoOwner && <th className="px-6 py-3.5 text-right">Borrar</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 text-[11px]">
                  {dlLoading ? (
                    <tr>
                      <td colSpan={isOwnerOrCoOwner ? 7 : 6} className="text-center py-16 text-slate-500 font-mono">
                        Cargando logs de descargas...
                      </td>
                    </tr>
                  ) : downloadLogs.length === 0 ? (
                    <tr>
                      <td colSpan={isOwnerOrCoOwner ? 7 : 6} className="text-center py-16 text-slate-500">
                        No hay registros de descargas que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    downloadLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-950/10 transition">
                        <td className="px-6 py-3.5 font-mono text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="block font-semibold text-slate-200">{log.username}</span>
                          <span className="block text-[9px] text-slate-500 font-mono">{log.userEmail}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="block font-semibold text-indigo-400">{log.resourceName}</span>
                          <span className="inline-block mt-0.5 px-1.5 py-px rounded bg-slate-950 border border-slate-850 text-[8px] text-slate-400 uppercase font-semibold font-mono">
                            {log.category}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-400">
                          {log.ip || '127.0.0.1'}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate font-mono text-[10px]" title={log.device}>
                          {log.device || 'N/A'}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            log.status === 'Completada' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        {isOwnerOrCoOwner && (
                          <td className="px-6 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteDownloadLog(log.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold ${
                                confirmDeleteDownloadId === log.id 
                                  ? 'bg-red-600 border-red-500 text-white font-bold px-2' 
                                  : 'bg-red-950/40 text-red-400 border-red-900/30 hover:bg-red-900/50 hover:text-white'
                              }`}
                              title="Eliminar Log de Descarga"
                            >
                              <Trash2 className="h-3 w-3" />
                              {confirmDeleteDownloadId === log.id && <span>¿Sí?</span>}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
