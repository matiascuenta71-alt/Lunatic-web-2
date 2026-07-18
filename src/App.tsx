import React, { useState, useEffect } from 'react';
import {
  Home,
  FileCode,
  Tv,
  Vote,
  Megaphone,
  Shield,
  User,
  LogOut,
  Search,
  Settings,
  Grid,
  TrendingUp,
  AlertCircle,
  Menu,
  X,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Crown,
  Gift,
  MessageSquare,
  ClipboardList,
  Heart,
  History,
  Star,
  MessageCircle,
  Upload,
  Bot,
  Bell,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, ResourceCategory, ROLE_HIERARCHY, type AppNotification } from './types.js';

// Import our modular custom components
import AuthScreens from './components/AuthScreens.tsx';
import ProfileView from './components/ProfileView.tsx';
import ResourceCard from './components/ResourceCard.tsx';
import StreamingCard from './components/StreamingCard.tsx';
import StreamingAddModal from './components/StreamingAddModal.tsx';
import AnnouncementsView from './components/AnnouncementsView.tsx';
import PollsView from './components/PollsView.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import VipAccessView from './components/VipAccessView.tsx';
import GiveawaysEventsView from './components/GiveawaysEventsView.tsx';
import GlobalChat from './components/GlobalChat.tsx';
import ResourceRequestsView from './components/ResourceRequestsView.tsx';
import LogsView from './components/LogsView.tsx';
import SponsorView from './components/SponsorView.tsx';
import ReviewsView from './components/ReviewsView.tsx';
import DonationsView from './components/DonationsView.tsx';
import AiAssistantView from './components/AiAssistantView.tsx';
import lunaticLogo from './assets/images/lunatic_logo_1784202374899.jpg';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

type TabType = 'home' | 'resources' | 'streaming' | 'polls' | 'announcements' | 'vip' | 'events' | 'admin' | 'profile' | 'chat' | 'requests' | 'logs' | 'sponsor' | 'reviews' | 'donations' | 'ai_assistant';

interface TabRendererProps {
  tabKey: TabType;
  user: any;
  token: string | null;
  polls: any[];
  announcements: any[];
  resources: any[];
  streaming: any[];
  publicStats: any;
  globalSearch: string;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchedResources: any[];
  searchedStreaming: any[];
  handleDownloadResource: (resourceId: string) => void;
  fetchPlatformData: () => void;
  handleProfileUpdated: (updatedUser: any) => void;
  setActiveTab: (tab: TabType) => void;
  isStaff: boolean;
  setIsAddStreamingOpen?: (open: boolean) => void;
}

