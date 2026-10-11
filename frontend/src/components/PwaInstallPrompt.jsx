import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff, CheckCircle } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* Offline Toast Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>
              <strong>Offline Mode:</strong> Network disconnected. Cached application state active. Telemetry updates paused.
            </span>
          </div>
          <span className="text-[11px] bg-amber-700/60 px-2 py-0.5 rounded">Offline</span>
        </div>
      )}

      {/* Install Floating Banner */}
      {showPrompt && !installed && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-slate-900 text-white p-4 shadow-xl border border-slate-800 flex items-center gap-4 transition-all">
          <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold">Install AquaNex App</h4>
            <p className="text-xs text-slate-300">Fast access to climate command center from your desktop or phone home screen.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition"
            >
              Install
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
