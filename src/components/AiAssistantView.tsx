import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, AlertCircle, Trash2, User, Loader2, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { type AiChatMessage } from '../types';
import lunaticMascot from '../assets/images/lunatic_minecraft_mascot_1784341439473.jpg';

interface AiAssistantViewProps {
  currentUser: any;
  token: string;
}

export default function AiAssistantView({ currentUser, token }: AiAssistantViewProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestions for rapid user onboarding
  const suggestions = [
    { text: '¿Qué recursos premium de plugins hay?', icon: '💎' },
    { text: '¿Qué cuentas de streaming tienes activas?', icon: '📺' },
    { text: 'Recomiéndame configuraciones de Discord', icon: '💬' },
    { text: '¿Cómo puedo obtener el rango VIP en la web?', icon: '⭐' }
  ];

  // Load private chat history on mount
  useEffect(() => {
    fetchHistory();
  }, [token]);

  // Scroll to bottom whenever messages list or loading state updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      setError(null);
      const res = await fetch('/api/ai/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('No se pudo cargar el historial de chat de la IA.');
      }
      const data = await res.json();
      setMessages(data.history || []);
    } catch (err: any) {
      console.error('Error fetching AI history:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    setInput('');
    setLoading(true);

    // Optimistically render user message
    const tempUserMsg: AiChatMessage = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.details || 'Error al obtener respuesta de la IA.');
      }

      const data = await res.json();
      // Replace/Append with official messages returned from DB
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, data.userMessage, data.aiMessage];
      });
    } catch (err: any) {
      console.error('Error sending message to AI:', err);
      setError(err.message || 'No se pudo comunicar con el asistente virtual.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('¿Estás seguro de que deseas vaciar tu chat privado con la IA? Esto no se puede deshacer.')) {
      return;
    }

    try {
      setError(null);
      const res = await fetch('/api/ai/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Error al vaciar el historial.');
      }

      setMessages([]);
    } catch (err: any) {
      console.error('Error clearing history:', err);
      setError(err.message || 'No se pudo vaciar el historial.');
    }
  };

  return (
    <div id="ai-assistant-container" className="flex flex-col h-[calc(100vh-180px)] min-h-[550px] bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl relative">
      {/* Background design elements */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-cyan-500/5 rounded-full filter blur-[60px] pointer-events-none" />

      {/* HEADER BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300" />
            <img
              src={lunaticMascot}
              alt="Lunatic AI Mascot"
              className="h-11 w-11 rounded-2xl relative border border-slate-700 object-cover shadow-lg"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-md animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-slate-100 flex items-center gap-2">
              <span className="bg-gradient-to-r from-indigo-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent">LUNA IA</span>
              <span className="flex items-center gap-1 text-[8px] font-mono font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 uppercase tracking-widest">
                <Sparkles className="h-2 w-2 text-cyan-400 animate-spin" /> OFICIAL
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono flex items-center flex-wrap gap-1.5">
              <span>Asistente de Minecraft & Streaming</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400">Privado</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400">Autoreset 4h</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-950/30 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 text-[11px] font-bold tracking-wide transition active:scale-95"
              title="Borrar historial"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Limpiar Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* ERROR MESSAGE ALERT */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-400 text-xs shadow-md shrink-0 z-10">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Ocurrió un inconveniente</p>
            <p className="text-[11px] leading-relaxed text-rose-300/90">{error}</p>
          </div>
        </div>
      )}

      {/* MESSAGES VIEWPORT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent z-10">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6 px-4 py-8"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
                <div className="p-1 bg-slate-900 rounded-3xl border border-slate-700/60 relative">
                  <img
                    src={lunaticMascot}
                    alt="Mascot Welcome"
                    className="h-20 w-20 rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -top-1 -right-1 p-1.5 bg-indigo-500 rounded-full animate-bounce">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-black text-base text-slate-100 tracking-tight">
                  ¡Hola, {currentUser.username}! 👋
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  Soy **Luna**, tu guía y asistente de Minecraft. Estoy conectada en tiempo real a la base de datos de recursos y streaming para ayudarte a encontrar lo que buscas de forma instantánea.
                </p>
              </div>

              {/* Suggestions panel */}
              <div className="w-full space-y-3 pt-2">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Ideas con las que puedes empezar</p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(s.text)}
                      className="w-full text-left px-4 py-3.5 rounded-2xl bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition duration-200 text-xs text-slate-300 font-semibold flex items-center gap-3 group"
                    >
                      <span className="text-base shrink-0 group-hover:scale-125 transition duration-300">{s.icon}</span>
                      <span className="truncate group-hover:text-slate-100 transition duration-150">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Avatar */}
                    {isUser ? (
                      <div className="h-9 w-9 rounded-2xl shrink-0 border border-indigo-500/20 bg-indigo-950/40 text-indigo-300 flex items-center justify-center shadow-md">
                        <User className="h-4.5 w-4.5" />
                      </div>
                    ) : (
                      <img
                        src={lunaticMascot}
                        alt="AI Avatar"
                        className="h-9 w-9 rounded-2xl shrink-0 border border-slate-700/80 object-cover shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Chat Bubble */}
                    <div className={`p-4 rounded-2xl shadow-xl ${
                      isUser
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-slate-100 rounded-tr-none border border-indigo-500/30'
                        : 'bg-slate-950/80 text-slate-300 rounded-tl-none border border-slate-800/80 backdrop-blur-md'
                    }`}>
                      {isUser ? (
                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words font-medium">{msg.content}</p>
                      ) : (
                        <div className="text-xs sm:text-sm leading-relaxed space-y-2.5 break-words">
                          <Markdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-slate-300/90 leading-relaxed" {...props} />,
                              a: ({ node, ...props }) => <a className="text-cyan-400 hover:text-cyan-300 hover:underline font-bold transition" target="_blank" rel="noreferrer" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-300/90" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-300/90" {...props} />,
                              li: ({ node, ...props }) => <li className="pl-1 text-slate-300/95" {...props} />,
                              code: (props: any) => {
                                const { node, inline, ...rest } = props;
                                return inline ? (
                                  <code className="bg-slate-900/80 text-rose-400 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-800/40" {...rest} />
                                ) : (
                                  <pre className="bg-slate-950 p-4 rounded-2xl overflow-x-auto my-3 border border-slate-800/80 shadow-inner">
                                    <code className="text-emerald-400 font-mono text-xs block leading-normal" {...rest} />
                                  </pre>
                                );
                              },
                              strong: ({ node, ...props }) => <strong className="font-extrabold text-indigo-300" {...props} />,
                              h1: ({ node, ...props }) => <h1 className="text-sm font-black text-slate-100 mt-4 mb-2 border-b border-slate-800 pb-1 uppercase tracking-wider" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-xs font-bold text-slate-100 mt-3 mb-1.5" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-[11px] font-bold text-slate-200 mt-2 mb-1" {...props} />,
                            }}
                          >
                            {msg.content}
                          </Markdown>
                        </div>
                      )}
                      <span className="block text-[8px] font-mono text-slate-500 mt-2 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* LOADING TYPING INDICATOR */}
        {loading && (
          <div className="flex items-start gap-3.5 max-w-[85%] mr-auto">
            <img
              src={lunaticMascot}
              alt="AI Thinking Avatar"
              className="h-9 w-9 rounded-2xl shrink-0 border border-slate-700/80 object-cover shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="bg-slate-950/80 p-4 rounded-2xl rounded-tl-none border border-slate-800/80 shadow-md flex items-center gap-3 backdrop-blur-md">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wide">Luna IA está consultando el catálogo...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT CONTROLLER */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) handleSendMessage(input);
        }}
        className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center gap-3 shrink-0 z-10"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregúntale a Luna sobre plugins, configuraciones o streaming gratis..."
          disabled={loading}
          className="flex-1 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition duration-150 shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
