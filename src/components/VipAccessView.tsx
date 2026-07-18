import React from 'react';
import { Crown, Gift, Users, CreditCard, MessageSquare, ExternalLink, ShieldCheck, Ticket } from 'lucide-react';

export default function VipAccessView() {
  const discordLink = 'https://dc.gg/lunatic';

  const tiers = [
    {
      name: 'VIP',
      price: '3 USD',
      invites: '5 invitaciones',
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-900/30',
      bgColor: 'bg-blue-500/10',
      features: [
        'Acceso a Recursos Premium básicos',
        'Visualización de cuentas de Streaming seleccionadas',
        'Rol VIP exclusivo en el servidor de Discord',
        'Soporte prioritario mediante Tickets'
      ]
    },
    {
      name: 'Super VIP',
      price: '6 USD',
      invites: '10 invitaciones',
      color: 'from-indigo-600 to-purple-600',
      textColor: 'text-indigo-400',
      borderColor: 'border-indigo-900/40',
      bgColor: 'bg-indigo-500/10',
      popular: true,
      features: [
        'Acceso a TODOS los Recursos Premium',
        'Acceso completo a Cuentas de Streaming Gratis',
        'Rol Super VIP destacado en Discord',
        'Canal de aportes y descargas directas',
        'Soporte ultra-prioritario'
      ]
    },
    {
      name: 'Mega VIP',
      price: '9 USD',
      invites: '16 invitaciones',
      color: 'from-purple-600 to-pink-600',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-900/30',
      bgColor: 'bg-purple-500/10',
      features: [
        'Beneficios de VIP y Super VIP',
        'Prioridad absoluta en renovación de cuentas',
        'Rol Mega VIP legendario en Discord',
        'Insignia especial en la plataforma',
        'Peticiones de recursos personalizados'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Premium Welcome Header Banner */}
      <div className="rounded-2xl p-8 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-slate-800/80 relative overflow-hidden purple-blue-glow">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Crown className="h-40 w-40 text-indigo-500" />
        </div>
        
        <div className="space-y-3 z-10 relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Crown className="h-3 w-3 animate-pulse" /> Membresías de la Comunidad
          </span>
          <h3 className="font-display font-extrabold text-2xl md:text-3xl text-slate-100 tracking-tight leading-none">
            Consigue Acceso <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">VIP Premium</span>
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Desbloquea el máximo potencial de Lunatic Community. Accede a recursos de desarrollo exclusivos, cuentas de streaming gratis garantizadas y soporte preferencial. Elige el camino que prefieras: mediante invitaciones o apoyo directo.
          </p>
        </div>
      </div>

      {/* Grid: Invite Method & Payment Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Invitation System (Discord) */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <Users className="h-5 w-5" />
              <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-100">Método de Invitaciones</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              ¿No deseas realizar un pago? ¡No hay problema! Puedes obtener cualquiera de nuestros rangos VIP invitando a tus amigos a nuestro servidor oficial de Discord.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs font-mono">5</span>
                  <span className="text-xs font-semibold text-slate-300">Invitaciones</span>
                </div>
                <span className="text-xs font-bold font-mono text-blue-400 px-2 py-0.5 bg-blue-500/5 rounded-lg border border-blue-500/15">Rol VIP</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs font-mono">10</span>
                  <span className="text-xs font-semibold text-slate-300">Invitaciones</span>
                </div>
                <span className="text-xs font-bold font-mono text-indigo-400 px-2 py-0.5 bg-indigo-500/5 rounded-lg border border-indigo-500/15">Super VIP</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs font-mono">16</span>
                  <span className="text-xs font-semibold text-slate-300">Invitaciones</span>
                </div>
                <span className="text-xs font-bold font-mono text-purple-400 px-2 py-0.5 bg-purple-500/5 rounded-lg border border-purple-500/15">Mega VIP</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-[11px] text-slate-400 leading-normal flex gap-2">
              <Gift className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <span>Crea tu propio enlace de invitación permanente en Discord y compártelo para empezar a acumular invitaciones hoy mismo.</span>
            </div>

            <a
              href={discordLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Ir al Discord de Lunatic</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Right / Center Area: Pricing Tiers & Methods (2 column width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-slate-900 border ${tier.popular ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-800'} rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">
                    Recomendado
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h5 className="font-display font-bold text-sm text-slate-100">{tier.name}</h5>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-extrabold text-slate-100 font-mono">{tier.price}</span>
                      <span className="text-[10px] text-slate-500 lowercase font-medium">Pago Único</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300 leading-normal">
                        <ShieldCheck className={`h-3.5 w-3.5 ${tier.textColor} shrink-0 mt-0.5`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-850 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>O gratis con:</span>
                    <strong className={`${tier.textColor} font-semibold font-mono`}>{tier.invites}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Methods Info Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <CreditCard className="h-5 w-5" />
              <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-100">Métodos de Pago Soportados</h4>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Aceptamos los siguientes procesadores de pago para otorgarte tu rango de manera rápida y segura. Todo el proceso es 100% verificado:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-950/60 hover:bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-center gap-3 transition">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-bold text-xs tracking-wider text-blue-400 font-mono uppercase">PayPal</span>
              </div>
              
              <div className="bg-slate-950/60 hover:bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-center gap-3 transition">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-xs tracking-wider text-cyan-400 font-mono uppercase">Yape</span>
              </div>

              <div className="bg-slate-950/60 hover:bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-center gap-3 transition">
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="font-bold text-xs tracking-wider text-purple-400 font-mono uppercase">Plin</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Ticket / Support Footer Card */}
      <div className="bg-gradient-to-r from-indigo-950/20 via-purple-950/10 to-slate-900 border border-slate-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-indigo-400">
            <Ticket className="h-5 w-5" />
            <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-100">¿Tienes dudas o deseas adquirir tu VIP?</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Para validar tus invitaciones, enviar comprobantes de pago de <strong>PayPal, Yape o Plin</strong>, o resolver cualquier duda que tengas, debes abrir un ticket dentro de nuestro servidor de Discord.
          </p>
        </div>

        <a
          href={`${discordLink}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2.5 transition shrink-0 shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Abrir Ticket en Discord</span>
        </a>
      </div>
    </div>
  );
}
