"use client";

import { Button } from '@/components/ui/Button';
import { Download, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registered!', reg))
                .catch(err => console.error('SW registration failed!', err));
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Logic to show after a small delay or certain conditions
            const hasDismissed = localStorage.getItem('ace_pwa_dismissed');
            if (!hasDismissed) {
                setTimeout(() => setIsVisible(true), 3000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('ace_pwa_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-primary-900 text-white rounded-2xl p-5 shadow-2xl border border-primary-700 max-w-sm relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-800 rounded-full blur-2xl opacity-50" />
                
                <button onClick={handleDismiss} className="absolute top-3 right-3 text-primary-300 hover:text-white">
                    <X size={18} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
                        <Smartphone size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-base leading-tight">Install AceTrack OS</h3>
                        <p className="text-xs text-primary-100 mt-1 leading-relaxed">
                            Install on your phone for a better mobile experience and offline access.
                        </p>
                        <div className="flex gap-2 mt-4">
                            <button 
                                onClick={handleInstall}
                                className="flex-1 bg-white text-primary-900 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
                            >
                                <Download size={14} /> Install App
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
