import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldAlert, CheckCircle, Sparkles, Gamepad2, Gift, MessageSquare, Info, Shield, HelpCircle, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import lunaticLogo from '../assets/images/lunatic_logo_1784202374899.jpg';

type AuthMode = 'login' | 'register';

interface AuthScreensProps {
  onLoginSuccess: (token: string, user: any) => void;
  initialMode?: AuthMode;
}

export default function AuthScreens({ onLoginSuccess, initialMode = 'login' }: AuthScreensProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  // Form States
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // UI Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tips Rotation State
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    {
      title: 'Comparte y Gana Rangos',
      desc: 'Subir recursos como plugins, setups o modelos 3D y ser aprobados te otorga puntos de aporte y desbloquea rangos especiales de programador.',
      icon: Sparkles,
      iconColor: 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/30'
    },
    {
      title: 'Garantía de Seguridad',
      desc: 'Todas las configuraciones y archivos subidos son inspeccionados meticulosamente por el equipo de administración para evitar malware.',
      icon: Shield,
      iconColor: 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/30'
    },
    {
      title: 'Infraestructura Nervox',
      desc: 'Disfruta de latencia ultrabaja en Perú y Miami. Como miembro de Lunatic, tienes precios preferenciales y soporte 24/7 en Nervox Hosting.',
      icon: Gamepad2,
      iconColor: 'text-rose-400 bg-rose-950/40 border border-rose-800/30'
    },
    {
      title: 'Sorteos de la Comunidad',
      desc: 'Participa activamente para ganar suscripciones VIP, rangos exclusivos en el Discord y licencias de plugins premium en nuestra sección de Sorteos.',
      icon: Gift,
      iconColor: 'text-amber-400 bg-amber-950/40 border border-amber-800/30'
    },
    {
      title: 'Decide el Futuro',
      desc: 'Usa la sección de Votaciones para calificar ideas, proponer cambios y elegir los próximos eventos masivos de la comunidad.',
      icon: HelpCircle,
      iconColor: 'text-indigo-400 bg-indigo-950/40 border border-indigo-800/30'
    }
  ];

  // Rotate tips every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Listen for message events from Google OAuth popup window
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
      // Validate origin matches current domain, local development, or Google Cloud Run URLs
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token, user } = event.data;
        if (token && user) {
          setSuccess('¡Conectado con Google exitosamente!');
          setError(null);
          setLoading(false);
          setTimeout(() => {
            onLoginSuccess(token, user);
          }, 800);
        }
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setError(event.data.error || 'Ocurrió un error al iniciar sesión con Google.');
        setSuccess(null);
        setLoading(false);
      }
    };

    window.addEventListener('message', handlePopupMessage);
    return () => window.removeEventListener('message', handlePopupMessage);
  }, [onLoginSuccess]);

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Direct callback endpoint on our current domain (Vite dev proxy or Cloud Run host)
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const res = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo obtener la URL de inicio de sesión de Google.');
      }

      const { url } = await res.json();
      
      // Center popup on device screen
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );

      if (!popup) {
        throw new Error('El navegador bloqueó la ventana emergente de inicio de sesión. Por favor, permite ventanas emergentes para este sitio para continuar con Google.');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al registrarse.');
      }

      setSuccess('¡Registro completado con éxito!');
      
      // Auto-login immediate upon successful registration
      if (data.token && data.user) {
        onLoginSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales incorrectas.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const CurrentTipIcon = tips[currentTipIndex].icon;

  return (
    <div id="auth-container" className="min-h-screen flex items-center justify-center bg-[#030306] p-4 relative overflow-hidden font-sans">
      {/* Immersive space dust / starry radial background effects */}
      <div className="absolute top-0 left-0 right-0 h-full bg-[radial-gradient(ellipse_at_top,rgba(8,145,178,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.04),transparent_60%)] pointer-events-none" />
      
      {/* Tech grid mesh overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      {/* Main Container Card (Unified Side-by-Side Grid) */}
      <div className="w-full max-w-5xl bg-[#080911]/90 border border-slate-800/80 rounded-[28px] overflow-hidden shadow-[0_0_60px_rgba(8,145,178,0.12)] backdrop-blur-xl relative z-10 grid grid-cols-1 md:grid-cols-12">
        
        {/* LEFT COLUMN: BRAND SHOWCASE & COMMUNITY INFO (col-span-5) */}
        <div className="md:col-span-5 bg-[#05060b] p-8 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-850">
          {/* Subtle logo background glow */}
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full filter blur-[40px] pointer-events-none" />

          {/* Header & Logo Display */}
          <div className="space-y-6 relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="relative group">
              {/* Spinning / Glowing outline matching logo's vibrant cyan/blue tones */}
              <div className="absolute inset-[-4px] bg-gradient-to-tr from-cyan-500 via-indigo-600 to-cyan-400 rounded-3xl opacity-35 blur-sm group-hover:opacity-65 transition duration-500" />
              <div className="absolute inset-0 bg-[#0a0a0f] rounded-2xl" />
              
              <div className="relative h-24 w-24 bg-[#06060c] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                <img
                  src={lunaticLogo}
                  alt="Lunatic Community Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase">PLATAFORMA OFICIAL</span>
              </div>
              <h1 className="font-display font-extrabold text-2xl tracking-wider text-slate-100 uppercase leading-none">
                LUNATIC <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">COMMUNITY</span>
              </h1>
            </div>

            {/* General Description */}
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              La central de recursos definitiva para creadores y entusiastas de Minecraft. Comparte plugins, setups optimizados, modelos 3D avanzados y conecta con desarrolladores de toda Latinoamérica.
            </p>
          </div>

          {/* Interactive Community Tips & Features Slideshow */}
          <div className="mt-8 pt-6 border-t border-slate-850/60 relative z-10 flex-1 flex flex-col justify-end min-h-[160px] md:min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTipIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${tips[currentTipIndex].iconColor}`}>
                    <CurrentTipIcon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">TIPS DE LA COMUNIDAD</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-200 tracking-wide uppercase">{tips[currentTipIndex].title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{tips[currentTipIndex].desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dot Indicators */}
            <div className="flex gap-1.5 mt-5">
              {tips.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTipIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentTipIndex ? 'w-5 bg-cyan-400' : 'w-1.5 bg-slate-800 hover:bg-slate-700'
                  }`}
                  aria-label={`Ir al tip ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DYNAMIC LOGIN / REGISTER FORMS (col-span-7) */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-[#07080e]/60">
          
          {/* Custom Navigation Tabs (Login / Register) */}
          <div className="flex bg-[#040407] p-1 border border-slate-800/80 rounded-2xl w-fit mb-8 self-center sm:self-start">
            <button
              onClick={() => { setError(null); setSuccess(null); setMode('login'); }}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setError(null); setSuccess(null); setMode('register'); }}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-red-400 text-xs flex items-start gap-2.5 animate-pulse">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 text-xs flex items-start gap-2.5">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#030306] border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 shadow-inner"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Contraseña</label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#030306] border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 shadow-inner"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-550 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(8,145,178,0.25)] hover:shadow-[0_0_30px_rgba(8,145,178,0.45)] cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Iniciando Sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Acceder a la Plataforma</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800/60"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-mono tracking-widest">O</span>
                <div className="flex-grow border-t border-slate-800/60"></div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full bg-[#030306] hover:bg-[#07080d] text-slate-200 hover:text-white font-bold py-3.5 px-4 border border-slate-800/80 hover:border-slate-700 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continuar con Google</span>
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Nombre de Usuario</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#030306] border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 shadow-inner"
                    placeholder="ej. mi_apodo"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#030306] border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 shadow-inner"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#030306] border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 shadow-inner"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-550 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(8,145,178,0.25)] hover:shadow-[0_0_30px_rgba(8,145,178,0.45)] cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creando Cuenta...</span>
                  </>
                ) : (
                  <>
                    <span>Crear Cuenta Privada</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800/60"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-mono tracking-widest">O</span>
                <div className="flex-grow border-t border-slate-800/60"></div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full bg-[#030306] hover:bg-[#07080d] text-slate-200 hover:text-white font-bold py-3.5 px-4 border border-slate-800/80 hover:border-slate-700 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continuar con Google</span>
              </button>
            </form>
          )}

          {/* Secure Platform badge */}
          <div className="mt-8 pt-4 border-t border-slate-850/60 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
            <Shield className="h-3.5 w-3.5 text-cyan-500" />
            <span>Encriptación SSL de Extremo a Extremo</span>
          </div>

        </div>

      </div>
    </div>
  );
}