const TabRenderer = React.memo(({
  tabKey,
  user,
  token,
  polls,
  announcements,
  resources,
  streaming,
  publicStats,
  selectedCategory,
  setSelectedCategory,
  searchedResources,
  searchedStreaming,
  handleDownloadResource,
  fetchPlatformData,
  handleProfileUpdated,
  setActiveTab,
  isStaff,
  setIsAddStreamingOpen
}: TabRendererProps) => {
  const [redeemingLunatic, setRedeemingLunatic] = useState(false);
  const [lunaticMsg, setLunaticMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const redeemLunaticCode = async () => {
    if (!token) return;
    setRedeemingLunatic(true);
    setLunaticMsg(null);
    try {
      const res = await fetch('/api/codes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: 'LUNATIC25' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo canjear el código.');
      }
      setLunaticMsg({ type: 'success', text: data.message || '¡Código canjeado con éxito!' });
      handleProfileUpdated(data.user);
      fetchPlatformData();
    } catch (err: any) {
      setLunaticMsg({ type: 'error', text: err.message || 'Ocurrió un error al canjear.' });
    } finally {
      setRedeemingLunatic(false);
    }
  };

  const userLevel = ROLE_HIERARCHY[user?.role as UserRole] || 1;
  const vipLevel = ROLE_HIERARCHY[UserRole.VIP] || 2;
  const alreadyHasVipOrBetter = userLevel >= vipLevel;

  switch (tabKey) {
    case 'home':
      return (
        <div className="space-y-8">
          {/* Hero Board Banner */}
          <div className="rounded-2xl p-8 bg-[#09090b] border border-[#18181b] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group hover:border-[#27272a] transition-all duration-300">
            <div className="space-y-3 z-10 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-display">
                <Sparkles className="h-3 w-3 text-indigo-400" /> Plataforma Privada Lunatic
              </span>
              <h3 className="font-display font-extrabold text-2xl md:text-3xl text-[#f4f4f5] tracking-tight leading-none">
                Bienvenido a <span className="text-indigo-400">Lunatic Community</span>
              </h3>
              <p className="text-zinc-400 text-xs max-w-lg leading-relaxed">
                Un centro de recursos premium privado para plugins, modelos, setups y cuentas gratuitas. Tu rango de acceso es <strong className="text-indigo-300 font-semibold">{user?.role}</strong>.
              </p>
              <button
                onClick={() => setActiveTab('resources')}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition mt-2 shadow shadow-indigo-600/10 cursor-pointer"
              >
                Explorar Recursos Premium
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="w-full md:w-auto grid grid-cols-2 gap-4 shrink-0 z-10">
              <div className="bg-[#030303] p-4 rounded-xl border border-[#18181b] text-center min-w-[110px]">
                <span className="block text-2xl font-bold font-display text-indigo-400">{publicStats.userCount || 1}</span>
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-medium">Miembros</span>
              </div>
              <div className="bg-[#030303] p-4 rounded-xl border border-[#18181b] text-center min-w-[110px]">
                <span className="block text-2xl font-bold font-display text-indigo-400">{publicStats.resourceCount || 0}</span>
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-medium">Recursos</span>
              </div>
            </div>
          </div>

          {/* Promo Code LUNATIC25 Card */}
          <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-950/40 via-slate-900/40 to-[#09090b] border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
            {/* Background glowing decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            
            <div className="flex items-start gap-4 z-10 flex-col sm:flex-row text-center sm:text-left">
              <div className="p-3.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0 mx-auto sm:mx-0">
                <Gift className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h4 className="font-display font-extrabold text-[#f4f4f5] text-base">🎁 Código Promocional VIP Gratis</h4>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    ¡Activo Siempre!
                  </span>
                </div>
                <p className="text-zinc-400 text-xs max-w-xl leading-relaxed">
                  Usa el código promocional de sistema <strong className="text-indigo-400 font-mono font-bold select-all bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/25">LUNATIC25</strong> para activar instantáneamente <strong className="text-white font-semibold">3 días de rango VIP</strong>. Accede a recursos de descarga restringidos y cuentas de streaming exclusivas.
                </p>
                <div className="text-[10px] text-zinc-500">
                  ⚠️ Límite: <strong className="text-zinc-400">1 solo uso por persona</strong>. Si ya lo canjeaste anteriormente, no podrás volver a activarlo.
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto z-10 flex flex-col gap-2 items-center">
              {alreadyHasVipOrBetter ? (
                <div className="w-full text-center md:text-right">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Crown className="h-3.5 w-3.5" /> Ya tienes rango VIP o superior
                  </span>
                </div>
              ) : (
                <>
                  <button
                    disabled={redeemingLunatic}
                    onClick={redeemLunaticCode}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    {redeemingLunatic ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Canjeando...
                      </>
                    ) : (
                      <>
                        Canjear 3 Días VIP Gratis
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </>
              )}
              
              {lunaticMsg && (
                <div className={`mt-2 p-2 px-3 rounded-lg border text-[11px] font-medium text-center w-full ${
                  lunaticMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {lunaticMsg.text}
                </div>
              )}
            </div>
          </div>

          {/* Highlights section: latest resources added */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-400">Últimos Recursos Agregados</h4>
            {publicStats.recentResources && publicStats.recentResources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {publicStats.recentResources.map((res: any) => (
                  <div
                    key={res.id}
                    onClick={() => setActiveTab('resources')}
                    className="bg-[#09090b] border border-[#18181b] rounded-xl p-4 flex gap-4 cursor-pointer hover:border-[#27272a] hover:bg-[#0c0c0e] transition duration-300"
                  >
                    <img
                      referrerPolicy="no-referrer"
                      src={res.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80'}
                      alt={res.name}
                      className="h-12 w-16 rounded-lg object-cover bg-black border border-[#18181b] shrink-0"
                    />
                    <div className="overflow-hidden flex flex-col justify-between py-0.5">
                      <span className="block font-semibold text-xs text-zinc-200 truncate group-hover:text-white">{res.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#030303] text-zinc-400 text-[9px] font-mono px-1.5 py-0.2 rounded border border-[#18181b]">{res.category}</span>
                        <span className="text-[9px] text-indigo-400 font-bold font-mono tracking-wider">{res.minRole}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#09090b] border border-[#18181b] rounded-2xl text-zinc-500 text-xs">
                No hay recursos registrados todavía. Publica uno desde el panel de administración.
              </div>
            )}
          </div>

          {/* Navigation quick tiles (Categories) */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-400">Categorías de la Plataforma</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.values(ResourceCategory).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setActiveTab('resources'); }}
                  className="bg-[#09090b] border border-[#18181b] hover:border-indigo-600/40 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition group cursor-pointer hover:bg-[#0c0c0e]"
                >
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-indigo-400 transition truncate w-full">
                    {cat}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    case 'resources':
      return (
        <div className="space-y-6">
          {/* Category filters row */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#18181b]">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#09090b] border border-[#18181b] text-zinc-400 hover:text-white hover:bg-[#111115]'
              }`}
            >
              Todos ({resources.length})
            </button>
            {Object.values(ResourceCategory).map((cat) => {
              const count = resources.filter(r => r.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#09090b] border border-[#18181b] text-zinc-400 hover:text-white hover:bg-[#111115]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Resources grid */}
          {searchedResources.length === 0 ? (
            <div className="text-center py-20 bg-[#09090b] border border-[#18181b] rounded-2xl text-zinc-500 text-xs">
              Ningún recurso se encuentra publicado en esta categoría o coincide con los filtros.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {searchedResources.map((res) => (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  userRole={user.role}
                  onDownload={handleDownloadResource}
                  isAdmin={false}
                  currentUser={user}
                  token={token}
                />
              ))}
            </div>
          )}
        </div>
      );
    case 'streaming':
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-indigo-300 text-xs leading-relaxed flex items-start gap-2.5 flex-1">
              <ShieldAlert className="h-4 w-4 shrink-0 text-indigo-400" />
              <span>
                <strong>Cuentas de Streaming Gratis:</strong> Estos datos se actualizan periódicamente. Se prohíbe cambiar las contraseñas para evitar suspensiones. Solo los rangos VIP o superiores podrán visualizar la información según la publicación.
              </span>
            </div>

            {(user.role === UserRole.Owner || user.role === UserRole.CoOwner) && setIsAddStreamingOpen && (
              <button
                type="button"
                onClick={() => setIsAddStreamingOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all shrink-0 self-stretch sm:self-auto cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Subir Cuenta Streaming</span>
              </button>
            )}
          </div>

          {searchedStreaming.length === 0 ? (
            <div className="text-center py-20 bg-[#09090b] border border-[#18181b] rounded-2xl text-zinc-500 text-xs">
              No hay cuentas de streaming gratis disponibles en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {searchedStreaming.map((account) => (
                <StreamingCard
                  key={account.id}
                  account={account}
                  userRole={user.role}
                  isAdmin={user.role === UserRole.Owner || user.role === UserRole.CoOwner}
                  onDelete={async (id) => {
                    if (window.confirm('¿Deseas eliminar esta publicación de streaming?')) {
                      try {
                        const res = await fetch(`/api/admin/streaming/${id}`, {
                          method: 'DELETE',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                          fetchPlatformData();
                        } else {
                          const data = await res.json();
                          alert(data.error || 'Error al eliminar la cuenta');
                        }
                      } catch (err) {
                        console.error('Error deleting streaming:', err);
                      }
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      );
    case 'polls':
      return (
        <PollsView
          polls={polls}
          userRole={user.role}
          userId={user.id}
          token={token!}
          onPollCreated={fetchPlatformData}
          onPollAction={fetchPlatformData}
        />
      );
    case 'announcements':
      return (
        <AnnouncementsView
          announcements={announcements}
          userRole={user.role}
          token={token!}
          onAnnouncementCreated={fetchPlatformData}
          onAnnouncementDeleted={fetchPlatformData}
        />
      );
    case 'vip':
      return <VipAccessView />;
    case 'events':
      return <GiveawaysEventsView user={user} token={token!} />;
    case 'profile':
      return (
        <ProfileView
          user={user}
          onProfileUpdate={handleProfileUpdated}
          token={token!}
        />
      );
    case 'chat':
      return <GlobalChat currentUser={user} token={token!} />;
    case 'ai_assistant':
      return <AiAssistantView currentUser={user} token={token!} />;
    case 'requests':
      return <ResourceRequestsView currentUser={user} token={token!} />;
    case 'admin':
      return isStaff ? (
        <AdminPanel
          token={token!}
          userRole={user.role}
          users={publicStats.users || []}
          resources={resources}
          streaming={streaming}
          polls={polls}
          logs={publicStats.logs || []}
          onRefreshData={fetchPlatformData}
        />
      ) : null;
    case 'logs':
      return isStaff ? (
        <LogsView
          token={token!}
          userRole={user.role}
          systemLogs={publicStats.logs || []}
          onRefreshData={fetchPlatformData}
        />
      ) : null;
    case 'sponsor':
      return <SponsorView currentUser={user} token={token!} />;
    case 'donations':
      return <DonationsView currentUser={user} token={token!} />;
    case 'reviews':
      return <ReviewsView currentUser={user} token={token!} />;
    default:
      return null;
  }
});

const getTargetTabForNotification = (type: string): TabType => {
  switch (type) {
    case 'announcement': return 'announcements';
    case 'poll': return 'polls';
    case 'giveaway': return 'events';
    case 'resource':
    case 'comment':
      return 'resources';
    case 'streaming': return 'streaming';
    case 'review': return 'reviews';
    case 'donation': return 'donations';
    case 'request': return 'requests';
    default: return 'home';
  }
};

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isAddStreamingOpen, setIsAddStreamingOpen] = useState(false);

  // Data State
  const [resources, setResources] = useState<any[]>([]);
  const [streaming, setStreaming] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [publicStats, setPublicStats] = useState<any>({
    userCount: 0,
    resourceCount: 0,
    streamingCount: 0,
    activePollCount: 0,
    recentResources: []
  });

  // Filters inside views
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Mark all notifications of a type as read
  const markNotificationsAsRead = async (type: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.type === type ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  // Mark single as read
  const markSingleAsRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Error marking single notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ all: true })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Get unread count for a specific tab
  const getUnreadCount = (tab: TabType): number => {
    const unread = notifications.filter(n => !n.isRead);
    switch (tab) {
      case 'announcements':
        return unread.filter(n => n.type === 'announcement').length;
      case 'polls':
        return unread.filter(n => n.type === 'poll').length;
      case 'events':
        return unread.filter(n => n.type === 'giveaway').length;
      case 'resources':
        return unread.filter(n => n.type === 'resource' || n.type === 'comment').length;
      case 'streaming':
        return unread.filter(n => n.type === 'streaming').length;
      case 'reviews':
        return unread.filter(n => n.type === 'review').length;
      case 'donations':
        return unread.filter(n => n.type === 'donation').length;
      case 'requests':
        return unread.filter(n => n.type === 'request').length;
      default:
        return 0;
    }
  };

  // Custom tab change handler to clear notification badges
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);

    if (tab === 'announcements') markNotificationsAsRead('announcement');
    else if (tab === 'polls') markNotificationsAsRead('poll');
    else if (tab === 'events') markNotificationsAsRead('giveaway');
    else if (tab === 'resources') {
      markNotificationsAsRead('resource');
      markNotificationsAsRead('comment');
    }
    else if (tab === 'streaming') markNotificationsAsRead('streaming');
    else if (tab === 'reviews') markNotificationsAsRead('review');
    else if (tab === 'donations') markNotificationsAsRead('donation');
    else if (tab === 'requests') markNotificationsAsRead('request');
  };

  // Set up WebSocket for Notifications with Polling Fallback
  useEffect(() => {
    if (!token) return;

    fetchNotifications();

    let ws: WebSocket | null = null;
    let pingInterval: any;
    let reconnectTimer: any;
    let isClosed = false;

    const connectWS = () => {
      if (isClosed) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${window.location.host}/api/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!ws) return;
          ws.send(JSON.stringify({ type: 'auth', token }));

          pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
              const newNotif = data.notification;
              setNotifications(prev => {
                if (prev.some(n => n.id === newNotif.id)) return prev;
                return [newNotif, ...prev];
              });
              // Refresh underlying datasets dynamically
              fetchPlatformData();
            }
          } catch (err) {
            console.error('Error handling WebSocket message in App.tsx:', err);
          }
        };

        ws.onerror = () => {
          // Handle WebSocket error gracefully to avoid uncaught console errors
          console.warn('Canal de tiempo real (WebSocket) no disponible temporalmente. Usando respaldo de sondeo.');
        };

        ws.onclose = () => {
          clearInterval(pingInterval);
          // Try reconnecting in 10 seconds if not unmounted
          if (!isClosed) {
            reconnectTimer = setTimeout(connectWS, 10000);
          }
        };
      } catch (err) {
        console.warn('Fallo al inicializar WebSocket, usando respaldo de sondeo.', err);
      }
    };

    connectWS();

    // Polling fallback: fetch notifications every 20 seconds
    const fallbackInterval = setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        fetchNotifications();
      }
    }, 20000);

    return () => {
      isClosed = true;
      if (ws) {
        ws.close();
      }
      clearInterval(pingInterval);
      clearInterval(fallbackInterval);
      clearTimeout(reconnectTimer);
    };
  }, [token]);

  // Load public data on mount
  const fetchPublicStats = async () => {
    try {
      const res = await fetch('/api/public/stats');
      if (res.ok) {
        const data = await res.json();
        setPublicStats(data);
      }
    } catch (err) {
      console.error('Error fetching public stats:', err);
    }
  };

  // Check active user session on load/re-render via secure HttpOnly cookie or localStorage fallback
  const checkSession = async () => {
    try {
      const savedToken = localStorage.getItem('lunatic_token');
      const headers: Record<string, string> = {};
      if (savedToken) {
        headers['Authorization'] = `Bearer ${savedToken}`;
      }
      
      const res = await fetch('/api/auth/me', { headers });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        const newToken = data.token || savedToken;
        setToken(newToken);
        if (newToken) {
          localStorage.setItem('lunatic_token', newToken);
        }
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('lunatic_token');
      }
    } catch (err) {
      console.error('Session validation failed:', err);
      setToken(null);
      setUser(null);
      localStorage.removeItem('lunatic_token');
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch logged-in platform datasets
  const fetchPlatformData = async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Parallel data loading
      const [resResources, resStreaming, resPolls, resAnnouncements] = await Promise.all([
        fetch('/api/resources', { headers }),
        fetch('/api/streaming', { headers }),
        fetch('/api/polls', { headers }),
        fetch('/api/announcements', { headers })
      ]);

      if (resResources.ok) {
        const data = await resResources.json();
        setResources(data.resources || []);
      }
      if (resStreaming.ok) {
        const data = await resStreaming.json();
        setStreaming(data.streaming || []);
      }
      if (resPolls.ok) {
        const data = await resPolls.json();
        setPolls(data.polls || []);
      }
      if (resAnnouncements.ok) {
        const data = await resAnnouncements.json();
        setAnnouncements(data.announcements || []);
      }

      // If Owner or Co-owner, load administrator databases
      if (user && (user.role === UserRole.Owner || user.role === UserRole.CoOwner)) {
        const [resUsers, resLogs] = await Promise.all([
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/logs', { headers })
        ]);

        if (resUsers.ok && resLogs.ok) {
          const dataUsers = await resUsers.json();
          const dataLogs = await resLogs.json();
          // We pass users/logs data directly to the AdminPanel
          setPublicStats(prev => ({
            ...prev,
            users: dataUsers.users || [],
            logs: dataLogs.logs || []
          }));
        }
      }
    } catch (err) {
      console.error('Error loading platform datasets:', err);
    }
  };

  useEffect(() => {
    fetchPublicStats();
    checkSession();
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchPlatformData();
    }
  }, [user, token, activeTab]);

  const handleLoginSuccess = (newToken: string, loggedInUser: any) => {
    localStorage.setItem('lunatic_token', newToken);
    setToken(newToken);
    setUser(loggedInUser);
    setActiveTab('home');
  };

  const handleLogout = async () => {
    try {
      const savedToken = localStorage.getItem('lunatic_token');
      const headers = savedToken ? { 'Authorization': `Bearer ${savedToken}` } : undefined;
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('lunatic_token');
    setToken(null);
    setUser(null);
    setActiveTab('home');
  };

  const handleProfileUpdated = (updatedUser: any) => {
    setUser(updatedUser);
  };

  const handleDownloadResource = async (resourceId: string) => {
    try {
      await fetch(`/api/resources/${resourceId}/download`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Refresh to log download activity
      fetchPlatformData();
    } catch (err) {
      console.error('Download tracking failed:', err);
    }
  };

  // Checks hierarchical access
  const isAuthorized = (minRole: UserRole) => {
    if (!user) return false;
    const userLevel = ROLE_HIERARCHY[user.role] || 1;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 1;
    return userLevel >= requiredLevel;
  };

  const isAdmin = user && (user.role === UserRole.Owner || user.role === UserRole.CoOwner);
  const isStaff = user && (user.role === UserRole.Owner || user.role === UserRole.CoOwner || user.role === UserRole.Recursos);

  // Global search filters logic
  const searchedResources = resources.filter((item) => {
    const s = globalSearch.toLowerCase();
    const matchesQuery = item.name.toLowerCase().includes(s) || item.description.toLowerCase().includes(s) || item.category.toLowerCase().includes(s);
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const searchedStreaming = streaming.filter((item) => {
    const s = globalSearch.toLowerCase();
    return item.platform.toLowerCase().includes(s) || (item.accountType || '').toLowerCase().includes(s) || item.description.toLowerCase().includes(s);
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-xs text-slate-500 font-mono tracking-widest">CARGANDO LUNATIC PLATFORM...</p>
        </div>
      </div>
    );
  }

  // If user is unauthenticated, show Auth Screen (Login/Register)
  if (!user || !token) {
    return <AuthScreens onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="lunatic-app" className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col md:flex-row relative">
      {/* Background radial highlight */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-950/10 via-transparent to-transparent pointer-events-none" />

      {/* MOBILE HEADER BAR */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img
            src={lunaticLogo}
            alt="LUNATIC logo"
            className="h-7 w-7 rounded-lg object-cover border border-cyan-500/30 shadow-[0_0_8px_rgba(8,145,178,0.2)]"
            referrerPolicy="no-referrer"
          />
          <h1 className="font-display font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase leading-none">
            LUNATIC
          </h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION SHELL */}
      <aside className={`w-64 sidebar-gradient border-r border-slate-800 flex flex-col justify-between fixed md:sticky top-[61px] md:top-0 h-[calc(100vh-61px)] md:h-screen z-30 transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Sidebar Header (Hidden on Mobile) */}
        <div className="p-6 border-b border-slate-800/80 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 bg-[#06060c] border border-cyan-500/30 rounded-xl overflow-hidden shadow-md">
              <img
                src={lunaticLogo}
                alt="Lunatic Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-sm tracking-wider text-slate-100 uppercase leading-none">
                LUNATIC
              </h1>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mt-0.5">COMMUNITY</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 p-4 space-y-5 overflow-y-auto mt-4">
          {/* 📌 INFORMACIÓN */}
          <div className="space-y-1">
            <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
              <span>📌</span> INFORMACIÓN
            </span>
            <button
              onClick={() => handleTabChange('home')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'home' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>🏠・Inicio</span>
            </button>
            <button
              onClick={() => handleTabChange('announcements')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'announcements' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Megaphone className="h-4 w-4" />
              <span>📢・Anuncios</span>
              {getUnreadCount('announcements') > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  +{getUnreadCount('announcements')}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('polls')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'polls' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Vote className="h-4 w-4" />
              <span>🗳️・Votaciones</span>
              {getUnreadCount('polls') > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  +{getUnreadCount('polls')}
                </span>
              )}
            </button>
          </div>

          {/* 📦 RECURSOS */}
          <div className="space-y-1">
            <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
              <span>📦</span> RECURSOS
            </span>
            <button
              onClick={() => handleTabChange('resources')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'resources' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <FileCode className="h-4 w-4" />
              <span>💎・Recursos Premium</span>
              {getUnreadCount('resources') > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  +{getUnreadCount('resources')}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('requests')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <ClipboardList className="h-4 w-4 text-emerald-400" />
              <span>📝・Solicitar Recursos</span>
              {getUnreadCount('requests') > 0 && (
                <span className="ml-auto bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md animate-pulse">
                  NUEVO
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('donations')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'donations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Upload className="h-4 w-4 text-cyan-400" />
              <span>📥・Donar Recursos</span>
              {getUnreadCount('donations') > 0 && (
                <span className={`ml-auto text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md animate-pulse ${isStaff ? 'bg-rose-500 rounded-full text-[10px]' : 'bg-emerald-500'}`}>
                  {isStaff ? `+${getUnreadCount('donations')}` : 'NUEVO'}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('vip')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'vip' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Crown className="h-4 w-4 text-amber-400" />
              <span>⭐・Accesos VIP</span>
            </button>
          </div>

          {/* 💬 COMUNIDAD */}
          <div className="space-y-1">
            <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
              <span>💬</span> COMUNIDAD
            </span>
            <button
              onClick={() => handleTabChange('chat')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-pink-400 animate-pulse" />
              <span>🌍・Chat Global</span>
            </button>
            <button
              onClick={() => handleTabChange('ai_assistant')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'ai_assistant' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Bot className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span>🤖・Asistente IA</span>
            </button>
            <button
              onClick={() => handleTabChange('reviews')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'reviews' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <MessageCircle className="h-4 w-4 text-teal-400" />
              <span>💭・Canal de Reseñas</span>
              {getUnreadCount('reviews') > 0 && (
                <span className={`ml-auto text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md animate-pulse ${isStaff ? 'bg-rose-500 rounded-full text-[10px]' : 'bg-emerald-500'}`}>
                  {isStaff ? `+${getUnreadCount('reviews')}` : 'NUEVO'}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('events')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'events' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Gift className="h-4 w-4 text-purple-400" />
              <span>🎉・Sorteos & Eventos</span>
              {getUnreadCount('events') > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  +{getUnreadCount('events')}
                </span>
              )}
            </button>
          </div>

          {/* 🎬 ENTRETENIMIENTO */}
          <div className="space-y-1">
            <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
              <span>🎬</span> ENTRETENIMIENTO
            </span>
            <button
              onClick={() => handleTabChange('streaming')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'streaming' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Tv className="h-4 w-4 text-cyan-400" />
              <span>📺・Streaming Gratis</span>
              {getUnreadCount('streaming') > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  +{getUnreadCount('streaming')}
                </span>
              )}
            </button>
          </div>

          {/* 🤝 PATROCINADORES */}
          <div className="space-y-1">
            <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
              <span>🤝</span> PATROCINADORES
            </span>
            <button
              onClick={() => handleTabChange('sponsor')}
              className={`w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition border ${
                activeTab === 'sponsor' 
                  ? 'bg-red-950/30 border-red-500/40 text-red-400 shadow-lg shadow-red-500/5' 
                  : 'border-transparent text-slate-400 hover:text-red-400 hover:bg-red-950/10 hover:border-red-950/20'
              }`}
            >
              <Heart className={`h-4 w-4 ${activeTab === 'sponsor' ? 'text-red-500 animate-pulse' : 'text-red-650'}`} />
              <span>❤️・Nervox Hosting</span>
            </button>
          </div>

          {/* 👤 CUENTA */}
          <div className="space-y-1">
            <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-1.5">
              <span>👤</span> CUENTA
            </span>
            <button
              onClick={() => handleTabChange('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <User className="h-4 w-4 text-slate-400" />
              <span>👤・Mi Perfil</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide text-slate-400 hover:text-red-400 hover:bg-red-950/10 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-red-400" />
              <span>🚪・Cerrar Sesión</span>
            </button>
          </div>

          {/* 🛡️ ADMINISTRACIÓN */}
          {isStaff && (
            <div className="pt-3 border-t border-slate-800/60 mt-3 space-y-1">
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest px-3 mb-1.5 flex items-center gap-1.5">
                <span>🛡️</span> ADMINISTRACIÓN
              </span>
              <button
                onClick={() => handleTabChange('admin')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                  activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Shield className="h-4 w-4 text-indigo-400" />
                <span>Panel Administrativo</span>
              </button>
              <button
                onClick={() => handleTabChange('logs')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition ${
                  activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <History className="h-4 w-4 text-pink-400" />
                <span>Canal de Logs</span>
              </button>
            </div>
          )}
        </nav>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div
            onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900/50 cursor-pointer transition"
          >
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`}
              alt={user.username}
              className="h-9 w-9 rounded-lg bg-slate-950 border border-slate-850 object-cover"
            />
            <div className="overflow-hidden">
              <span className="block font-semibold text-xs text-slate-200 truncate">{user.username}</span>
              <span className="block text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wide">{user.role}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN SCREEN AREA */}
      <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-full">
        {/* Topbar: Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-100 capitalize">
              {activeTab === 'home' 
                ? 'Inicio / Dashboard' 
                : activeTab === 'admin' 
                ? 'Panel de Control' 
                : activeTab === 'vip' 
                ? 'Accesos VIP' 
                : activeTab === 'events'
                ? 'Sorteos & Eventos'
                : activeTab === 'polls'
                ? 'Votaciones'
                : activeTab === 'announcements'
                ? 'Anuncios'
                : activeTab === 'chat'
                ? 'Chat Global'
                : activeTab === 'requests'
                ? 'Solicitudes de Recursos'
                : activeTab === 'donations'
                ? 'Donaciones & Aportes de Recursos'
                : activeTab === 'logs'
                ? 'Canal de Logs & Auditoría'
                : activeTab === 'sponsor'
                ? 'Socio Premium'
                : activeTab === 'reviews'
                ? 'Canal de Reseñas'
                : activeTab === 'ai_assistant'
                ? '🤖・Asistente IA Privado'
                : activeTab}
            </h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              {user.username} • <span className="text-indigo-400 font-bold">{user.role}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Quick search input (Enabled for resources & streaming tabs) */}
            {(activeTab === 'resources' || activeTab === 'streaming') && (
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Buscador global..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className={`p-2 rounded-xl border transition relative shrink-0 ${
                  bellOpen 
                    ? 'bg-slate-800 border-slate-700 text-white shadow-lg' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900/80'
                }`}
                title="Notificaciones"
              >
                <Bell className="h-4 w-4" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {bellOpen && (
                  <>
                    {/* Invisible backdrop to close dropdown */}
                    <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />

                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden"
                    >
                      {/* Dropdown Header */}
                      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-indigo-400" />
                          <h3 className="font-semibold text-xs text-slate-200">Notificaciones</h3>
                        </div>
                        {notifications.some(n => !n.isRead) && (
                          <button
                            onClick={() => { markAllAsRead(); }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck className="h-3 w-3" />
                            Marcar todo leído
                          </button>
                        )}
                      </div>

                      {/* Dropdown Content */}
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-500">
                            <p className="text-xs">No tienes notificaciones en este momento.</p>
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const targetTab = getTargetTabForNotification(n.type);
                            return (
                              <div
                                key={n.id}
                                onClick={() => {
                                  markSingleAsRead(n.id);
                                  handleTabChange(targetTab);
                                  setBellOpen(false);
                                }}
                                className={`p-3.5 text-left cursor-pointer transition flex items-start gap-3 hover:bg-slate-800/40 ${
                                  !n.isRead ? 'bg-slate-950/40' : ''
                                }`}
                              >
                                {/* Status indicator dot */}
                                <div className="mt-1">
                                  <span className={`block h-2 w-2 rounded-full shrink-0 ${
                                    !n.isRead ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-[11px] text-slate-200 truncate">{n.title}</h4>
                                  <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed break-words">{n.message}</p>
                                  <span className="text-[9px] text-slate-600 font-mono block mt-1.5">
                                    {new Date(n.createdAt).toLocaleDateString('es-ES', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* COMPONENT SWITCHER PANEL */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorBoundary key={activeTab}>
                <TabRenderer
                  tabKey={activeTab}
                  user={user}
                  token={token}
                  polls={polls}
                  announcements={announcements}
                  resources={resources}
                  streaming={streaming}
                  publicStats={publicStats}
                  globalSearch={globalSearch}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  searchedResources={searchedResources}
                  searchedStreaming={searchedStreaming}
                  handleDownloadResource={handleDownloadResource}
                  fetchPlatformData={fetchPlatformData}
                  handleProfileUpdated={handleProfileUpdated}
                  setActiveTab={setActiveTab}
                  isStaff={isStaff}
                  setIsAddStreamingOpen={setIsAddStreamingOpen}
                />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {token && (
        <StreamingAddModal
          isOpen={isAddStreamingOpen}
          onClose={() => setIsAddStreamingOpen(false)}
          token={token}
          onSuccess={fetchPlatformData}
        />
      )}
    </div>
  );
}
