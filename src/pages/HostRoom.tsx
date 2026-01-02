import { useEffect, useRef, useState } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { HostPeerManager } from '../webrtc/host';
import { ConnectionStatus } from '../components/StatusBadge';
import { VideoControls, DoubleTapOverlay } from '../components/VideoControls';
import { FilmIcon, UploadIcon, ArrowLeftIcon, ShareIcon } from '../components/Icons';
import { shareContent, isNativePlatform, enterImmersiveMode, exitImmersiveMode } from '../lib/platform';

export function HostRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [peerId] = useState(() => location.state?.peerId || Math.random().toString(36).substr(2, 9));

    const { viewers, hostRoom, signaling, onSignalRef } = useRoom(peerId);
    const [hostManager, setHostManager] = useState<HostPeerManager | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [streamActive, setStreamActive] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [_showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [ping, setPing] = useState(0);

    // Subscribe to room
    useEffect(() => {
        if (roomId) {
            console.log("Host subscribing to room:", roomId);
            hostRoom(roomId);
        }
    }, [roomId]);

    // Initialize HostManager
    useEffect(() => {
        if (!roomId) return;

        const keepAwake = async () => {
            try { await KeepAwake.keepAwake(); } catch (e) { console.warn('KeepAwake not supported', e); }
        };
        keepAwake();

        const manager = new HostPeerManager(signaling, roomId);
        manager.startStatsLoop((rtt) => setPing(rtt));
        setHostManager(manager);

        if (onSignalRef.current !== undefined) {
            onSignalRef.current = (data, from) => manager.handleSignal(data, from);
        }

        return () => {
            manager.cleanup();
            KeepAwake.allowSleep().catch(() => { });
            exitImmersiveMode(); // Reset orientation
            if (onSignalRef.current) onSignalRef.current = null;
        };
    }, [roomId, signaling]);

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected && videoRef.current) {
            setFile(selected);
            const url = URL.createObjectURL(selected);
            videoRef.current.src = url;

            // If we were already streaming, restart the stream with the new file
            // give it a moment to load
            if (streamActive) {
                // Stop current
                setStreamActive(false);
                setIsPlaying(false);

                // Wait for video to be ready with new source
                videoRef.current.oncanplay = () => {
                    videoRef.current!.oncanplay = null; // cleanup
                    startStream();
                };
            }
        }
    };

    // Start stream
    const startStream = () => {
        if (!videoRef.current || !hostManager) return;

        const playAndStream = () => {
            try {
                // @ts-ignore
                const stream = videoRef.current.captureStream ? videoRef.current.captureStream() : (videoRef.current as any).mozCaptureStream?.();

                if (!stream) {
                    console.error("captureStream not supported");
                    return;
                }

                console.log("Starting stream with tracks:", stream.getTracks().length);
                if (stream.getTracks().length === 0) {
                    console.warn("Stream has no tracks, retrying in 500ms");
                    setTimeout(() => startStream(), 500);
                    return;
                }

                hostManager.setStream(stream);
                setStreamActive(true);
                // Handle play promise
                const playPromise = videoRef.current!.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.error("Play failed:", e));
                }
                setIsPlaying(true);
                // Ensure viewers start playing immediately
                hostManager.broadcastSyncEvent({ action: 'play', time: 0, timestamp: Date.now() });
            } catch (e) {
                console.error("Failed to start stream:", e);
            }
        };

        if (videoRef.current.readyState >= 3) { // HAVE_FUTURE_DATA
            playAndStream();
        } else {
            console.log("Waiting for video to be ready...");
            videoRef.current.oncanplay = () => {
                if (videoRef.current) {
                    videoRef.current.oncanplay = null;
                    playAndStream();
                }
            };
        }
    };

    // Handle viewers
    useEffect(() => {
        if (!hostManager) return;
        viewers.forEach(v => hostManager.handleViewerJoin(v));
    }, [viewers, hostManager]);

    // Toggle play/pause
    const togglePlay = () => {
        if (!videoRef.current || !hostManager) return;
        if (videoRef.current.paused) {
            // "Super Power" Play: Force a stream restart/re-capture to fix any sync/connection issues
            // This acts like a "server restart" for the P2P connection
            console.log("Super Play triggered: Refreshing stream context");
            startStream();
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
            hostManager.broadcastSyncEvent({ action: 'pause', time: videoRef.current.currentTime, timestamp: Date.now() });
        }
    };

    // Seek
    const handleSeek = (time: number) => {
        if (!videoRef.current || !hostManager) return;
        videoRef.current.currentTime = time;
        hostManager.broadcastSyncEvent({ action: 'seek', time, timestamp: Date.now() });
    };

    // Video time updates
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            // Force rendering of first frame on mobile if at start
            if (videoRef.current.currentTime === 0) {
                videoRef.current.currentTime = 0.001;
            }
        }
    };

    // Share/Copy room ID
    const shareRoomId = async () => {
        if (!roomId) return;

        const shareUrl = `${window.location.origin}/viewer/${roomId}`;

        if (isNativePlatform()) {
            // Use native share on Android/iOS
            const success = await shareContent({
                title: 'Join my StreamWing room',
                text: `Join my watch party! Room ID: ${roomId}`,
                url: shareUrl,
            });
            if (success) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } else {
            // Web fallback - copy to clipboard
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Immersive Mode
    const [isImmersive, setIsImmersive] = useState(false);

    const handleFullscreen = async () => {
        if (!isImmersive) {
            await enterImmersiveMode();
            setIsImmersive(true);
            setShowControls(false); // Auto hide controls for immersion
        } else {
            await exitImmersiveMode();
            setIsImmersive(false);
        }
    };

    // Handle video ended - sync to viewers
    const handleVideoEnded = () => {
        setIsPlaying(false);
        if (hostManager) {
            hostManager.broadcastSyncEvent({ action: 'pause', time: 0, timestamp: Date.now() });
        }
    };

    // Change video file
    const handleChangeFile = () => {
        fileInputRef.current?.click();
    };

    // Skip forward/backward
    const SKIP_SECONDS = 10;

    const handleSkipForward = () => {
        if (!videoRef.current || !hostManager) return;
        const newTime = Math.min(videoRef.current.currentTime + SKIP_SECONDS, duration);
        videoRef.current.currentTime = newTime;
        hostManager.broadcastSyncEvent({ action: 'seek', time: newTime, timestamp: Date.now() });
    };

    const handleSkipBackward = () => {
        if (!videoRef.current || !hostManager) return;
        const newTime = Math.max(videoRef.current.currentTime - SKIP_SECONDS, 0);
        videoRef.current.currentTime = newTime;
        hostManager.broadcastSyncEvent({ action: 'seek', time: newTime, timestamp: Date.now() });
    };

    // Toggle controls visibility
    const handleVideoTap = () => {
        setShowControls(prev => !prev);

        // Auto-hide after 3 seconds
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden">
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-30 px-3 sm:px-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 safe-area-pt ${(file && !_showControls) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center justify-between gap-3 min-h-[56px]">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>

                    <ConnectionStatus viewerCount={viewers.length} roomId={roomId} isHost ping={ping} />

                    <button
                        onClick={shareRoomId}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Share room"
                    >
                        {copied ? (
                            <span className="text-green-400 text-sm">Shared!</span>
                        ) : (
                            <ShareIcon className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </header>

            {/* Video Area */}
            <main className="absolute inset-0 flex items-center justify-center bg-black">
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls={false}
                    playsInline
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onSeeked={() => {
                        if (videoRef.current && hostManager) {
                            hostManager.broadcastSyncEvent({ action: 'seek', time: videoRef.current.currentTime, timestamp: Date.now() });
                        }
                    }}
                    onEnded={handleVideoEnded}
                />

                {/* Double Tap Overlay for skip */}
                {file && (
                    <DoubleTapOverlay
                        onDoubleTapLeft={handleSkipBackward}
                        onDoubleTapRight={handleSkipForward}
                        onSingleTap={handleVideoTap}
                    />
                )}

                {/* Hidden file input for changing video */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Empty State */}
                {!file && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 px-6 z-20">
                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
                            <FilmIcon className="w-10 h-10 text-gray-500" />
                        </div>
                        <div className="text-center space-y-2 mb-8">
                            <h2 className="text-xl font-semibold">Select a Video</h2>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                Choose a video file from your device to start streaming
                            </p>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-500/20"
                        >
                            <UploadIcon className="w-5 h-5" />
                            Choose File
                        </button>
                    </div>
                )}
            </main>

            {/* Controls - Overlay */}
            {file && (
                <div className={`fixed bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${!_showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <VideoControls
                        isPlaying={isPlaying}
                        onPlayPause={togglePlay}
                        onFullscreen={handleFullscreen}
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek}
                        showStartStream={!streamActive}
                        onStartStream={startStream}
                        streamActive={streamActive}
                        onChangeFile={handleChangeFile}
                        onSkipForward={handleSkipForward}
                        onSkipBackward={handleSkipBackward}
                    />
                </div>
            )}

            {/* Bottom safe area spacer */}
            <div className="fixed bottom-0 left-0 right-0 h-safe-area-inset-bottom bg-black z-0" />
        </div>
    );
}
