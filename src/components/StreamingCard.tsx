import React, { useState } from 'react';
import { Lock, Unlock, Copy, Check, Key, Mail, ShieldAlert, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import { UserRole, ROLE_HIERARCHY } from '../types.js';

interface StreamingCardProps {
  key?: any;
  account: any;
  userRole: UserRole;
  isAdmin: boolean;
  onEdit?: (account: any) => void;
  onDelete?: (accountId: string) => void;
}

export default function StreamingCard({
  account,
  userRole,
  isAdmin,
  onEdit,
  onDelete
}: StreamingCardProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const userLevel = ROLE_HIERARCHY[userRole] || 1;
  const requiredLevel = ROLE_HIERARCHY[account.minRole] || 1;
  const isUnlocked = userLevel >= requiredLevel;

  const copyToClipboard = (text: string, type: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.Owner: return 'bg-red-500/10 text-red-400 border-red-500/20';
      case UserRole.CoOwner: return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case UserRole.MegaVIP: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case UserRole.SuperVIP: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case UserRole.VIP: return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col md:flex-row h-full relative group">
      {/* Category marker */}
      <span className="absolute top-3 left-3 z-10 bg-indigo-600 text-white font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
        Streaming Gratis
      </span>

      {/* Admin Action Buttons */}
      {isAdmin && (onEdit || onDelete) && (
        <div className="absolute top-3 right-3 z-10 flex gap-1 bg-slate-950/80 p-1 rounded-lg backdrop-blur">
          {onEdit && (
            <button
              onClick={() => onEdit(account)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-850 rounded"
              title="Editar Publicación"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(account.id)}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-850 rounded"
              title="Eliminar Publicación"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Thumbnail */}
      <div className="h-36 md:h-auto md:w-44 bg-slate-950 relative overflow-hidden shrink-0">
        <img
          src={account.imageUrl || 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=500&q=80'}
          alt={account.platform}
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${!isUnlocked ? 'blur-md brightness-50' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
      </div>

      {/* Account Info Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display font-bold text-slate-200 text-base">{account.platform}</h4>
            {account.accountType && account.accountType !== '-' && account.accountType.trim() !== '' && (
              <span className="text-xs text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {account.accountType}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{account.description}</p>
        </div>

        {/* Credentials Zone */}
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850 space-y-2">
          {isUnlocked ? (
            <>
              {/* Username/Email */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="font-mono truncate select-all">{account.email}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(account.email, 'email')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition shrink-0"
                  title="Copiar Correo"
                >
                  {copiedEmail ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between gap-2 text-xs border-t border-slate-900/40 pt-2">
                <div className="flex items-center gap-2 overflow-hidden text-slate-300">
                  <Key className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="font-mono truncate select-all">
                    {showPassword ? account.password : '••••••••••••'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                    title={showPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(account.password, 'password')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition"
                    title="Copiar Contraseña"
                  >
                    {copiedPassword ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center text-center space-y-1.5 text-xs text-slate-500">
              <Lock className="h-4 w-4 text-red-500 animate-pulse" />
              <span>Detalles ocultos para tu rango.</span>
              <span className="text-[10px] text-red-400/80">Requiere {account.minRole} o superior.</span>
            </div>
          )}
        </div>

        {/* Footer info & Minimum Required Role Badge */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-850/60 text-[10px]">
          <span className="text-slate-500 font-mono">
            Agregado: {new Date(account.createdAt).toLocaleDateString()}
          </span>

          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border ${getRoleBadgeStyle(account.minRole)}`}>
            {isUnlocked ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
            {account.minRole}
          </span>
        </div>
      </div>
    </div>
  );
}
