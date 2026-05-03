import * as React from 'react';
import { AlertTriangle, Bug } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copied: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in application:", error, errorInfo);
    // @ts-ignore
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-gray-50 m-4 rounded-xl">
          <AlertTriangle className="h-16 w-16 text-orange-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan Aplikasi</h1>
          <p className="text-gray-600 mb-6 max-w-md">
            Maaf, ada masalah saat memuat bagian halaman ini. Kami telah mencatat errornya. Silakan laporkan bug ini.
          </p>
          <button 
            onClick={() => {
              const errorDetails = `Error: ${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack}`;
              console.log(errorDetails);
              void navigator.clipboard?.writeText(errorDetails);
              // @ts-ignore
              this.setState({ copied: true });
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Bug className="h-4 w-4" />
            {this.state.copied ? 'Detail Error Disalin' : 'Lapor Bug'}
          </button>
          
          <div className="mt-8 text-left bg-red-50 text-red-900 p-4 rounded-lg w-full max-w-2xl overflow-auto text-sm font-mono border border-red-200">
            <p className="font-bold">{this.state.error && this.state.error.toString()}</p>
            <pre className="mt-2 text-xs opacity-80 whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
