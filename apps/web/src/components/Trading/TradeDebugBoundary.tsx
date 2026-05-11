"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

const PREFIX = "[plut0x:trade-debug]";

export function tradeDebugLog(step: string, details?: unknown) {
  if (details === undefined) {
    console.log(PREFIX, step);
    return;
  }

  console.log(PREFIX, step, details);
}

export function tradeDebugError(step: string, error: unknown) {
  console.error(PREFIX, step, error);
}

type Props = {
  children: ReactNode;
  scope: string;
};

type State = {
  error: Error | null;
};

export class TradeDebugBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    tradeDebugError(`${this.props.scope}: componentDidCatch`, {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-950 px-4 text-center">
          <div className="max-w-xl rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-left">
            <p className="text-sm font-semibold text-red-200">
              Trade page crashed inside {this.props.scope}
            </p>
            <p className="mt-2 text-xs text-red-100/80">
              {this.state.error.message}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Open the console and filter for {PREFIX}.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
