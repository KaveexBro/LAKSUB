import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-netflix-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-2xl text-center space-y-4">
            <h1 className="text-2xl font-black text-netflix-red uppercase tracking-tighter">Something went wrong</h1>
            <p className="text-gray-400 font-medium">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {error && (
              <pre className="text-xs bg-black/50 p-4 rounded-lg overflow-auto text-left text-red-400 border border-red-900/50">
                {error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-netflix-red text-white py-3 rounded-lg font-black uppercase tracking-widest hover:bg-red-700 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
