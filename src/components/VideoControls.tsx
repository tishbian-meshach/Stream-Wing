import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { PlayIcon, PauseIcon, FullscreenIcon, FilmIcon, MessageSquareIcon, MusicIcon } from './Icons';

interface VideoControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onFullscreen?: () => void;
    currentTime?: number;
    duration?: number;
    onSeek?: (time: number) => void;
    disabled?: boolean;
    showStartStream?: boolean;
    onStartStream?: () => void;
    streamActive?: boolean;
    onChangeFile?: () => void;
    onSkipForward?: () => void;
    onSkipBackward?: () => void;
    // Media Enhancements
    onUploadSubtitle?: () => void;
    onToggleSubtitle?: () => void;
    hasSubtitles?: boolean;
    isSubtitleEnabled?: boolean;
    audioTracks?: any[];
    onAudioTrackChange?: () => void;
}

// Skip indicator component
function SkipIndicator({ direction, visible }: { direction: 'forward' | 'backward'; visible: boolean }) {
    if (!visible) return null;

    return (
        <div className={cn(
            "absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 animate-pulse",
            direction === 'forward' ? 'right-8' : 'left-8'
        )}>
            <div className="flex gap-0.5">
                {direction === 'backward' && (
                    <>
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                        </svg>
                    </>
                )}
                {direction === 'forward' && (
                    <>
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                        </svg>
                    </>
                )}
            </div>
            <span className="text-xs text-white font-medium">10s</span>
        </div>
    );
}

