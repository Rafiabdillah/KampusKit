import { useState, useEffect } from 'react';

export type PlatformType = 'android' | 'ios' | 'mac' | 'windows' | 'linux' | 'other';
export type BrowserType = 'safari' | 'chrome' | 'edge' | 'firefox' | 'samsung' | 'other';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function useDevicePlatform() {
  const [platform, setPlatform] = useState<PlatformType>('other');
  const [browser, setBrowser] = useState<BrowserType>('other');
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    
    // Platform detection
    let detectedPlatform: PlatformType = 'other';
    if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      detectedPlatform = 'ios';
    } else if (/android/.test(ua)) {
      detectedPlatform = 'android';
    } else if (/windows|win32|win64/.test(ua)) {
      detectedPlatform = 'windows';
    } else if (/macintosh|mac os x/.test(ua)) {
      detectedPlatform = 'mac';
    } else if (/linux/.test(ua)) {
      detectedPlatform = 'linux';
    }
    setPlatform(detectedPlatform);

    // Browser detection
    let detectedBrowser: BrowserType = 'other';
    if (/samsungbrowser/.test(ua)) {
      detectedBrowser = 'samsung';
    } else if (/edg\//.test(ua)) {
      detectedBrowser = 'edge';
    } else if (/chrome|crios/.test(ua) && !/edg\//.test(ua)) {
      detectedBrowser = 'chrome';
    } else if (/safari/.test(ua) && !/chrome|crios/.test(ua)) {
      detectedBrowser = 'safari';
    } else if (/firefox|fxios/.test(ua)) {
      detectedBrowser = 'firefox';
    }
    setBrowser(detectedBrowser);

    // Standalone (installed) detection
    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(standaloneCheck);

    // Install prompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    return false;
  };

  return {
    platform,
    browser,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWindows: platform === 'windows',
    isMac: platform === 'mac',
    isStandalone,
    isInstallable,
    triggerInstall,
  };
}
