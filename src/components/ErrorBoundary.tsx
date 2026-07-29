import { Component, ErrorInfo, ReactNode } from "react";
import { ChevronLeft, RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl space-y-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
                कुछ समस्या उत्पन्न हुई (An Error Occurred)
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                पेज प्रदर्शित करते समय एक तकनीकी समस्या आई है। कृपया पुनः प्रयास करें।
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg text-left overflow-x-auto text-xs font-mono text-red-600 dark:text-red-400 max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> मुख्य पृष्ठ (Home)
              </button>

              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> रिफ्रेश (Reload)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