export function VideoControls({
    isPlaying,
    onPlayPause,
    onFullscreen,
    currentTime = 0,
    duration = 0,
    onSeek,
    disabled = false,
    showStartStream = false,
    onStartStream,
    streamActive = false,
    onChangeFile,
    onSkipForward,
    onSkipBackward,
    onUploadSubtitle,
    onToggleSubtitle,
    hasSubtitles,
    isSubtitleEnabled,
    audioTracks,
    onAudioTrackChange,
}: VideoControlsProps) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const progressBarRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragProgress, setDragProgress] = useState(0);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate position from mouse/touch event
    const getProgressFromEvent = useCallback((clientX: number) => {
        if (!progressBarRef.current || duration <= 0) return 0;
        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return percent * duration;
    }, [duration]);

    // Mouse handlers for dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        const time = getProgressFromEvent(e.clientX);
        setDragProgress((time / duration) * 100);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const time = getProgressFromEvent(e.clientX);
        setDragProgress((time / duration) * 100);
    }, [isDragging, getProgressFromEvent, duration]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        const time = getProgressFromEvent(e.clientX);
        onSeek?.(time);
    }, [isDragging, getProgressFromEvent, onSeek]);

    // Touch handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        const time = getProgressFromEvent(e.touches[0].clientX);
        setDragProgress((time / duration) * 100);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const time = getProgressFromEvent(e.touches[0].clientX);
        setDragProgress((time / duration) * 100);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        const time = getProgressFromEvent(e.changedTouches[0].clientX);
        onSeek?.(time);
    };

    // Attach global mouse listeners when dragging
    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const displayProgress = isDragging ? dragProgress : progress;

    return (
        <div className="w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 py-4 sm:py-6">
            {/* Progress Bar */}
            {duration > 0 && (
                <div className="mb-4 py-2">
                    <div
                        ref={progressBarRef}
                        className={cn(
                            "relative h-1.5 bg-neutral-700 rounded-full cursor-pointer group overflow-visible",
                            isDragging && "h-2"
                        )}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={(e) => {
                            if (!isDragging && onSeek && duration > 0) {
                                const time = getProgressFromEvent(e.clientX);
                                onSeek(time);
                            }
                        }}
                    >
                        {/* Progress fill */}
                        <div
                            className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                            style={{ width: `${displayProgress}%` }}
                        />
                        {/* Thumb/handle */}
                        <div
                            className={cn(
                                "absolute w-4 h-4 bg-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 transition-all",
                                isDragging ? "opacity-100 scale-125" : "opacity-0 group-hover:opacity-100"
                            )}
                            style={{
                                left: `${displayProgress}%`,
                                top: '50%',
                            }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>{formatTime(isDragging ? (dragProgress / 100) * duration : currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 sm:gap-4">
                {/* Change File Button */}
                {onChangeFile && streamActive && (
                    <Button
                        onClick={onChangeFile}
                        variant="ghost"
                        size="icon"
                        aria-label="Change video file"
                    >
                        <FilmIcon className="w-5 h-5" />
                    </Button>
                )}

                {showStartStream && !streamActive && (
                    <Button
                        onClick={onStartStream}
                        variant="primary"
                        size="md"
                        className="mr-2"
                    >
                        Start Stream
                    </Button>
                )}

                {/* Skip Backward */}
                {onSkipBackward && (
                    <Button
                        onClick={onSkipBackward}
                        variant="ghost"
                        size="icon"
                        aria-label="Skip backward 10 seconds"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                        </svg>
                    </Button>
                )}

                <Button
                    onClick={onPlayPause}
                    disabled={disabled}
                    variant="primary"
                    size="icon"
                    className="w-14 h-14 sm:w-16 sm:h-16"
                >
                    {isPlaying ? (
                        <PauseIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                    ) : (
                        <PlayIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                    )}
                </Button>

                {/* Skip Forward */}
                {onSkipForward && (
                    <Button
                        onClick={onSkipForward}
                        variant="ghost"
                        size="icon"
                        aria-label="Skip forward 10 seconds"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                        </svg>
                    </Button>
                )}

                {onFullscreen && (
                    <Button
                        onClick={onFullscreen}
                        variant="ghost"
                        size="icon"
                    >
                        <FullscreenIcon className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {/* Secondary Controls Row (Subtitles/Audio) */}
            {(onUploadSubtitle || hasSubtitles || (audioTracks && audioTracks.length > 1)) && (
                <div className="flex items-center justify-center gap-4 mt-2">
                    {(onUploadSubtitle || hasSubtitles) && (
                        <Button
                            onClick={onUploadSubtitle && !hasSubtitles ? onUploadSubtitle : onToggleSubtitle}
                            variant="ghost"
                            size="sm"
                            className={cn("text-xs transition-colors",
                                isSubtitleEnabled ? "text-indigo-400 hover:text-indigo-300" : "text-white/70 hover:text-white"
                            )}
                        >
                            <MessageSquareIcon className="w-4 h-4 mr-1.5" />
                            {onUploadSubtitle && !hasSubtitles ? 'Add Subs' : (isSubtitleEnabled ? 'CC On' : 'CC Off')}
                        </Button>
                    )}

                    {audioTracks && audioTracks.length > 1 && onAudioTrackChange && (
                        <Button
                            onClick={onAudioTrackChange}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-white/70 hover:text-white"
                        >
                            <MusicIcon className="w-4 h-4 mr-1.5" />
                            Audio
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// Double tap overlay component for video area
interface DoubleTapOverlayProps {
    onDoubleTapLeft: () => void;
    onDoubleTapRight: () => void;
    onSingleTap?: () => void;
}

export function DoubleTapOverlay({ onDoubleTapLeft, onDoubleTapRight, onSingleTap }: DoubleTapOverlayProps) {
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | null }>({ time: 0, side: null });
    const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent ghost clicks from double handling
        // If we handle touch, we shouldn't handle the subsequent click
        // React's SyntheticEvent system might still bubble, so we check carefully.

        // If it's a touch event, it's the "real" tap on mobile.
        // If it's a click, it might be a mouse click OR a delayed touch click.

        // Simple strategy: Use onClick for everything, but on mobile use onTouchEnd to trigger FAST tap and prevent clicking?
        // No, standard practice: handle both but debounce/lock.

        // BETTER FIX: onTouchEnd calls preventDefault to stop mouse emulation (click)
        // But need to be careful not to block other interactions if nested.
        // Since this is an overlay, blocking is fine.

        console.log("Tap event:", e.type);

        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const side = relativeX < rect.width / 2 ? 'left' : 'right';

        const now = Date.now();
        const timeDiff = now - lastTapRef.current.time;

        if (timeDiff < 300 && lastTapRef.current.side === side) {
            // Double tap detected
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
                tapTimeoutRef.current = null;
            }

            if (side === 'left') {
                onDoubleTapLeft();
                setShowLeft(true);
                setTimeout(() => setShowLeft(false), 500);
            } else {
                onDoubleTapRight();
                setShowRight(true);
                setTimeout(() => setShowRight(false), 500);
            }

            lastTapRef.current = { time: 0, side: null };

            // If touch, prevent ghost click
            if (e.type === 'touchend' && e.cancelable) {
                e.preventDefault();
            }
        } else {
            // First tap
            lastTapRef.current = { time: now, side };

            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
            }

            tapTimeoutRef.current = setTimeout(() => {
                // Signal single tap only if we haven't double tapped
                onSingleTap?.();
                lastTapRef.current = { time: 0, side: null };
            }, 300);
        }
    };

    return (
        <div
            className="absolute inset-0 z-10"
            onClick={handleTap}
            onTouchEnd={(e) => {
                // Prevent ghost click (mouse emulation) entirely
                // We handle the tap logic right here via handleTap
                if (e.cancelable) e.preventDefault();
                handleTap(e);
            }}
        >
            <SkipIndicator direction="backward" visible={showLeft} />
            <SkipIndicator direction="forward" visible={showRight} />
        </div>
    );
}
