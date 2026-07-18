import React from 'react';
import nervoxLogo from '../assets/images/nervox_logo_1783881857606.jpg';
import nervoxBanner from '../assets/images/nervox_banner_1783881869825.jpg';
import {
  Globe,
  Gamepad2,
  CreditCard,
  Activity,
  MessageSquare,
  MapPin,
  DollarSign,
  Zap,
  ExternalLink,
  Shield,
  Heart,
  Cpu,
  Sparkles,
  Headphones,
  CheckCircle2
} from 'lucide-react';

interface SponsorViewProps {
  currentUser: any;
  token: string;
}

export default function SponsorView({ currentUser, token }: SponsorViewProps) {
  // Navigation nodes and prices for Nervox
  const nodes = [
    { name: 'Perú', flag: '🇵🇪', desc: 'Infraestructura Local en Lima' },
    { name: 'Miami', flag: '🇺🇸', desc: 'Infraestructura USA Premium' }
  ];

  const prices = [
    { location: '🇵🇪 Perú', price: 'Desde 1.20 USD/GB', target: 'VPS Minecraft & Linux' },
    { location: '🇺🇸 Miami', price: 'Desde 2.00 USD/GB', target: 'VPS Ryzen de Alta Gama' }
  ];

  const features = [
    { icon: Cpu, label: 'Alto rendimiento', desc: 'Procesadores Ryzen de última generación' },
    { icon: Zap, label: 'Baja latencia', desc: 'Rutas optimizadas para toda Latinoamérica' },
    { icon: Shield, label: 'Protección DDoS', desc: 'Mitigación avanzada para seguridad total' },
    { icon: Gamepad2, label: 'Panel de juegos', desc: 'Administra tus servidores con Pterodactyl' },
    { icon: Headphones, label: 'Soporte técnico', desc: 'Atención personalizada 24/7 en Discord' },
    { icon: Activity, label: 'Estado en tiempo real', desc: 'Monitoreo de red constante y transparente' }
  ];

  const actionButtons = [
    { label: 'Sitio Web', url: 'https://nervox.net/', icon: Globe },
    { label: 'Panel de Juegos', url: 'https://panel.nervox.net/', icon: Gamepad2 },
    { label: 'Área de Cliente', url: 'https://billing.nervox.net/', icon: CreditCard },
    { label: 'Estado de Red', url: 'https://status.nervox.net/', icon: Activity },
    { label: 'Comunidad Discord', url: 'https://discord.gg/nervox', icon: MessageSquare }
  ];

  return (
    <div id="sponsor-nervox-view" className="space-y-10 max-w-6xl mx-auto py-4 px-2">
      {/* Premium Sponsor Badge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-red-500/10 pb-4 gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(255,45,45,0.15)]">
            <Heart className="h-3 w-3 animate-pulse text-red-500" /> Aliado Premium / Patrocinador Oficial
          </span>
          <h2 className="font-display font-extrabold text-lg text-slate-100 tracking-tight mt-1">
            Espacio Patrocinado por <span className="text-red-500 hover:shadow-[0_0_15px_rgba(255,45,45,0.5)] transition duration-300">Nervox Hosting</span>
          </h2>
        </div>
      </div>

      {/* Dynamic Wide-screen Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-red-500/20 shadow-[0_0_35px_rgba(255,45,45,0.1)] group">
        <img
          src={nervoxBanner}
          alt="Nervox Hosting Banner"
          className="w-full h-auto aspect-[2.8/1] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent opacity-60" />
      </div>

      {/* Main Showcase Grid Card Container */}
      <div className="relative rounded-[24px] bg-[#090909] border border-red-500/20 p-6 md:p-10 shadow-[0_0_50px_rgba(255,45,45,0.06)] overflow-hidden">
        {/* Subtle tech grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,45,45,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,45,45,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />
        <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] bg-red-500/10 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-red-950/20 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Outer Desktop Columns / Mobile Centered Column */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LADO IZQUIERDO: Logo de Nervox Hosting */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative group">
              {/* Outer Glowing Rings */}
              <div className="absolute inset-[-6px] bg-gradient-to-tr from-red-600 to-red-500 rounded-3xl opacity-30 blur-md group-hover:opacity-60 transition duration-500" />
              <div className="absolute inset-0 bg-[#141414] rounded-2xl" />
              
              {/* Logo Box */}
              <div className="relative h-40 w-40 md:h-48 md:w-48 bg-[#0C0C0C] border-2 border-red-500/30 rounded-2xl overflow-hidden flex flex-col items-center justify-center shadow-2xl transition duration-500 group-hover:scale-[1.02] group-hover:border-red-500">
                <img
                  src={nervoxLogo}
                  alt="Nervox Hosting Logo"
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest">INFRAESTRUCTURA ACTIVA</span>
            </div>
          </div>

          {/* LADO DERECHO: Detalles & Acciones */}
          <div className="lg:col-span-8 space-y-6 text-center lg:text-left">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none uppercase font-sans">
                NERVOX <span className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.55)] font-sans">HOSTING</span>
              </h1>
              <h3 className="text-sm md:text-lg font-semibold text-slate-200 mt-2 tracking-wide leading-relaxed">
                Hosting VPS de alto rendimiento con infraestructura en <span className="text-red-400 font-bold border-b border-red-500/20 pb-0.5">Perú</span> y <span className="text-red-400 font-bold border-b border-red-500/20 pb-0.5">Miami</span>.
              </h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed mt-4 max-w-2xl">
                Servidores optimizados para Minecraft, servidores privados virtuales (VPS) y proyectos corporativos de alta demanda. Disfruta de una infraestructura premium estable con hardware de última generación, baja latencia, mitigación DDoS avanzada y soporte especializado.
              </p>
            </div>

            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Card Nodos */}
              <div className="bg-[#141414]/90 backdrop-blur border border-red-500/10 p-4 rounded-2xl flex items-start gap-3 transition hover:border-red-500/30 group">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">📍 Nodos de Red</span>
                  <div className="flex gap-2 items-center mt-1.5">
                    {nodes.map((node, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-350">
                        <span>{node.flag}</span>
                        <span>{node.name}</span>
                      </span>
                    ))}
                  </div>
                  <span className="block text-[10px] text-slate-500 mt-1.5">Sistemas de ultra-baja latencia en Lima y Florida.</span>
                </div>
              </div>

              {/* Card Precios */}
              <div className="bg-[#141414]/90 backdrop-blur border border-red-500/10 p-4 rounded-2xl flex items-start gap-3 transition hover:border-red-500/30 group">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">💲 Planes Flexibles</span>
                  <div className="space-y-1 mt-1.5">
                    {prices.map((p, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] font-sans gap-2">
                        <span className="text-slate-400">{p.location}:</span>
                        <span className="text-red-400 font-bold font-mono bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">{p.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN INTERMEDIA: CARACTERÍSTICAS TECNOLÓGICAS (Bento-like Grid) */}
        <div className="mt-10 pt-8 border-t border-red-500/10 space-y-4">
          <h4 className="text-center font-display font-extrabold text-sm text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-red-500" /> Beneficios de Alto Rendimiento <Sparkles className="h-4 w-4 text-red-500" />
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((feat, index) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={index}
                  className="bg-[#121212] border border-red-500/5 hover:border-red-500/20 p-4 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,45,45,0.03)] hover:-translate-y-0.5 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/5 text-red-500 rounded-xl group-hover:bg-red-500/15 group-hover:text-red-400 transition-all">
                      <IconComp className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide group-hover:text-red-400 transition">
                      {feat.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed pl-1">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN INFERIOR: BOTONES DE ACCIÓN DIRECTA */}
        <div className="mt-10 pt-8 border-t border-red-500/10 space-y-4 text-center">
          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">ACCEDER A LOS SERVICIOS DE NERVOX</span>
          
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
            {actionButtons.map((btn, index) => {
              const IconComp = btn.icon;
              return (
                <a
                  key={index}
                  href={btn.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold rounded-2xl text-xs transition duration-300 transform hover:scale-[1.03] shadow-[0_4px_15px_rgba(180,0,0,0.2)] hover:shadow-[0_0_25px_rgba(255,45,45,0.4)] group"
                >
                  <IconComp className="h-4 w-4 text-white group-hover:scale-110 transition duration-300" />
                  <span>{btn.label}</span>
                  <ExternalLink className="h-3 w-3 text-red-200/80" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trust reassurance banner */}
      <div className="bg-[#121212] border border-red-500/10 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="text-center sm:text-left">
            <span className="block text-xs font-bold text-slate-200">Recomendado por la Administración de Lunatic</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">Nuestra infraestructura global y servidores premium corren en nodos dedicados de Nervox.</span>
          </div>
        </div>
        <a
          href="https://nervox.net/"
          target="_blank"
          rel="noreferrer noopener"
          className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0"
        >
          <span>Visitar Sitio Oficial</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
