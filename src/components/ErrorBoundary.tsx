import React, { type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[React Error Boundary Caught]:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div id="error-boundary-container" className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl m-4 backdrop-blur-sm">
          <div id="error-icon" className="p-4 bg-red-500/10 text-red-400 rounded-2xl mb-4 border border-red-500/20">
            <AlertTriangle className="h-7 w-7 animate-pulse" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">Algo salió mal al cargar esta sección</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
            Ocurrió un error inesperado al renderizar el componente. Esto puede deberse a datos corruptos o incompatibilidad con la base de datos.
          </p>
          <div className="w-full max-w-lg mt-5 bg-red-950/20 border border-red-900/30 rounded-2xl p-4 text-left overflow-hidden">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Detalle del Error:</div>
            <pre className="text-[11px] text-red-400 font-mono overflow-auto max-h-36 whitespace-pre-wrap break-all select-all leading-normal">
              {this.state.error?.stack || this.state.error?.message || 'Error desconocido'}
            </pre>
          </div>
          <button
            id="error-reload-button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Recargar Aplicación</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
