import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Simple Agenda] error de render', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="mx-auto flex h-dvh max-w-[560px] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-[17px] font-semibold">Algo salió mal</p>
        <p className="text-[13px] leading-snug text-muted">
          Tus notas siguen guardadas en este dispositivo. Probá recargar la app.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="mt-2 h-10 rounded-full bg-accent px-5 text-[13.5px] font-semibold text-canvas"
        >
          Recargar
        </button>
      </div>
    );
  }
}
