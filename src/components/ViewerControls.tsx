import React from 'react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { FullscreenIcon, VolumeIcon, MessageSquareIcon } from './Icons';

interface ViewerControlsProps {
    onFullscreen: () => void;
    volume: number;
    onVolumeChange: (volume: number) => void;
    isMuted: boolean;
    onMuteToggle: () => void;
    hasSubtitles?: boolean;
    isSubtitleEnabled?: boolean;
    onToggleSubtitle?: () => void;
    // Quality Control
    currentQuality?: 'high' | 'sd' | 'low';
    onQualityChange?: (quality: 'high' | 'sd' | 'low') => void;
}

export function ViewerControls({
    onFullscreen,
    volume,
    onVolumeChange,
    isMuted,
    onMuteToggle,
    hasSubtitles,
    isSubtitleEnabled,
    onToggleSubtitle,
    currentQuality,
    onQualityChange,
}: ViewerControlsProps) {
    return (
        <div className="w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-4 safe-area-pb">
            <div className="flex items-center justify-center gap-4">
                {/* Mute Button */}
                <Button
                    onClick={onMuteToggle}
                    variant="ghost"
                    size="icon"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <VolumeIcon className="w-5 h-5" />
                    )}
                </Button>

                {/* Subtitle Toggle Button */}
                {hasSubtitles && onToggleSubtitle && (
                    <Button
                        onClick={onToggleSubtitle}
                        variant="ghost"
                        size="icon"
                        className={cn("transition-colors",
                            isSubtitleEnabled ? "text-indigo-400" : "text-white"
                        )}
                        aria-label="Toggle Subtitles"
                    >
                        <MessageSquareIcon className="w-6 h-6" />
                    </Button>
                )}

                {/* Volume Slider */}
                <div className="flex items-center gap-2 w-24 sm:w-32">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-neutral-700 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-white
                       [&::-webkit-slider-thumb]:shadow-md
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-3
                       [&::-moz-range-thumb]:h-3
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-white
                       [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:cursor-pointer"
                    />
                </div>

                {/* Custom Quality Selector */}
                {onQualityChange && (
                    <CustomQualitySelector
                        currentQuality={currentQuality || 'sd'}
                        onQualityChange={onQualityChange}
                    />
                )}

                {/* Fullscreen Button */}
                <Button
                    onClick={onFullscreen}
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle fullscreen"
                >
                    <FullscreenIcon className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}

// Custom Quality Selector Component
function CustomQualitySelector({
    currentQuality,
    onQualityChange
}: {
    currentQuality: 'high' | 'sd' | 'low';
    onQualityChange: (quality: 'high' | 'sd' | 'low') => void;
}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const qualities = [
        { value: 'high' as const, label: 'High Quality', icon: '' },
        { value: 'sd' as const, label: 'SD Quality', icon: '' },
        { value: 'low' as const, label: 'Low Quality', icon: '' }
    ];

    const currentLabel = qualities.find(q => q.value === currentQuality)?.label || 'SD Quality';

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className="relative">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="ghost"
                size="sm"
                className={cn(
                    "text-xs transition-all",
                    isOpen ? "text-white bg-white/10" : "text-white/70 hover:text-white"
                )}
            >
                <span className="hidden sm:inline">{currentLabel}</span>
                <span className="sm:hidden">Quality</span>
                <svg
                    className={cn("w-3 h-3 ml-1 transition-transform", isOpen && "rotate-180")}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </Button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 right-0 bg-neutral-900 border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {qualities.map((quality) => (
                        <button
                            key={quality.value}
                            onClick={() => {
                                onQualityChange(quality.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors whitespace-nowrap",
                                currentQuality === quality.value
                                    ? "bg-indigo-600 text-white"
                                    : "text-white/80 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <span className="text-base">{quality.icon}</span>
                            <span>{quality.label}</span>
                            {currentQuality === quality.value && (
                                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
