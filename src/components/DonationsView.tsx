import React, { useState, useEffect } from 'react';
import { ResourceCategory } from '../types.js';
import {
  Upload,
  Link2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
  XCircle,
  ExternalLink,
  Info,
  Sparkles,
  ShieldCheck,
  Award,
  PlusCircle,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface DonationsViewProps {
  currentUser: any;
  token: string;
}

export default function DonationsView({ currentUser, token }: DonationsViewProps) {
  // Donation Submission Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(ResourceCategory.Plugins);
  const [imageUrl, setImageUrl] = useState('');
  const [downloadMethod, setDownloadMethod] = useState<'url' | 'file'>('url');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');

  // Status and Lists
  const [myDonations, setMyDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchMyDonations();
  }, [token]);

  const fetchMyDonations = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/donations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMyDonations(data.donations || []);
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'image') {
        setImageUrl(reader.result as string);
      } else {
        setFileName(selectedFile.name);
        setFileData(reader.result as string);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileName(selectedFile.name);
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title || !description || !category) {
      setError('Por favor, completa los campos obligatorios.');
      return;
    }

    if (downloadMethod === 'url' && !downloadUrl) {
      setError('Debes ingresar un enlace de descarga externo válido.');
      return;
    }

    if (downloadMethod === 'file' && (!fileData || !fileName)) {
      setError('Debes seleccionar o arrastrar un archivo para subir.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          imageUrl: imageUrl || undefined,
          downloadMethod,
          downloadUrl: downloadMethod === 'url' ? downloadUrl : undefined,
          fileName: downloadMethod === 'file' ? fileName : undefined,
          fileData: downloadMethod === 'file' ? fileData : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al enviar tu aporte.');
      }

      setSuccess('¡Aporte enviado correctamente! El equipo de administración lo evaluará pronto.');
      setTitle('');
      setDescription('');
      setCategory(ResourceCategory.Plugins);
      setImageUrl('');
      setDownloadUrl('');
      setFileName('');
      setFileData('');
      fetchMyDonations();
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="donations-view-container" className="space-y-8 max-w-6xl mx-auto py-4 px-2">
      
      {/* Informative Welcome Banner */}
      <div className="bg-[#09090b]/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Award className="h-3.5 w-3.5" /> Recompensas por Aporte
          </span>
          <h3 className="font-display font-extrabold text-xl text-[#f4f4f5] tracking-tight leading-none mt-1">
            Donación y Publicación de Recursos
          </h3>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Comparte tus setups optimizados, plugins propios o configurados, modelos 3D y plantillas. Cada recurso donado pasa por un filtro de seguridad estricto y, tras ser aprobado, te otorga puntos de rango y reputación.
          </p>
        </div>
        
        <div className="flex gap-3 shrink-0 z-10">
          <div className="bg-[#030303] px-4 py-3 rounded-xl border border-slate-800 text-center min-w-[120px]">
            <span className="block text-xl font-bold font-display text-emerald-400">
              {myDonations.filter(d => d.status === 'Aprobada').length}
            </span>
            <span className="text-[9px] uppercase font-mono text-zinc-500 font-medium">Aprobados</span>
          </div>
          <div className="bg-[#030303] px-4 py-3 rounded-xl border border-slate-800 text-center min-w-[120px]">
            <span className="block text-xl font-bold font-display text-amber-400">
              {myDonations.filter(d => d.status === 'Pendiente').length}
            </span>
            <span className="text-[9px] uppercase font-mono text-zinc-500 font-medium">En Revisión</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, History Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Donation submission form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-indigo-400" />
            <h3 className="font-display font-extrabold text-base text-slate-100 tracking-tight">
              Nuevo Formulario de Donación
            </h3>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Título del Aporte *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Setup Lobby Survival Custom"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoría *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 text-xs focus:border-indigo-500 focus:outline-none transition h-[34px]"
                >
                  {Object.values(ResourceCategory).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción de lo que incluye *</label>
              <textarea
                required
                rows={3}
                placeholder="Detalla qué contiene tu aporte, dependencias o versiones de Minecraft compatibles."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Imagen de Portada / Previsualización (Opcional)</label>
              <div className="flex gap-3 items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'image')}
                  className="hidden"
                  id="donation-image-input-dedicated"
                />
                <label
                  htmlFor="donation-image-input-dedicated"
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Cargar Imagen</span>
                </label>
                {imageUrl ? (
                  <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/30 px-3 py-1.5 rounded-xl">
                    <img src={imageUrl} className="h-8 w-8 rounded object-cover border border-indigo-500/20" alt="Vista previa" />
                    <span className="text-[10px] text-indigo-300 font-mono">Cargada ✓</span>
                    <button type="button" onClick={() => setImageUrl('')} className="text-slate-500 hover:text-red-400 text-xs font-bold px-1">✕</button>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">No se ha cargado ninguna imagen.</span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-850/60 pt-4 space-y-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Método de Suministro del Recurso *</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setDownloadMethod('url')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    downloadMethod === 'url'
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Enlace de Descarga (URL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadMethod('file')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    downloadMethod === 'file'
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Subir Archivo (.zip, .jar, etc.)</span>
                </button>
              </div>

              {downloadMethod === 'url' ? (
                <div>
                  <input
                    type="url"
                    placeholder="Ej. https://github.com/usuario/mi-plugin/releases/download/v1.0/mi-plugin.jar"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Ingresa el enlace oficial de descarga directa (GitHub, MediaFire, Mega, etc.).</p>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                    dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-750 bg-slate-950'
                  }`}
                >
                  <Upload className="h-6 w-6 mx-auto text-slate-500 mb-2" />
                  <p className="text-[11px] text-slate-300 font-semibold">Arrastra tu archivo aquí o</p>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'file')}
                    className="hidden"
                    id="donation-file-input-dedicated"
                  />
                  <label
                    htmlFor="donation-file-input-dedicated"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer mt-0.5 block"
                  >
                    selecciónalo desde tu ordenador
                  </label>
                  {fileName ? (
                    <div className="mt-3 p-2 bg-indigo-950/20 border border-indigo-900/30 rounded-lg inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-[10px] text-indigo-300 font-mono truncate max-w-[200px]">{fileName}</span>
                      <button type="button" onClick={() => { setFileName(''); setFileData(''); }} className="text-slate-500 hover:text-red-400 text-[10px] px-1 font-bold">✕</button>
                    </div>
                  ) : (
                    <p className="text-[9px] text-slate-500 mt-1.5">Formatos permitidos: .zip, .rar, .jar, .json, .yml (Máx. 50MB)</p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando aporte...</span>
                </>
              ) : (
                <span>Enviar Recurso Donado</span>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Donation history of user */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-100 tracking-tight">
                Tus Donaciones Enviadas
              </h3>
              <p className="text-[11px] text-slate-500">
                Estado y seguimiento de los recursos que has donado.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                Cargando historial...
              </div>
            ) : myDonations.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500">
                <FileText className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                <p className="text-xs">No has enviado ningún aporte de recurso aún.</p>
                <p className="text-[10px] text-slate-600 mt-0.5">¡Sé el primero en aportar un recurso útil!</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                {myDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2 text-left"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-200 truncate max-w-[160px]">{donation.title}</span>
                        <span className="inline-block text-[9px] font-mono text-slate-500 mt-0.5 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">{donation.category}</span>
                      </div>

                      {/* Status Badges */}
                      {donation.status === 'Aprobada' ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold rounded-lg uppercase">
                          <Check className="h-2.5 w-2.5" /> Aprobado
                        </span>
                      ) : donation.status === 'Rechazada' ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold rounded-lg uppercase">
                          <XCircle className="h-2.5 w-2.5" /> Rechazado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold rounded-lg uppercase">
                          <Clock className="h-2.5 w-2.5" /> Pendiente
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {donation.description}
                    </p>

                    {/* Meta-info based on status */}
                    {donation.status === 'Aprobada' && (
                      <div className="pt-1.5 border-t border-slate-900 flex flex-wrap gap-2 justify-between items-center text-[9px] text-slate-500">
                        <span>Min Rango: <strong className="text-indigo-400">{donation.minRole || 'Usuario'}</strong></span>
                        {donation.downloadUrl && (
                          <a
                            href={donation.downloadUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                          >
                            <span>Descargar</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {donation.status === 'Rechazada' && donation.observation && (
                      <div className="pt-1.5 border-t border-slate-900 text-[9px] text-red-400/90 leading-normal">
                        <span className="font-semibold block text-red-400">Motivo del rechazo:</span>
                        {donation.observation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 p-3.5 bg-indigo-950/20 border border-indigo-900/35 rounded-xl flex items-start gap-2.5">
            <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-normal">
              Todos los aportes aprobados son publicados de forma inmediata en la biblioteca de <strong>Recursos Premium</strong> de Lunatic Community.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
