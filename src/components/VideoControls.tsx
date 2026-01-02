import React from 'react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { PlayIcon, PauseIcon, FullscreenIcon, VolumeIcon } from './Icons';

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
}: VideoControlsProps) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 py-4 sm:py-6">
            {/* Progress Bar */}
            {duration > 0 && (
                <div className="mb-4">
                    <div
                        className="relative h-1.5 bg-neutral-700 rounded-full cursor-pointer group"
                        onClick={(e) => {
                            if (onSeek && duration > 0) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const percent = (e.clientX - rect.left) / rect.width;
                                onSeek(percent * duration);
                            }
                        }}
                    >
                        <div
                            className="absolute h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                        <div
                            className="absolute h-4 w-4 bg-white rounded-full shadow-lg transform -translate-y-1/4 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `calc(${progress}% - 8px)` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 sm:gap-4">
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
        </div>
    );
}
