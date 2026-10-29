import { useEffect, useState } from 'react';
import { CloseIcon, InstallIcon } from '../components/ui/icons';
import { showToast } from '../lib/toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function InstallButton() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const syncInstalledState = () => {
      setIsInstalled(
        standaloneQuery.matches || ('standalone' in navigator && navigator.standalone === true),
      );
    };
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    syncInstalledState();
    standaloneQuery.addEventListener('change', syncInstalledState);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      standaloneQuery.removeEventListener('change', syncInstalledState);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled !== false) return null;

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstructions((visible) => !visible);
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstallPrompt(null);

      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch {
      setInstallPrompt(null);
      showToast({
        message: 'No se pudo iniciar la instalación. Probá desde el menú del navegador.',
      });
    }
  };

  return (
    <div className="relative mt-3">
      <button
        type="button"
        onClick={() => {
          void handleInstall();
        }}
        className="mx-auto flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[12px] font-medium text-accent shadow-sm transition-colors hover:border-accent/40 hover:bg-accent-soft"
      >
        <InstallIcon className="size-4" />
        Instalar app
      </button>

      {showInstructions ? (
        <div
          role="dialog"
          aria-labelledby="install-instructions-title"
          className="absolute left-1/2 top-full z-40 mt-2 w-[min(320px,calc(100vw-32px))] -translate-x-1/2 rounded-control border border-border bg-surface p-4 text-left shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2 id="install-instructions-title" className="text-[13px] font-semibold">
                Instalar Simple Agenda
              </h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                En iPhone o iPad, tocá Compartir y elegí “Agregar a pantalla de inicio”. En otros
                dispositivos, abrí el menú del navegador y seleccioná “Instalar app” o “Agregar a
                pantalla de inicio”.
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar instrucciones de instalación"
              onClick={() => {
                setShowInstructions(false);
              }}
              className="grid size-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-border/50 hover:text-ink"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
