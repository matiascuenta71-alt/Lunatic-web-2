import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Tv, Mail, Key, FileText, Image, ShieldCheck, Plus, Sparkles } from 'lucide-react';
import { UserRole } from '../types.js';

interface StreamingAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

const PLATFORM_PRESETS = [
  'Netflix',
  'Spotify',
  'Disney+',
  'Amazon Prime Video',
  'HBO Max',
  'Crunchyroll',
  'YouTube Premium',
  'Star+',
  'Apple TV+',
  'Otro'
];

export default function StreamingAddModal({
  isOpen,
  onClose,
  token,
  onSuccess
}: StreamingAddModalProps) {
  const [platform, setPlatform] = useState('Netflix');
  const [customPlatform, setCustomPlatform] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [minRole, setMinRole] = useState<UserRole>(UserRole.VIP);
  
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona únicamente archivos de imagen.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.');
      return;
    }

    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const fileData = reader.result as string;
      try {
        const res = await fetch('/api/admin/resources/image-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al subir la imagen.');
        }
        setImageUrl(data.imageUrl);
      } catch (err: any) {
        alert(`Error al subir imagen: ${err.message}`);
      } finally {
        setImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPlatform = platform === 'Otro' ? customPlatform.trim() : platform;
    if (!selectedPlatform) {
      alert('Por favor ingresa o selecciona una plataforma.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      alert('Por favor completa todos los campos requeridos (Gmail, contraseña).');
      return;
    }

    const payload = {
      platform: selectedPlatform,
      email: email.trim(),
      password: password.trim(),
      accountType: '-',
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      minRole
    };

    try {
      const res = await fetch('/api/admin/streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al guardar la cuenta.');
      }

      onSuccess();
      onClose();
      // Reset form
      setPlatform('Netflix');
      setCustomPlatform('');
      setEmail('');
      setPassword('');
      setDescription('');
      setImageUrl('');
      setMinRole(UserRole.VIP);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg bg-[#09090f] border border-[#161624] rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#161624] flex items-center justify-between bg-gradient-to-r from-indigo-950/30 to-purple-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Tv className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-100 text-sm tracking-wide uppercase">Subir Cuenta Streaming</h3>
                  <p className="text-[10px] text-slate-500 font-mono">PANEL DE ADMINISTRACIÓN</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-850 rounded-xl transition text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Platform selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Plataforma
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#030305] border border-[#161624] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition"
                  >
                    {PLATFORM_PRESETS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  {platform === 'Otro' && (
                    <input
                      type="text"
                      required
                      value={customPlatform}
                      onChange={(e) => setCustomPlatform(e.target.value)}
                      placeholder="Escribe la plataforma..."
                      className="w-full px-3.5 py-2.5 bg-[#030305] border border-[#161624] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition"
                    />
                  )}
                </div>
              </div>

              {/* Email / Gmail Access */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Gmail de Acceso
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@gmail.com o usuario_acceso"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#030305] border border-[#161624] rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa la contraseña para la cuenta"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#030305] border border-[#161624] rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Description (Opcional) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Descripción corta (Opcional)</span>
                  <span className="text-slate-600 font-mono text-[9px] lowercase font-normal">Opcional</span>
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-3.5 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </span>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Reglas de uso, número de pantallas, perfiles autorizados..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#030305] border border-[#161624] rounded-xl text-slate-200 text-xs resize-none focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Cover Image/Photo (Opcional) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Foto / Portada (Opcional)</span>
                  <span className="text-slate-600 font-mono text-[9px] lowercase font-normal">Opcional</span>
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="w-full px-4 py-2.5 bg-[#030305] hover:bg-[#07070a] border border-[#161624] hover:border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="h-4 w-4 text-indigo-400" />
                    {imageUploading ? 'Subiendo de tus archivos...' : 'Subir desde tu ordenador / galería'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <Image className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="O pega un enlace de imagen directa (URL)..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#030305] border border-[#161624] rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  {imageUrl && (
                    <div className="mt-1 flex items-center gap-2 p-1.5 bg-[#030305] rounded-lg border border-[#161624] max-w-full overflow-hidden">
                      <img src={imageUrl} alt="Vista previa" className="w-8 h-8 rounded object-cover border border-slate-800" />
                      <span className="text-[10px] text-emerald-400 font-mono truncate">{imageUrl}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Minimum required role */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                  Rango Mínimo requerido
                </label>
                <select
                  value={minRole}
                  onChange={(e) => setMinRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-[#030305] border border-[#161624] rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition"
                >
                  {Object.values(UserRole).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </form>

            {/* Footer buttons */}
            <div className="p-5 border-t border-[#161624] bg-slate-950/40 flex items-center justify-end gap-3.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#161624] hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Publicar Cuenta
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
