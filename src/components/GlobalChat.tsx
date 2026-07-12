import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Trash2, Clock, Shield, AlertCircle, Users, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { type ChatMessage, UserRole } from '../types.js';

interface GlobalChatProps {
  currentUser: any;
  token: string | null;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '😢', '🎉', '🚀', '💯', '👏', '🙌', '👀', '✨', '👑', '🎮', '💡'];

export default function GlobalChat({ currentUser, token }: GlobalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(3);
  const [cooldownCountdown, setCooldownCountdown] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Load chat history initially via HTTP
  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'No se pudo cargar el historial del chat.');
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Error al conectar con la base de datos del chat.');
    }
  };

  // Load chat cooldown configuration
  const fetchCooldown = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/chat/cooldown', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.cooldown !== undefined) {
        setCooldownSeconds(data.cooldown);
      }
    } catch (err) {
      console.error('Error fetching chat cooldown:', err);
    }
  };

  // Cooldown local countdown timer
  useEffect(() => {
    if (cooldownCountdown <= 0) return;
    const timer = setTimeout(() => {
      setCooldownCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownCountdown]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set up WebSocket connection
  useEffect(() => {
    if (!token) return;

    fetchHistory();
    fetchCooldown();

    let reconnectTimer: NodeJS.Timeout;
    function connect() {
      if (wsRef.current) {
        wsRef.current.close();
      }

      setWsStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        setError(null);
        // Send authentication token
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'msg') {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some(m => m.id === payload.message.id)) return prev;
              const next = [...prev, payload.message];
              return next.slice(-200); // keep last 200
            });
          } else if (payload.type === 'delete_msg') {
            setMessages((prev) => prev.filter(m => m.id !== payload.messageId));
          } else if (payload.type === 'clear_chat') {
            setMessages([]);
          } else if (payload.type === 'authenticated') {
            // Success auth, maybe request active users if backend supported
          } else if (payload.type === 'error') {
            setError(payload.message);
          }
        } catch (e) {
          console.error('Error parsing ws message:', e);
        }
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        // Try reconnect in 5s
        reconnectTimer = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setWsStatus('disconnected');
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearTimeout(reconnectTimer);
    };
  }, [token]);

  // Polling fallback when websocket is not connected
  useEffect(() => {
    if (wsStatus === 'connected' || !token) return;

    const interval = setInterval(() => {
      fetchHistory();
    }, 3000);

    return () => clearInterval(interval);
  }, [wsStatus, token]);

  // Autoscroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (currentUser?.isSuspended) {
      setError('Tu cuenta está suspendida. No puedes enviar mensajes.');
      return;
    }

    if (cooldownCountdown > 0) {
      setError(`Debes esperar ${cooldownCountdown} segundos antes de enviar otro mensaje.`);
      return;
    }

    // Trigger local cooldown countdown if not exempt
    const isExempt = currentUser?.role === UserRole.Owner || currentUser?.role === UserRole.CoOwner;

    // Attempt to send via HTTP or WebSocket. If WS is connected, send through WS for real-time responsiveness.
    if (wsRef.current && wsStatus === 'connected') {
      wsRef.current.send(JSON.stringify({
        type: 'msg',
        content: inputText
      }));
      setInputText('');
      if (!isExempt && cooldownSeconds > 0) {
        setCooldownCountdown(cooldownSeconds);
      }
    } else {
      // Fallback to HTTP API
      try {
        const res = await fetch('/api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: inputText })
        });
        const data = await res.json();
        if (res.ok) {
          setInputText('');
          setError(null);
          if (!isExempt && cooldownSeconds > 0) {
            setCooldownCountdown(cooldownSeconds);
          }
        } else {
          setError(data.error || 'Error al enviar mensaje.');
        }
      } catch (err) {
        setError('Error al enviar mensaje por problemas de conexión.');
      }
    }
  };

  const handleClearChat = async () => {
    if (!token) return;
    if (!window.confirm('¿Estás seguro de que deseas VACIAR TODO el historial del chat global? Esta acción es irreversible.')) return;

    try {
      const res = await fetch('/api/chat/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([]);
        setError(null);
      } else {
        setError(data.error || 'No se pudo vaciar el chat.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor para vaciar el chat.');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!token) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return;

    try {
      const res = await fetch(`/api/chat/${msgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo eliminar el mensaje.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.Owner:
        return 'bg-gradient-to-r from-red-500 to-amber-500 text-white border border-red-400/20';
      case UserRole.CoOwner:
        return 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white border border-pink-400/20';
      case UserRole.Recursos:
        return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold';
      case UserRole.MegaVIP:
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case UserRole.SuperVIP:
        return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
      case UserRole.VIP:
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700/50';
    }
  };

  const isOwner = currentUser && currentUser.role === UserRole.Owner;

  return (
    <div id="global_chat_container" className="flex flex-col h-[600px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
              Chat Global Comunidad
            </h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
              Canal unificado de miembros registrados
            </p>
          </div>
        </div>

        {/* Connection status and Admin controls */}
        <div className="flex items-center gap-3">
          {isOwner && (
            <button
              onClick={handleClearChat}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
              title="Vaciar todo el historial del chat"
            >
              <Trash2 className="h-3 w-3" /> Vaciar Chat
            </button>
          )}

          {wsStatus === 'connected' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wifi className="h-3 w-3 animate-pulse" /> Conectado en Vivo
            </span>
          ) : wsStatus === 'connecting' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title="WebSockets conectando. Canal de respaldo activo.">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" /> Canal Respaldo Activo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20" title="Conexión de respaldo activa por HTTP.">
              <WifiOff className="h-3 w-3" /> Modo HTTP Activo
            </span>
          )}
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-[10px] font-mono hover:underline">Ignorar</button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
            <p className="text-slate-500 text-sm">No hay mensajes recientes en el chat global.</p>
            <p className="text-slate-600 text-xs">¡Sé el primero en enviar un saludo!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser && msg.userId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] group ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* User Avatar */}
                <img
                  src={msg.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(msg.username)}`}
                  alt={msg.username}
                  className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 object-cover shrink-0 mt-0.5"
                />

                <div className="space-y-1">
                  {/* Sender Details */}
                  <div className={`flex items-center gap-2 flex-wrap ${isMe ? 'justify-end' : ''}`}>
                    <span className="font-semibold text-[11px] text-slate-200">{msg.username}</span>
                    <span className={`px-2 py-px rounded text-[8px] uppercase tracking-wider font-bold ${getRoleBadgeStyle(msg.role)}`}>
                      {msg.role}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {(() => {
                        try {
                          if (!msg.createdAt) return '--:--';
                          const d = new Date(msg.createdAt);
                          if (isNaN(d.getTime())) return '--:--';
                          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } catch (e) {
                          return '--:--';
                        }
                      })()}
                    </span>

                    {/* Moderation delete action */}
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 bg-red-950/40 text-red-400 hover:text-white rounded border border-red-900/20 transition-opacity opacity-70 hover:opacity-100 cursor-pointer"
                        title="Eliminar Mensaje"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-2.5 text-xs text-slate-100 leading-relaxed break-all ${
                    isMe 
                      ? 'bg-indigo-600 border border-indigo-500/30 rounded-tr-none text-white' 
                      : 'bg-slate-900 border border-slate-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2 relative">
        {/* Emoji Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-xl border border-slate-800 transition"
            title="Añadir Emoji"
          >
            <Smile className="h-4.5 w-4.5" />
          </button>

          {/* Emoji Popover */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={emojiPickerRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-14 left-0 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl grid grid-cols-4 gap-2 z-50 w-44"
              >
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-1.5 hover:bg-slate-850 rounded-lg text-lg text-center transition active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message Input Box */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            currentUser?.isSuspended 
              ? "Tu cuenta está suspendida" 
              : cooldownCountdown > 0 
                ? `Espera ${cooldownCountdown}s para escribir...` 
                : "Escribe un mensaje aquí..."
          }
          disabled={currentUser?.isSuspended || cooldownCountdown > 0}
          maxLength={500}
          className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />

        {/* Send Submit Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || currentUser?.isSuspended || cooldownCountdown > 0}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow shadow-indigo-600/20 disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center min-w-[38px]"
        >
          {cooldownCountdown > 0 ? (
            <span className="text-[10px] font-mono font-bold text-slate-200">{cooldownCountdown}s</span>
          ) : (
            <Send className="h-4.5 w-4.5" />
          )}
        </button>
      </form>
    </div>
  );
}
