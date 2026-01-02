import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

/**
 * Check if running on native platform (Android/iOS)
 */
export function isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running on web
 */
export function isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
}

/**
 * Share content using native share dialog on mobile, or clipboard on web
 */
export async function shareContent(options: {
    title?: string;
    text?: string;
    url?: string;
}): Promise<boolean> {
    if (isNativePlatform()) {
        try {
            await Share.share({
                title: options.title,
                text: options.text,
                url: options.url,
                dialogTitle: options.title,
            });
            return true;
        } catch (e) {
            console.error('Native share failed:', e);
            return false;
        }
    } else {
        // Web fallback - try Web Share API first, then clipboard
        if (navigator.share) {
            try {
                await navigator.share({
                    title: options.title,
                    text: options.text,
                    url: options.url,
                });
                return true;
            } catch (e) {
                // User cancelled or error
                console.log('Web share cancelled or failed:', e);
            }
        }

        // Fallback to clipboard
        const content = options.url || options.text || '';
        if (content && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(content);
                return true;
            } catch (e) {
                console.error('Clipboard write failed:', e);
            }
        }
        return false;
    }
}

/**
 * Pick a file using native picker on mobile or input element on web
 * Note: On Android, we use the standard HTML input for video selection
 * as it integrates well with Capacitor's WebView
 */
export function triggerFilePicker(
    inputRef: React.RefObject<HTMLInputElement>,
    accept: string = 'video/*'
): void {
    if (inputRef.current) {
        inputRef.current.accept = accept;
        inputRef.current.click();
    }
}
