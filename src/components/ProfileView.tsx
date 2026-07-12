import React, { useState, useRef } from 'react';
import { User, Mail, Shield, Calendar, Image, Upload, Check, UserPen, Camera, AlertCircle } from 'lucide-react';
import { UserRole } from '../types.js';

interface ProfileViewProps {
  user: any;
  onProfileUpdate: (updatedUser: any) => void;
  token: string;
}

const PRESET_BACKGROUNDS = [
  { id: 'bg-slate-900', name: 'Gris Carbón', class: 'bg-slate-900' },
  { id: 'gradient-purple', name: 'Atardecer Morado', class: 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950' },
  { id: 'gradient-blue', name: 'Noche Azulada', class: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950' },
  { id: 'gradient-cyan', name: 'Crepúsculo Oceánico', class: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950' },
  { id: 'black-void', name: 'Vacío Negro', class: 'bg-black' }
];

export default function ProfileView({ user, onProfileUpdate, token }: ProfileViewProps) {
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona únicamente archivos de imagen.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('La foto de perfil no debe superar los 5MB.');
      return;
    }

    setAvatarUploading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const fileData = reader.result as string;
      try {
        const res = await fetch('/api/profile/avatar-upload', {
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
          throw new Error(data.error || 'No se pudo subir la foto de perfil.');
        }

        setAvatarUrl(data.avatarUrl);
        onProfileUpdate({ ...user, avatarUrl: data.avatarUrl });
        setSuccess('¡Foto de perfil actualizada con éxito!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim()) {
      setError('El nombre de usuario no puede estar vacío.');
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username.trim(),
          avatarUrl: avatarUrl.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo actualizar el perfil.');
      }
      onProfileUpdate(data.user);
      setSuccess('¡Perfil actualizado con éxito!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectPresetBg = async (presetClass: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profileBackground: presetClass })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo actualizar el fondo.');
      }
      onProfileUpdate(data.user);
      setSuccess('Fondo de perfil actualizado.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona únicamente archivos de imagen.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) { // 8MB limit
      setError('La imagen de fondo no debe superar los 8MB.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const fileData = reader.result as string;
      try {
        const res = await fetch('/api/profile/background-upload', {
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
          throw new Error(data.error || 'No se pudo subir la imagen.');
        }

        onProfileUpdate({ ...user, profileBackground: data.backgroundUrl });
        setSuccess('¡Fondo de pantalla personalizado subido con éxito!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="profile-view" className="space-y-8 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 purple-blue-glow">
        {/* Background Banner display */}
        <div className={`h-48 w-full relative ${user.profileBackground?.startsWith('bg-') ? user.profileBackground : ''}`}
             style={user.profileBackground?.startsWith('/uploads/') ? { backgroundImage: `url(${user.profileBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="absolute bottom-4 right-4 bg-slate-950/80 hover:bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 backdrop-blur transition"
          >
            <Upload className="h-3.5 w-3.5" />
            {isUploading ? 'Subiendo...' : 'Subir Fondo Personalizado'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Profile Info Details Overlay */}
        <div className="px-8 pb-8 pt-0 -mt-16 relative flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative group">
            <img
              src={avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`}
              alt={user.username}
              className="h-28 w-28 rounded-2xl bg-slate-950 border-4 border-slate-900 object-cover shadow-2xl relative z-10"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`;
              }}
            />
            <div 
              onClick={() => avatarFileInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center cursor-pointer z-20"
              title="Cambiar foto de perfil"
            >
              <Camera className="h-6 w-6 text-slate-300" />
            </div>
            <input
              type="file"
              ref={avatarFileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center md:text-left flex-1 space-y-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
              <h2 className="font-display font-bold text-2xl text-slate-100">{user.username}</h2>
              <span className="inline-flex items-center self-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {user.role}
              </span>
            </div>
            <p className="text-sm text-slate-400 font-mono">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Form Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Info Stats Card */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider">Detalles de Cuenta</h3>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 text-slate-400">
              <Mail className="h-4 w-4 text-slate-500" />
              <div className="overflow-hidden">
                <span className="block text-xs text-slate-500">Correo</span>
                <span className="font-mono text-slate-300 truncate block">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <Shield className="h-4 w-4 text-slate-500" />
              <div>
                <span className="block text-xs text-slate-500">Rango Actual</span>
                <span className="font-semibold text-indigo-400">{user.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div>
                <span className="block text-xs text-slate-500">Miembro Desde</span>
                <span className="text-slate-300">
                  {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form & BG Customizer */}
        <div className="md:col-span-2 space-y-8">
          {/* Edit Profile fields */}
          <form onSubmit={handleUpdateProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <UserPen className="h-4 w-4 text-indigo-400" /> Editar Perfil
            </h3>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-green-950/40 border border-green-800/60 text-green-300 text-xs flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-green-400" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre de Usuario</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Foto de Perfil (Avatar)</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="w-full px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="h-4 w-4 text-indigo-400" />
                    {avatarUploading ? 'Subiendo foto...' : 'Subir de Galería / Archivos'}
                  </button>
                  <div className="relative">
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:border-indigo-500 focus:outline-none transition font-mono"
                      placeholder="O ingresa una dirección URL..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-xl text-xs transition"
              >
                Guardar Cambios
              </button>
            </div>
          </form>

          {/* Background selection presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Image className="h-4 w-4 text-indigo-400" /> Diseños de Fondo Predeterminados
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_BACKGROUNDS.map((bg) => {
                const isActive = user.profileBackground === bg.id || user.profileBackground === bg.class;
                return (
                  <button
                    key={bg.id}
                    onClick={() => selectPresetBg(bg.class)}
                    className={`relative h-20 rounded-xl overflow-hidden border text-left p-3 flex flex-col justify-end group transition ${
                      isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className={`absolute inset-0 ${bg.class} transition group-hover:scale-105`} />
                    <div className="absolute inset-0 bg-black/40" />
                    <span className="relative text-[10px] font-semibold text-slate-200 uppercase tracking-wider font-display truncate">
                      {bg.name}
                    </span>
                    {isActive && (
                      <span className="absolute top-2 right-2 bg-indigo-600 text-white p-0.5 rounded-full">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
