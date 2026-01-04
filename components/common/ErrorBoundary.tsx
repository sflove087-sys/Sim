import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeLocalStorage } from '../../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      safeLocalStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear storage or reload:", e);
      // If even this fails, at least we've logged it.
      // The user can still manually clear their browser data.
    }
  };

  // FIX: Added explicit return type React.ReactNode to the render method.
  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4 text-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              একটি অপ্রত্যাশিত ত্রুটি ঘটেছে
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              অ্যাপ্লিকেশনটি চালু করার সময় একটি সমস্যা হয়েছে। ডেটা মুছে ফেলে আবার চেষ্টা করলে এটি ঠিক হয়ে যেতে পারে।
            </p>
            <button
              onClick={this.handleReset}
              className="w-full bg-red-600 text-white font-bold py-3 px-5 rounded-xl shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors"
            >
              ডেটা মুছে ফেলে আবার চেষ্টা করুন
            </button>
             <details className="mt-4 text-xs text-left text-slate-400 dark:text-slate-500 cursor-pointer">
                <summary>ত্রুটির বিবরণ দেখুন (ডেভেলপারদের জন্য)</summary>
                <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                  <code>
                    {this.state.error?.toString()}
                    {'\n\n'}
                    {this.state.error?.stack}
                  </code>
                </pre>
            </details>
          </div>
        </div>
      );
    }

    // FIX: Destructure children from props to resolve potential 'this' context issues with the compiler.
    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;