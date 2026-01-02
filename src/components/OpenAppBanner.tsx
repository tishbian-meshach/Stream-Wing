import { useEffect, useState } from 'react';
import { isNativePlatform } from '../lib/platform';
import { Button } from './Button';

export function OpenAppBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show only on mobile web (not native app, not desktop)
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile && !isNativePlatform()) {
            setIsVisible(true);
        }
    }, []);

    const handleOpenApp = () => {
        // Try to open via intent/universal link
        // Reuse current URL but let the system handle it
        window.location.href = window.location.href;
        // If the intent filter is set up, reloading the same URL *should* trigger the app picker on Android
        // Alternatively, use a custom scheme if we had one.
        // Or fallback to Play Store link.
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex-1 mr-4">
                    <p className="text-sm font-medium">Better experience in the app</p>
                    <p className="text-xs text-indigo-200">Watch streams with better performance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsVisible(false)}
                        className="text-xs h-8 bg-indigo-500 border-indigo-400 text-white"
                    >
                        Dismiss
                    </Button>
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={handleOpenApp}
                        className="text-xs h-8 bg-white text-indigo-600 hover:bg-gray-100 border-none"
                    >
                        Open App
                    </Button>
                </div>
            </div>
        </div>
    );
}
