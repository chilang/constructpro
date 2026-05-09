import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  }

  return { canInstall, install };
}

/**
 * Share via Web Share API (native share sheet on mobile).
 * Falls back to mailto: link on desktop.
 * Returns true if shared natively, false if fallback was used.
 */
export async function nativeShare(options: {
  title: string;
  text: string;
  url?: string;
  email?: string;
}): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return true;
    } catch (err: any) {
      // User cancelled — don't fallback
      if (err.name === 'AbortError') return false;
    }
  }
  // Fallback to email
  const mailto = `mailto:${options.email || ''}?subject=${encodeURIComponent(options.title)}&body=${encodeURIComponent(options.text)}`;
  window.open(mailto, '_blank');
  return false;
}

/**
 * Share a file (PDF/DOCX) via Web Share API.
 * Falls back to downloading the file.
 */
export async function nativeShareFile(file: File, options: {
  title: string;
  text: string;
  email?: string;
}): Promise<boolean> {
  // Try native share with file
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        files: [file],
      });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
    }
  }
  // Try native share without file
  if (navigator.share) {
    try {
      await navigator.share({ title: options.title, text: options.text });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
    }
  }
  // Fallback to email
  const mailto = `mailto:${options.email || ''}?subject=${encodeURIComponent(options.title)}&body=${encodeURIComponent(options.text)}`;
  window.open(mailto, '_blank');
  return false;
}
