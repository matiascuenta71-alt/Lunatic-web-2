import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  FileCode,
  Tv,
  ListTodo,
  TrendingUp,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Lock,
  Unlock,
  Key,
  AlertTriangle,
  Upload,
  Link,
  Plus,
  Edit,
  X,
  History,
  Info,
  Check,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Gift
} from 'lucide-react';
import { UserRole, ResourceCategory, ROLE_HIERARCHY } from '../types.js';

interface AdminPanelProps {
  token: string;
  userRole: UserRole;
  users: any[];
  resources: any[];
  streaming: any[];
  polls: any[];
  logs: any[];
  onRefreshData: () => void;
}

export default function AdminPanel({
  token,
  userRole,
  users,
  resources,
  streaming,
  polls,
  logs,
  onRefreshData
}: AdminPanelProps) {
  const isOwnerOrCoOwner = userRole === UserRole.Owner || userRole === UserRole.CoOwner;
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'resources' | 'streaming' | 'logs' | 'downloads' | 'codes' | 'donations'>(
    isOwnerOrCoOwner ? 'users' : 'resources'
  );

  // Promo codes state
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [promoCodeRedeems, setPromoCodeRedeems] = useState<any[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  
  // Create code form state
  const [newCodeVal, setNewCodeVal] = useState('');
  const [newCodeRole, setNewCodeRole] = useState<string>(UserRole.VIP);
  const [durationValue, setDurationValue] = useState<number>(30);
  const [durationUnit, setDurationUnit] = useState<string>('d');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<number>(1);
  const [newCodeExpiresAt, setNewCodeExpiresAt] = useState<string>('');

  const fetchPromoCodes = async () => {
    if (!token) return;
    setCodesLoading(true);
    try {
      const res = await fetch('/api/admin/codes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPromoCodes(data.codes || []);
        setPromoCodeRedeems(data.redeems || []);
      }
    } catch (err) {
      console.error('Error fetching promo codes:', err);
    } finally {
      setCodesLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCodeVal.trim(),
          role: newCodeRole,
          duration: durationUnit === 'Permanente' ? 'Permanente' : `${durationValue}${durationUnit}`,
          maxUses: Number(newCodeMaxUses),
          expiresAt: newCodeExpiresAt ? new Date(newCodeExpiresAt).toISOString() : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear el código.');
      }
      showToast('¡Código creado con éxito!');
      setNewCodeVal('');
      setNewCodeExpiresAt('');
      fetchPromoCodes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleCode = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/codes/${id}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cambiar el estado del código.');
      }
      showToast(data.message || 'Código actualizado.');
      fetchPromoCodes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este código permanentemente?')) return;
    try {
      const res = await fetch(`/api/admin/codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar el código.');
      }
      showToast('Código de promoción eliminado.');
      fetchPromoCodes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Donations state
  const [adminDonations, setAdminDonations] = useState<any[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [reviewingDonationId, setReviewingDonationId] = useState<string | null>(null);
  const [donationReviewStatus, setDonationReviewStatus] = useState<'Aprobada' | 'Rechazada'>('Aprobada');
  const [donationReviewMinRole, setDonationReviewMinRole] = useState<string>(UserRole.Usuario);
  const [donationReviewObservation, setDonationReviewObservation] = useState('');

  const fetchAdminDonations = async () => {
    if (!token) return;
    setDonationsLoading(true);
    try {
      const res = await fetch('/api/donations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAdminDonations(data.donations || []);
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
    } finally {
      setDonationsLoading(false);
    }
  };

  const handleReviewDonation = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/donations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: donationReviewStatus,
          observation: donationReviewObservation.trim(),
          minRole: donationReviewMinRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo procesar el aporte.');
      }
      showToast(`Aporte ${donationReviewStatus === 'Aprobada' ? 'aprobado y publicado' : 'rechazado'} con éxito!`);
      setReviewingDonationId(null);
      setDonationReviewObservation('');
      fetchAdminDonations();
      onRefreshData(); // to refresh resources as well
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteDonation = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este aporte?')) return;
    try {
      const res = await fetch(`/api/admin/donations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar el aporte.');
      }
      showToast('Aporte eliminado con éxito.');
      fetchAdminDonations();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Download Logs states
  const [downloadLogs, setDownloadLogs] = useState<any[]>([]);
  const [dlLoading, setDlLoading] = useState(false);
  const [dlSearch, setDlSearch] = useState('');
  const [dlCategory, setDlCategory] = useState('All');
  const [dlStatus, setDlStatus] = useState('All');
  const [dlSort, setDlSort] = useState('desc');

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
      console.error('Error fetching download logs:', e);
    } finally {
      setDlLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'downloads') {
      fetchDownloadLogs();
    }
  }, [activeSubTab, dlSearch, dlCategory, dlStatus, dlSort]);

  useEffect(() => {
    if (activeSubTab === 'codes') {
      fetchPromoCodes();
    } else if (activeSubTab === 'donations') {
      fetchAdminDonations();
    }
  }, [activeSubTab]);

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
    link.setAttribute('download', `logs_descargas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Chat Cooldown states
  const [chatCooldownSetting, setChatCooldownSetting] = useState<number>(3);
  const [cooldownLoading, setCooldownLoading] = useState(false);

  const fetchChatCooldown = async () => {
    try {
      const res = await fetch('/api/chat/cooldown', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setChatCooldownSetting(data.cooldown !== undefined ? data.cooldown : 3);
      }
    } catch (e) {
      console.error('Error fetching chat cooldown in AdminPanel:', e);
    }
  };

  const handleSaveCooldown = async () => {
    if (!token) return;
    setCooldownLoading(true);
    try {
      const res = await fetch('/api/chat/cooldown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cooldown: chatCooldownSetting })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Cooldown del chat actualizado con éxito.', 'success');
      } else {
        showToast(data.error || 'Error al guardar cooldown.', 'error');
      }
    } catch (e) {
      showToast('Error de conexión al actualizar cooldown.', 'error');
    } finally {
      setCooldownLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users' && token && userRole === UserRole.Owner) {
      fetchChatCooldown();
    }
  }, [activeSubTab, token, userRole]);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [resourceSearch, setResourceSearch] = useState('');
  const [streamingSearch, setStreamingSearch] = useState('');

  useEffect(() => {
    setUserPage(1);
  }, [userSearch]);

  // Resource Form states
  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [resName, setResName] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resCategory, setResCategory] = useState<ResourceCategory>(ResourceCategory.Plugins);
  const [resMinRole, setResMinRole] = useState<UserRole>(UserRole.Usuario);
  const [resDownloadMethod, setResDownloadMethod] = useState<'file' | 'link'>('link');
  const [resDownloadUrl, setResDownloadUrl] = useState('');
  const [resImgUrl, setResImgUrl] = useState('');
  const [resFileName, setResFileName] = useState('');
  const [resFileData, setResFileData] = useState<string | null>(null); // base64

  const [resImgUploading, setResImgUploading] = useState(false);
  const [streamImgUploading, setStreamImgUploading] = useState(false);
  const resImgFileInputRef = useRef<HTMLInputElement>(null);
  const streamImgFileInputRef = useRef<HTMLInputElement>(null);

  const handleResImgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setResImgUploading(true);
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
        setResImgUrl(data.imageUrl);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setResImgUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStreamImgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setStreamImgUploading(true);
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
        setStreamImgUrl(data.imageUrl);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setStreamImgUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Streaming Form states
  const [streamingFormOpen, setStreamingFormOpen] = useState(false);
  const [editingStreaming, setEditingStreaming] = useState<any | null>(null);
  const [streamPlatform, setStreamPlatform] = useState('');
  const [streamEmail, setStreamEmail] = useState('');
  const [streamPassword, setStreamPassword] = useState('');
  const [streamType, setStreamType] = useState('');
  const [streamDesc, setStreamDesc] = useState('');
  const [streamImgUrl, setStreamImgUrl] = useState('');
  const [streamMinRole, setStreamMinRole] = useState<UserRole>(UserRole.Usuario);

  // Inspector Modal states
  const [inspectedUser, setInspectedUser] = useState<any | null>(null);

  // Manual Reset Password states (Owner only)
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string; username?: string; newPassword?: string } | null>(null);

  // Co-Owner can do many things but certain items are protected
  const isOwner = userRole === UserRole.Owner;
  const IMMUTABLE_EMAILS = ['matiascuenta71@gmail.com', 'arturocordo02@gmail.com'];

  // User details stats
  const totalUsers = users.length;
  const totalResources = resources.length;
  const totalStreaming = streaming.length;
  const totalPolls = polls.length;

  // -------------------------------------------------------------
  // USER ACTIONS
  // -------------------------------------------------------------
  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefreshData();
      showToast('Rango de usuario actualizado correctamente.', 'success');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleToggleSuspend = async (userId: string, currentSuspended: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isSuspended: !currentSuspended })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefreshData();
      showToast(currentSuspended ? 'Usuario reactivado correctamente.' : 'Usuario suspendido correctamente.', 'success');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isOwner) {
      showToast('Solo el OWNER puede eliminar cuentas de usuario.', 'error');
      return;
    }
    if (!window.confirm('¿Estás completamente seguro de eliminar a este usuario? Esta acción borrará sus credenciales y es irreversible.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefreshData();
      showToast('Usuario eliminado de la base de datos.', 'success');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleManualPasswordReset = async (action: 'reset' | 'change') => {
    if (!resetEmail.trim()) {
      alert('Por favor ingresa el correo electrónico (Gmail) del usuario.');
      return;
    }

    if (action === 'change' && (!resetNewPassword || resetNewPassword.trim().length < 6)) {
      alert('Para cambiar la contraseña, debes ingresar al menos 6 caracteres.');
      return;
    }

    setResetLoading(true);
    setResetResult(null);

    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: resetEmail.trim(),
          newPassword: action === 'change' ? resetNewPassword : undefined,
          action
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar el cambio.');
      }

      setResetResult({
        success: true,
        message: data.message,
        username: data.username,
        newPassword: data.newPassword
      });

      // Clear fields on success
      setResetNewPassword('');
      // Refresh platform datasets
      onRefreshData();
    } catch (err: any) {
      setResetResult({
        success: false,
        message: err.message
      });
    } finally {
      setResetLoading(false);
    }
  };

  // -------------------------------------------------------------
  // RESOURCE ACTIONS
  // -------------------------------------------------------------
  const handleResourceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setResFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenResourceCreate = () => {
    setEditingResource(null);
    setResName('');
    setResDesc('');
    setResCategory(ResourceCategory.Plugins);
    setResMinRole(UserRole.Usuario);
    setResDownloadMethod('link');
    setResDownloadUrl('');
    setResImgUrl('');
    setResFileName('');
    setResFileData(null);
    setResourceFormOpen(true);
  };

  const handleOpenResourceEdit = (res: any) => {
    setEditingResource(res);
    setResName(res.name);
    setResDesc(res.description);
    setResCategory(res.category);
    setResMinRole(res.minRole);
    setResDownloadMethod(res.downloadMethod);
    setResDownloadUrl(res.downloadUrl || '');
    setResImgUrl(res.imageUrl || '');
    setResFileName(res.fileName || '');
    setResFileData(null);
    setResourceFormOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName.trim() || !resDesc.trim()) return;

    const payload: any = {
      name: resName.trim(),
      description: resDesc.trim(),
      category: resCategory,
      minRole: resMinRole,
      downloadMethod: resDownloadMethod,
      imageUrl: resImgUrl.trim() || undefined
    };

    if (resDownloadMethod === 'link') {
      payload.downloadUrl = resDownloadUrl.trim();
    } else if (resDownloadMethod === 'file') {
      if (resFileData) {
        payload.fileName = resFileName;
        payload.fileData = resFileData;
      } else if (editingResource) {
        // Keep existing file if we are editing and haven't uploaded a new one
        payload.downloadUrl = resDownloadUrl;
      } else {
        alert('Por favor selecciona un archivo para subir.');
        return;
      }
    }

    try {
      let res;
      if (editingResource) {
        res = await fetch(`/api/admin/resources/${editingResource.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResourceFormOpen(false);
      onRefreshData();
      alert(editingResource ? 'Recurso editado con éxito.' : '¡Nuevo recurso publicado con éxito!');
    } catch (err: any) {
      alert(`Error al guardar recurso: ${err.message}`);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!isOwner) {
      alert('Solo el OWNER puede eliminar recursos.');
      return;
    }
    if (!window.confirm('¿Deseas eliminar este recurso? El archivo/enlace dejará de estar disponible.')) return;
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      onRefreshData();
      alert('Recurso eliminado.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // STREAMING ACTIONS
  // -------------------------------------------------------------
  const handleOpenStreamingCreate = () => {
    setEditingStreaming(null);
    setStreamPlatform('');
    setStreamEmail('');
    setStreamPassword('');
    setStreamType('');
    setStreamDesc('');
    setStreamImgUrl('');
    setStreamMinRole(UserRole.Usuario);
    setStreamingFormOpen(true);
  };

  const handleOpenStreamingEdit = (account: any) => {
    setEditingStreaming(account);
    setStreamPlatform(account.platform);
    setStreamEmail(account.email);
    setStreamPassword(account.password || '');
    setStreamType(account.accountType);
    setStreamDesc(account.description);
    setStreamImgUrl(account.imageUrl || '');
    setStreamMinRole(account.minRole);
    setStreamingFormOpen(true);
  };

  const handleSaveStreaming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamPlatform.trim() || !streamEmail.trim() || !streamPassword.trim() || !streamDesc.trim()) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    const payload = {
      platform: streamPlatform.trim(),
      email: streamEmail.trim(),
      password: streamPassword.trim(),
      accountType: streamType.trim() || '-',
      description: streamDesc.trim(),
      minRole: streamMinRole,
      imageUrl: streamImgUrl.trim() || undefined
    };

    try {
      let res;
      if (editingStreaming) {
        res = await fetch(`/api/admin/streaming/${editingStreaming.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/streaming', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStreamingFormOpen(false);
      onRefreshData();
      alert(editingStreaming ? 'Publicación editada con éxito.' : '¡Nueva cuenta de streaming publicada con éxito!');
    } catch (err: any) {
      alert(`Error al guardar streaming: ${err.message}`);
    }
  };

  const handleDeleteStreaming = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar esta publicación de streaming?')) return;
    try {
      const res = await fetch(`/api/admin/streaming/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      onRefreshData();
      alert('Publicación eliminada.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // FILTERS
  // -------------------------------------------------------------
  const filteredUsers = users.filter(u => {
    const s = userSearch.toLowerCase();
    return u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.role.toLowerCase().includes(s);
  });

  const usersPerPage = 10;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  const filteredResources = resources.filter(r => {
    const s = resourceSearch.toLowerCase();
    return r.name.toLowerCase().includes(s) || r.category.toLowerCase().includes(s) || r.description.toLowerCase().includes(s);
  });

  const filteredStreaming = streaming.filter(s => {
    const term = streamingSearch.toLowerCase();
    return s.platform.toLowerCase().includes(term) || (s.accountType || '').toLowerCase().includes(term) || s.description.toLowerCase().includes(term);
  });

  return (
    <div id="admin-panel" className="space-y-8 max-w-6xl mx-auto text-xs relative">
      {/* Dynamic Notification Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'success'
            ? 'bg-slate-900/95 border-emerald-500/30 text-emerald-400 backdrop-blur'
            : 'bg-slate-900/95 border-red-500/30 text-red-400 backdrop-blur'
        }`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className="font-sans text-xs font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-slate-300 ml-1.5 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Metrics widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-500 font-mono uppercase tracking-wider text-[10px]">Usuarios</span>
            <span className="text-xl font-bold text-slate-200 font-display">{totalUsers}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <FileCode className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-500 font-mono uppercase tracking-wider text-[10px]">Recursos</span>
            <span className="text-xl font-bold text-slate-200 font-display">{totalResources}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-500 font-mono uppercase tracking-wider text-[10px]">Streaming</span>
            <span className="text-xl font-bold text-slate-200 font-display">{totalStreaming}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <ListTodo className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-slate-500 font-mono uppercase tracking-wider text-[10px]">Votaciones</span>
            <span className="text-xl font-bold text-slate-200 font-display">{totalPolls}</span>
          </div>
        </div>
      </div>

      {/* Admin Subtabs navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto pb-px">
        {isOwnerOrCoOwner && (
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition shrink-0 ${
              activeSubTab === 'users' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Gestión de Usuarios
          </button>
        )}
        <button
          onClick={() => setActiveSubTab('resources')}
          className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition shrink-0 ${
            activeSubTab === 'resources' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Gestión de Recursos
        </button>
        {isOwnerOrCoOwner && (
          <>
            <button
              onClick={() => setActiveSubTab('streaming')}
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition shrink-0 ${
                activeSubTab === 'streaming' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Gestión de Streaming
            </button>
            <button
              onClick={() => setActiveSubTab('codes')}
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition shrink-0 ${
                activeSubTab === 'codes' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Códigos Canjeables
            </button>
            <button
              onClick={() => setActiveSubTab('donations')}
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition shrink-0 ${
                activeSubTab === 'donations' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Gestión de Aportes
            </button>
            <button
              onClick={() => setActiveSubTab('downloads')}
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition shrink-0 ${
                activeSubTab === 'downloads' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Logs de Descargas
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition shrink-0 ${
                activeSubTab === 'logs' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Historial de Auditoría
            </button>
          </>
        )}
      </div>

      {/* SUBTAB CONTENT: GESTIÓN DE USUARIOS */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* USER SEARCH AND TABLE LIST */}
          <div className={`${isOwner ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar usuarios por nombre, correo o rango..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Mostrando {filteredUsers.length} de {totalUsers} usuarios</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                      <th className="px-6 py-3.5">Usuario</th>
                      <th className="px-6 py-3.5">Rango / Rol</th>
                      <th className="px-6 py-3.5">Estado</th>
                      <th className="px-6 py-3.5">Fecha de registro</th>
                      <th className="px-6 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500">Ningún usuario coincide con los criterios de búsqueda.</td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => {
                        const isImmutable = IMMUTABLE_EMAILS.includes(u.email.toLowerCase());
                        const isTargetOwner = u.role === UserRole.Owner;
                        // Co-Owner can't touch Owners. Only Owner can touch Owners.
                        const canModify = !isImmutable && !(isTargetOwner && !isOwner);

                        return (
                          <tr key={u.id} className="hover:bg-slate-950/30 transition">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <img
                                src={u.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.username)}`}
                                alt={u.username}
                                className="h-8 w-8 rounded bg-slate-950 border border-slate-800 object-cover"
                              />
                              <div>
                                <span className="block font-semibold text-slate-200">{u.username}</span>
                                <span className="block text-[10px] font-mono text-slate-500">{u.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {canModify ? (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                                  className="bg-slate-950 border border-slate-850 text-slate-300 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-indigo-500 text-xs"
                                >
                                  {Object.values(UserRole).map((r) => {
                                    // Co-owner cannot promote anyone to Owner
                                    if (r === UserRole.Owner && !isOwner) return null;
                                    return (
                                      <option key={r} value={r}>
                                        {r}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg font-semibold border border-indigo-500/20 text-xs">
                                  {u.role} {isImmutable && '🥇'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                u.isSuspended
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : u.isVerified
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {u.isSuspended ? 'Suspendido' : u.isVerified ? 'Verificado' : 'Pendiente Verif.'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-500 text-[10px]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setInspectedUser(u)}
                                  className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                                  title="Ver detalles"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>

                                {canModify && (
                                  <>
                                    <button
                                      onClick={() => handleToggleSuspend(u.id, u.isSuspended)}
                                      className={`p-1.5 rounded-lg transition ${
                                        u.isSuspended
                                          ? 'bg-green-950/40 text-green-400 hover:bg-green-900 border border-green-800/30'
                                          : 'bg-amber-950/40 text-amber-400 hover:bg-amber-900 border border-amber-800/30'
                                      }`}
                                      title={u.isSuspended ? 'Reactivar usuario' : 'Suspender usuario'}
                                    >
                                      {u.isSuspended ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                    </button>
                                    {isOwner && (
                                      <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/30 text-red-400 hover:text-white rounded-lg transition"
                                        title="Eliminar usuario"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length > usersPerPage && (
                <div className="flex justify-between items-center bg-slate-950/60 px-6 py-3 border-t border-slate-800/60">
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white rounded-lg disabled:opacity-40 text-[10px] font-semibold transition cursor-pointer"
                  >
                    Anterior
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">Página {userPage} de {Math.ceil(filteredUsers.length / usersPerPage)}</span>
                  <button
                    disabled={userPage * usersPerPage >= filteredUsers.length}
                    onClick={() => setUserPage(p => p + 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white rounded-lg disabled:opacity-40 text-[10px] font-semibold transition cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PASSWORD CHANGE/RESET & CHAT CONFIG SIDE CARS - OWNER ONLY */}
          {isOwner && (
            <div className="space-y-6 h-fit">
              {/* PASSWORD RESET CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Key className="h-5 w-5" />
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-100">Restablecer Contraseña</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Como <strong>Owner</strong>, puedes cambiar o reiniciar la contraseña de cualquier usuario ingresando su dirección de correo (Gmail). Las cuentas con rango <strong>Owner</strong> y <strong>Co-Owner</strong> no pueden ser reiniciadas por seguridad.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gmail / Correo del Usuario</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="usuario@gmail.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nueva Contraseña (Opcional si vas a Reiniciar)</label>
                    <input
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {resetResult && (
                    <div className={`p-3 rounded-xl border text-xs font-mono break-all ${resetResult.success ? 'bg-green-950/40 border-green-800/60 text-green-400' : 'bg-red-950/40 border-red-800/60 text-red-400'}`}>
                      <span className="font-semibold block mb-1">{resetResult.success ? 'Éxito' : 'Error'}</span>
                      <p className="text-[11px] leading-relaxed">{resetResult.message}</p>
                      {resetResult.newPassword && (
                        <div className="mt-2 p-1.5 bg-slate-950 border border-slate-800 rounded flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 font-sans uppercase">Nueva contraseña:</span>
                          <span className="text-slate-100 text-xs select-all font-bold tracking-wider">{resetResult.newPassword}</span>
                          <span className="text-[9px] text-slate-500 font-sans leading-none mt-1">(Doble clic para copiar)</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleManualPasswordReset('reset')}
                      disabled={resetLoading}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-3 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {resetLoading ? 'Cargando...' : 'Reiniciar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManualPasswordReset('change')}
                      disabled={resetLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {resetLoading ? 'Cargando...' : 'Cambiar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* CONFIGURACIÓN DE CHAT CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <TrendingUp className="h-5 w-5" />
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-100">Control de Chat Global</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Establece un tiempo de espera (Cooldown) entre mensajes para los usuarios del chat. Los rangos <strong>Owner</strong> y <strong>Co-Owner</strong> están exentos.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tiempo de Cooldown</label>
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{chatCooldownSetting} segundos</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={chatCooldownSetting}
                      onChange={(e) => setChatCooldownSetting(Number(e.target.value))}
                      className="w-full accent-indigo-600 bg-slate-950 cursor-pointer h-1.5 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                      <span>Sin Cooldown</span>
                      <span>30s Max</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCooldown}
                    disabled={cooldownLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                  >
                    {cooldownLoading ? 'Guardando...' : 'Guardar Cooldown'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB CONTENT: GESTIÓN DE RECURSOS */}
      {activeSubTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="Buscar recursos por nombre, categoría..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none"
              />
            </div>
            <button
              onClick={handleOpenResourceCreate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-xl transition self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> Publicar Recurso
            </button>
          </div>

          {/* Form Create/Edit Resources */}
          {resourceFormOpen && (
            <form onSubmit={handleSaveResource} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider">
                  {editingResource ? `Editar Recurso: ${editingResource.name}` : 'Publicar Nuevo Recurso Premium'}
                </h3>
                <button type="button" onClick={() => setResourceFormOpen(false)} className="p-1 hover:bg-slate-850 rounded">
                  <X className="h-4 w-4 text-slate-500 hover:text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Nombre del Recurso</label>
                    <input
                      type="text"
                      required
                      value={resName}
                      onChange={(e) => setResName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100"
                      placeholder="p.ej. EssentialsX Config Completa"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Descripción</label>
                    <textarea
                      required
                      rows={3}
                      value={resDesc}
                      onChange={(e) => setResDesc(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 resize-none text-sm"
                      placeholder="Explica qué incluye este recurso..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Categoría</label>
                      <select
                        value={resCategory}
                        onChange={(e) => setResCategory(e.target.value as ResourceCategory)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 focus:outline-none"
                      >
                        {Object.values(ResourceCategory).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Rango Requerido</label>
                      <select
                        value={resMinRole}
                        onChange={(e) => setResMinRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 focus:outline-none"
                      >
                        {Object.values(UserRole).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Imagen de Portada (Foto / URL)</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => resImgFileInputRef.current?.click()}
                        disabled={resImgUploading}
                        className="w-full px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="h-4 w-4 text-indigo-400" />
                        {resImgUploading ? 'Subiendo imagen...' : 'Subir de Galería / Archivos'}
                      </button>
                      <input
                        type="file"
                        ref={resImgFileInputRef}
                        onChange={handleResImgFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <input
                        type="text"
                        value={resImgUrl}
                        onChange={(e) => setResImgUrl(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 font-mono text-xs"
                        placeholder="O ingresa un enlace de imagen (URL)..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Método de descarga</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="downloadMethod"
                          checked={resDownloadMethod === 'link'}
                          onChange={() => setResDownloadMethod('link')}
                          className="text-indigo-600 focus:ring-0 focus:outline-none"
                        />
                        <span>Enlace Externo</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="downloadMethod"
                          checked={resDownloadMethod === 'file'}
                          onChange={() => setResDownloadMethod('file')}
                          className="text-indigo-600 focus:ring-0 focus:outline-none"
                        />
                        <span>Subir Archivo Directo</span>
                      </label>
                    </div>
                  </div>

                  {resDownloadMethod === 'link' ? (
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Enlace de descarga</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                          <Link className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          required={resDownloadMethod === 'link'}
                          value={resDownloadUrl}
                          onChange={(e) => setResDownloadUrl(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 font-mono"
                          placeholder="https://mega.nz/file/..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Subir Archivo</label>
                      <div className="border border-dashed border-slate-800 bg-slate-950 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-900 transition" onClick={() => document.getElementById('resFileInput')?.click()}>
                        <Upload className="h-5 w-5 mx-auto text-slate-500 mb-1" />
                        <span className="block text-slate-400 text-xs">
                          {resFileName ? `Seleccionado: ${resFileName}` : 'Arrastra o haz click para seleccionar archivo'}
                        </span>
                        <input
                          type="file"
                          id="resFileInput"
                          className="hidden"
                          onChange={handleResourceFileSelect}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800 gap-2">
                <button
                  type="button"
                  onClick={() => setResourceFormOpen(false)}
                  className="bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-300 py-2 px-4 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-xl"
                >
                  Publicar Recurso
                </button>
              </div>
            </form>
          )}

          {/* Resources List Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="px-6 py-3.5">Recurso</th>
                    <th className="px-6 py-3.5">Categoría</th>
                    <th className="px-6 py-3.5">Rango Mínimo</th>
                    <th className="px-6 py-3.5">Método de Descarga</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredResources.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">No hay recursos cargados.</td>
                    </tr>
                  ) : (
                    filteredResources.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-950/30 transition">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img
                            src={r.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80'}
                            alt={r.name}
                            className="h-8 w-12 rounded object-cover bg-slate-950 border border-slate-800"
                          />
                          <div>
                            <span className="block font-semibold text-slate-200">{r.name}</span>
                            <span className="block text-[9px] font-mono text-slate-500">Agregado: {new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-slate-400">{r.category}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-indigo-400">
                          {r.minRole}
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px]">
                          {r.downloadMethod === 'file' ? 'Direct File Upload' : 'External URL'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {isOwnerOrCoOwner && (
                              <button
                                onClick={() => handleOpenResourceEdit(r)}
                                className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                                title="Editar"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {isOwnerOrCoOwner && (
                              <button
                                onClick={() => handleDeleteResource(r.id)}
                                className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/30 text-red-400 hover:text-white rounded-lg transition"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: GESTIÓN DE STREAMING */}
      {activeSubTab === 'streaming' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={streamingSearch}
                onChange={(e) => setStreamingSearch(e.target.value)}
                placeholder="Buscar por plataforma, tipo, descripción..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none"
              />
            </div>
            <button
              onClick={handleOpenStreamingCreate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-xl transition"
            >
              <Plus className="h-4 w-4" /> Nueva Publicación Streaming
            </button>
          </div>

          {/* Form Streaming create/edit */}
          {streamingFormOpen && (
            <form onSubmit={handleSaveStreaming} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider">
                  {editingStreaming ? `Editar Publicación: ${editingStreaming.platform}` : 'Nueva Publicación de Streaming Gratis'}
                </h3>
                <button type="button" onClick={() => setStreamingFormOpen(false)} className="p-1 hover:bg-slate-850 rounded">
                  <X className="h-4 w-4 text-slate-500 hover:text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Plataforma</label>
                    <input
                      type="text"
                      required
                      value={streamPlatform}
                      onChange={(e) => setStreamPlatform(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100"
                      placeholder="p.ej. Netflix, Spotify, Disney+"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Correo / Usuario de Acceso</label>
                    <input
                      type="text"
                      required
                      value={streamEmail}
                      onChange={(e) => setStreamEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 font-mono"
                      placeholder="acceso@netflixcomunidad.com"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Contraseña de Acceso</label>
                    <input
                      type="text"
                      required
                      value={streamPassword}
                      onChange={(e) => setStreamPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 font-mono"
                      placeholder="ClaveSecreta123"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Descripción corta</label>
                    <textarea
                      required
                      rows={3}
                      value={streamDesc}
                      onChange={(e) => setStreamDesc(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 resize-none text-sm"
                      placeholder="Reglas de uso, duración, perfiles permitidos..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Imagen de Portada (Foto / URL)</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => streamImgFileInputRef.current?.click()}
                        disabled={streamImgUploading}
                        className="w-full px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="h-4 w-4 text-indigo-400" />
                        {streamImgUploading ? 'Subiendo imagen...' : 'Subir de Galería / Archivos'}
                      </button>
                      <input
                        type="file"
                        ref={streamImgFileInputRef}
                        onChange={handleStreamImgFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <input
                        type="text"
                        value={streamImgUrl}
                        onChange={(e) => setStreamImgUrl(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 font-mono text-xs"
                        placeholder="O ingresa un enlace de imagen (URL)..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold uppercase tracking-wider mb-2">Rango Mínimo para ver credenciales</label>
                    <select
                      value={streamMinRole}
                      onChange={(e) => setStreamMinRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 focus:outline-none"
                    >
                      {Object.values(UserRole).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800 gap-2">
                <button
                  type="button"
                  onClick={() => setStreamingFormOpen(false)}
                  className="bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-300 py-2 px-4 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-xl"
                >
                  Publicar Cuenta
                </button>
              </div>
            </form>
          )}

          {/* Streaming Table List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="px-6 py-3.5">Plataforma</th>
                    <th className="px-6 py-3.5">Rango requerido</th>
                    <th className="px-6 py-3.5 font-mono">Credenciales (Admin)</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredStreaming.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500">No hay publicaciones de streaming cargadas.</td>
                    </tr>
                  ) : (
                    filteredStreaming.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-950/30 transition">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img
                            src={s.imageUrl || 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=500&q=80'}
                            alt={s.platform}
                            className="h-8 w-12 rounded object-cover bg-slate-950 border border-slate-800"
                          />
                          <div>
                            <span className="block font-semibold text-slate-200">{s.platform}</span>
                            <span className="block text-[9px] text-slate-500 font-mono">Agregado: {new Date(s.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-pink-400">
                          {s.minRole}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">
                          <div>User: {s.email}</div>
                          <div>Pass: {s.password}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenStreamingEdit(s)}
                              className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                              title="Editar"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStreaming(s.id)}
                              className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/30 text-red-400 hover:text-white rounded-lg transition"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: AUDITORÍA DE CAMBIOS (LOGS) */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-400" /> Registro Completo de Auditoría y Seguridad
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Últimas 500 acciones registradas</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase sticky top-0 z-10">
                    <th className="px-6 py-3.5">Fecha</th>
                    <th className="px-6 py-3.5">Usuario</th>
                    <th className="px-6 py-3.5">Acción</th>
                    <th className="px-6 py-3.5">Detalles</th>
                    <th className="px-6 py-3.5 font-mono text-right">Dirección IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 text-xs">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">No hay registros de actividad disponibles.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-950/20 transition font-mono text-[11px]">
                        <td className="px-6 py-3 text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-indigo-400">
                          {log.userEmail || 'Anónimo'}
                        </td>
                        <td className="px-6 py-3 font-semibold text-slate-200">
                          {log.action}
                        </td>
                        <td className="px-6 py-3 text-slate-400 max-w-sm truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 text-[10px]">
                          {log.ip || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: LOGS DE DESCARGAS */}
      {activeSubTab === 'downloads' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Download className="h-4 w-4 text-indigo-400" /> Registro y Logs de Descargas
              </h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
                Historial automático de descargas de recursos premium
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={fetchDownloadLogs}
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
                title="Actualizar Logs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Actualizar</span>
              </button>

              <button
                onClick={exportLogsToCSV}
                disabled={downloadLogs.length === 0}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-xl text-xs transition shadow shadow-indigo-600/10"
              >
                <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-850 text-xs">
            {/* Search Input */}
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

            {/* Category Dropdown */}
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

            {/* Status Dropdown */}
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

            {/* Sort order */}
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

          {/* Download Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase sticky top-0 z-10">
                    <th className="px-6 py-3.5">Fecha y Hora</th>
                    <th className="px-6 py-3.5">Usuario</th>
                    <th className="px-6 py-3.5">Recurso / Categoría</th>
                    <th className="px-6 py-3.5 font-mono">IP Address</th>
                    <th className="px-6 py-3.5">Navegador / Sistema</th>
                    <th className="px-6 py-3.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 text-xs">
                  {dlLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 font-mono text-[11px]">
                        Cargando logs de descargas...
                      </td>
                    </tr>
                  ) : downloadLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        No hay registros de descargas que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    downloadLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-950/20 transition text-[11px]">
                        <td className="px-6 py-3.5 font-mono text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="block font-semibold text-slate-200">{log.username}</span>
                          <span className="block text-[10px] text-slate-500 font-mono">{log.userEmail}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="block font-semibold text-indigo-400">{log.resourceName}</span>
                          <span className="inline-block mt-0.5 px-1.5 py-px rounded bg-slate-950 border border-slate-850 text-[8px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: CÓDIGOS CANJEABLES */}
      {activeSubTab === 'codes' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Gift className="h-4 w-4 text-indigo-400" /> Sistema de Códigos Canjeables
              </h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
                Crea, pausa o elimina códigos promocionales para asignación temporal de rangos
              </p>
            </div>
            
            <button
              onClick={fetchPromoCodes}
              disabled={codesLoading}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-medium self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${codesLoading ? 'animate-spin' : ''}`} />
              <span>{codesLoading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Code Form */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
              <h4 className="font-display font-bold text-slate-200 text-xs uppercase tracking-wider">Crear Nuevo Código</h4>
              
              <form onSubmit={handleCreateCode} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Código (Dejar vacío para auto-generar)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="E.G. NERVOX-PREMIUM"
                      value={newCodeVal}
                      onChange={(e) => setNewCodeVal(e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-xs font-mono uppercase focus:border-indigo-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
                        setNewCodeVal(`LUNATIC-${rand}`);
                      }}
                      className="px-3 py-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-mono transition cursor-pointer"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Rango / Rol a Otorgar</label>
                  <select
                    value={newCodeRole}
                    onChange={(e) => setNewCodeRole(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 text-xs focus:border-indigo-500 focus:outline-none transition"
                  >
                    {Object.values(UserRole).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Duración</label>
                  <div className="flex gap-2">
                    {durationUnit !== 'Permanente' && (
                      <input
                        type="number"
                        min="1"
                        required
                        value={durationValue}
                        onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value)))}
                        className="w-1/3 px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-xs font-mono focus:border-indigo-500 focus:outline-none transition"
                        placeholder="Ej. 30"
                      />
                    )}
                    <select
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value)}
                      className={`px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 text-xs focus:border-indigo-500 focus:outline-none transition ${
                        durationUnit === 'Permanente' ? 'w-full' : 'flex-1'
                      }`}
                    >
                      <option value="s">s (Segundos)</option>
                      <option value="m">m (Minutos)</option>
                      <option value="h">h (Horas)</option>
                      <option value="d">d (Días)</option>
                      <option value="Permanente">Permanente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Usos Máximos</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-xs font-mono focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Fecha Expiración Código (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={newCodeExpiresAt}
                    onChange={(e) => setNewCodeExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-xs font-mono focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Crear Código
                </button>
              </form>
            </div>

            {/* List and Redeem History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active / Inactive Codes List */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                  <h4 className="font-display font-bold text-slate-200 text-xs uppercase tracking-wider">Códigos Disponibles ({promoCodes.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/20 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                        <th className="px-5 py-3">Código</th>
                        <th className="px-5 py-3">Rol Otorgado</th>
                        <th className="px-5 py-3">Duración</th>
                        <th className="px-5 py-3 text-center">Usos</th>
                        <th className="px-5 py-3">Expiración</th>
                        <th className="px-5 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300 text-[11px] font-mono">
                      {promoCodes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-500">No hay códigos creados todavía.</td>
                        </tr>
                      ) : (
                        promoCodes.map((c) => {
                          const isExpired = c.expiresAt && new Date() > new Date(c.expiresAt);
                          const isLimitReached = c.currentUses >= c.maxUses;
                          return (
                            <tr key={c.id} className="hover:bg-slate-950/10 transition">
                              <td className="px-5 py-3 font-bold text-indigo-400 select-all truncate max-w-[120px]" title={c.code}>
                                {c.code}
                              </td>
                              <td className="px-5 py-3">
                                <span className="inline-flex px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-900/50 text-indigo-300 font-sans font-semibold text-[10px]">
                                  {c.role}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-slate-400">
                                {c.duration === 'Permanent' ? 'Permanente' : c.duration}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className={isLimitReached ? 'text-red-400 font-bold' : 'text-slate-200'}>
                                  {c.currentUses}/{c.maxUses}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-[10px] text-slate-500">
                                {c.expiresAt ? (
                                  <span className={isExpired ? 'text-red-500/80 font-semibold line-through' : ''}>
                                    {new Date(c.expiresAt).toLocaleDateString()}
                                  </span>
                                ) : 'Ninguna'}
                              </td>
                              <td className="px-5 py-3 text-right space-x-1.5">
                                <button
                                  onClick={() => handleToggleCode(c.id)}
                                  className={`px-2 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                                    c.isActive 
                                      ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' 
                                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                  }`}
                                >
                                  {c.isActive ? 'Pausar' : 'Activar'}
                                </button>
                                <button
                                  onClick={() => handleDeleteCode(c.id)}
                                  className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Redeem History */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50">
                  <h4 className="font-display font-bold text-slate-200 text-xs uppercase tracking-wider">Historial de Canjes ({promoCodeRedeems.length})</h4>
                </div>
                <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/20 text-slate-500 font-mono text-[9px] uppercase tracking-wider sticky top-0 backdrop-blur">
                        <th className="px-5 py-2.5">Fecha</th>
                        <th className="px-5 py-2.5">Código</th>
                        <th className="px-5 py-2.5">Usuario</th>
                        <th className="px-5 py-2.5">Rol Obtenido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300 text-[11px] font-mono">
                      {promoCodeRedeems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-500">Ningún código canjeado todavía.</td>
                        </tr>
                      ) : (
                        promoCodeRedeems.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-950/10 transition">
                            <td className="px-5 py-2.5 text-slate-500 text-[10px]">
                              {new Date(r.redeemedAt).toLocaleString()}
                            </td>
                            <td className="px-5 py-2.5 text-indigo-400 font-bold">{r.code}</td>
                            <td className="px-5 py-2.5 text-slate-300">{r.username}</td>
                            <td className="px-5 py-2.5 text-slate-400">{r.role}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: GESTIÓN DE APORTES */}
      {activeSubTab === 'donations' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Gift className="h-4 w-4 text-indigo-400" /> Moderación de Aportes
              </h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
                Revisa los aportes enviados por los usuarios y publícalos automáticamente como Recursos
              </p>
            </div>
            
            <button
              onClick={fetchAdminDonations}
              disabled={donationsLoading}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-medium self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${donationsLoading ? 'animate-spin' : ''}`} />
              <span>{donationsLoading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {adminDonations.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
                No hay aportes para moderar en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminDonations.map((d) => {
                  const isReviewing = reviewingDonationId === d.id;
                  return (
                    <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full relative">
                      {d.imageUrl && (
                        <div className="h-40 w-full relative overflow-hidden bg-slate-950">
                          <img src={d.imageUrl} alt={d.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider">
                              {d.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              d.status === 'Pendiente' ? 'bg-yellow-500/10 text-yellow-400' :
                              d.status === 'Aprobada' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {d.status}
                            </span>
                          </div>

                          <h4 className="font-display font-bold text-slate-100 text-sm leading-snug">{d.title}</h4>
                          <p className="text-slate-400 text-xs line-clamp-3">{d.description}</p>
                          
                          <div className="pt-2 border-t border-slate-800/60 text-[11px] font-mono space-y-1 text-slate-500">
                            <p>Enviado por: <span className="text-slate-300 font-sans">{d.username}</span></p>
                            <p>Email: <span className="text-indigo-400">{d.userEmail}</span></p>
                            <p>Método: <span className="text-slate-400 uppercase">{d.downloadMethod}</span></p>
                            {d.fileName && <p className="truncate block">Archivo: <span className="text-slate-400">{d.fileName}</span></p>}
                            {d.downloadUrl && (
                              <p className="truncate block">
                                URL: <a href={d.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline select-all">{d.downloadUrl}</a>
                              </p>
                            )}
                            {d.observation && (
                              <p className="mt-2 p-2 bg-slate-950/40 rounded border border-slate-800/40 text-[10px] text-amber-500 italic">
                                Nota: {d.observation}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-850">
                          {isReviewing ? (
                            <div className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850 animate-fadeIn text-xs">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-500 uppercase font-mono">Decisión</label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setDonationReviewStatus('Aprobada')}
                                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition cursor-pointer ${
                                      donationReviewStatus === 'Aprobada' ? 'bg-green-600 text-white' : 'bg-slate-900 text-slate-400'
                                    }`}
                                  >
                                    Aprobar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDonationReviewStatus('Rechazada')}
                                    className={`flex-1 py-1 px-2 rounded-lg font-semibold transition cursor-pointer ${
                                      donationReviewStatus === 'Rechazada' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400'
                                    }`}
                                  >
                                    Rechazar
                                  </button>
                                </div>
                              </div>

                              {donationReviewStatus === 'Aprobada' && (
                                <div className="space-y-1">
                                  <label className="block text-[10px] text-slate-500 uppercase font-mono">Rol mínimo de descarga</label>
                                  <select
                                    value={donationReviewMinRole}
                                    onChange={(e) => setDonationReviewMinRole(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                                  >
                                    {Object.values(UserRole).map((r) => (
                                      <option key={r} value={r}>{r}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div className="space-y-1">
                                <label className="block text-[10px] text-slate-500 uppercase font-mono">Observación / Motivo</label>
                                <textarea
                                  placeholder="Nota para el usuario o motivo de rechazo..."
                                  value={donationReviewObservation}
                                  onChange={(e) => setDonationReviewObservation(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs h-16 focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReviewDonation(d.id)}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 rounded-lg text-[11px] transition cursor-pointer"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReviewingDonationId(null)}
                                  className="px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded-lg text-[11px] transition cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {d.status === 'Pendiente' && (
                                <button
                                  onClick={() => {
                                    setReviewingDonationId(d.id);
                                    setDonationReviewStatus('Aprobada');
                                  }}
                                  className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-semibold py-1.5 rounded-xl text-xs transition cursor-pointer"
                                >
                                  Moderar Aporte
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteDonation(d.id)}
                                className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/10 rounded-xl transition cursor-pointer"
                                title="Eliminar aporte"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INSPECTOR DETAILS MODAL POPUP */}
      {inspectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 relative purple-blue-glow">
            <button
              onClick={() => setInspectedUser(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center pb-4 border-b border-slate-800">
              <img
                src={inspectedUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(inspectedUser.username)}`}
                alt={inspectedUser.username}
                className="h-20 w-20 rounded-2xl mx-auto bg-slate-950 border border-slate-800 object-cover shadow"
              />
              <h4 className="font-display font-bold text-lg text-slate-200 mt-3">{inspectedUser.username}</h4>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {inspectedUser.role}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">ID de Registro</span>
                <span className="font-mono text-slate-300">{inspectedUser.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Correo Electrónico</span>
                <span className="font-mono text-indigo-400 font-semibold">{inspectedUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Fecha de Creación</span>
                <span className="text-slate-300">{new Date(inspectedUser.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Estado de Verificación</span>
                <span className={`font-semibold ${inspectedUser.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {inspectedUser.isVerified ? 'Verificado (Activo)' : 'No Verificado (Bloqueado)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Restricción de acceso</span>
                <span className={`font-semibold ${inspectedUser.isSuspended ? 'text-red-400' : 'text-green-400'}`}>
                  {inspectedUser.isSuspended ? 'SUSPENDIDO (Prohibido entrar)' : 'Sin Sanciones (Activo)'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setInspectedUser(null)}
                className="w-full bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-300 py-2.5 rounded-xl font-medium"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
