"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[var(--color-danger-dim)] border border-[var(--color-danger)]/30 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-[var(--color-danger)]" />
          <p className="text-sm text-[var(--color-text-muted)] mb-1">
            {this.props.fallbackMessage || "Something went wrong"}
          </p>
          <p className="text-xs text-[var(--color-text-dim)] mb-4 font-mono">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
