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
