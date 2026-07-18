import React, { useState } from 'react';
import { Lock, Unlock, Download, ExternalLink, ShieldCheck, Edit, Trash2, MessageSquare } from 'lucide-react';
import { UserRole, ROLE_HIERARCHY } from '../types.js';
import CommentSection from './CommentSection.tsx';
import { AnimatePresence } from 'motion/react';

interface ResourceCardProps {
  key?: any;
  resource: any;
  userRole: UserRole;
  onDownload: (resourceId: string) => void;
  isAdmin: boolean;
  onEdit?: (resource: any) => void;
  onDelete?: (resourceId: string) => void;
  currentUser?: any;
  token?: string | null;
}

export default function ResourceCard({
  resource,
  userRole,
  onDownload,
  isAdmin,
  onEdit,
  onDelete,
  currentUser,
  token
}: ResourceCardProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const userLevel = ROLE_HIERARCHY[userRole] || 1;
  const requiredLevel = ROLE_HIERARCHY[resource.minRole] || 1;
  const isUnlocked = userLevel >= requiredLevel;

  // Render role badges styled nicely
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.Owner:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case UserRole.CoOwner:
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case UserRole.MegaVIP:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case UserRole.SuperVIP:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case UserRole.VIP:
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const handleDownloadClick = () => {
    if (!isUnlocked) {
      alert(`Acceso Denegado. Este recurso requiere rango [${resource.minRole}] o superior.\nTu rango actual es [${userRole}].`);
      return;
    }
    onDownload(resource.id);
    // Standard link download trigger or direct iframe download trigger
    if (resource.downloadUrl) {
      window.open(resource.downloadUrl, '_blank');
    } else {
      alert('Error: URL de descarga no disponible.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col h-full relative group">
      {/* Category Tag on Top Left over Image */}
      <span className="absolute top-3 left-3 z-10 bg-slate-950/80 text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full backdrop-blur">
        {resource.category}
      </span>

      {/* Admin Quick Actions */}
      {isAdmin && (onEdit || onDelete) && (
        <div className="absolute top-3 right-3 z-10 flex gap-1 bg-slate-950/80 p-1 rounded-lg backdrop-blur">
          {onEdit && (
            <button
              onClick={() => onEdit(resource)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-850 rounded"
              title="Editar Recurso"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(resource.id)}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-850 rounded"
              title="Eliminar Recurso"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Resource Image */}
      <div className="h-44 w-full bg-slate-950 relative overflow-hidden">
        <img
          src={resource.imageUrl || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80`}
          alt={resource.name}
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${!isUnlocked ? 'blur-sm brightness-70' : ''}`}
        />
        {/* Unlocked / Locked Visual Accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        <div className="absolute bottom-3 right-3">
          {isUnlocked ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow shadow-indigo-500/20 backdrop-blur">
              <Unlock className="h-3.5 w-3.5" />
            </span>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow shadow-red-500/20 backdrop-blur">
              <Lock className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-display font-bold text-slate-200 text-sm group-hover:text-indigo-400 transition line-clamp-1">
              {resource.name}
            </h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
            {resource.description}
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-850">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">
              {new Date(resource.createdAt).toLocaleDateString()}
            </span>

            {/* Minimum role badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(resource.minRole)}`}>
              <ShieldCheck className="h-3 w-3" />
              {resource.minRole}
            </span>
          </div>

          {/* Actions group: download and comments button */}
          <div className="flex gap-2">
            <button
              onClick={handleDownloadClick}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                isUnlocked
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 cursor-pointer'
                  : 'bg-slate-850 text-slate-500 hover:bg-red-950/20 hover:text-red-400 cursor-pointer border border-transparent hover:border-red-900/30'
              }`}
            >
              {isUnlocked ? (
                <>
                  <Download className="h-3.5 w-3.5 animate-bounce" />
                  <span>Descargar ({resource.downloadMethod === 'file' ? 'Archivo' : 'Enlace'})</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Requiere {resource.minRole}</span>
                </>
              )}
            </button>

            {currentUser && (
              <button
                onClick={() => setIsCommentsOpen(true)}
                className="px-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-indigo-400 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Comentarios / Foro"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comments overlay panel */}
      <AnimatePresence>
        {isCommentsOpen && (
          <CommentSection
            resourceId={resource.id}
            resourceName={resource.name}
            currentUser={currentUser}
            token={token}
            onClose={() => setIsCommentsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
