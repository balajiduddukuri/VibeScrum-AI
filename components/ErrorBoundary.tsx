import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4">
          <div className="bg-slate-800 p-8 rounded-xl border border-rose-500/30 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-rose-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">Something went wrong</h1>
            <p className="text-slate-400 mb-6 text-sm">
              The application encountered an unexpected error. Don't worry, your data is safe in local storage.
            </p>
            <div className="bg-slate-950 p-3 rounded text-xs text-left font-mono text-rose-300 mb-6 overflow-auto max-h-32">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 w-full transition-all"
            >
              <RotateCcw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;