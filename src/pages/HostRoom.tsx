import { useEffect, useRef, useState } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { HostPeerManager } from '../webrtc/host';
import { Button } from '../components/Button';
import { ConnectionStatus } from '../components/StatusBadge';
import { VideoControls } from '../components/VideoControls';
import { FilmIcon, UploadIcon, ArrowLeftIcon, CopyIcon, ShareIcon } from '../components/Icons';

export function HostRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const peerId = location.state?.peerId || Math.random().toString(36).substr(2, 9);

    const { viewers, hostRoom, signaling, onSignalRef } = useRoom(peerId);
    const [hostManager, setHostManager] = useState<HostPeerManager | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [streamActive, setStreamActive] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [copied, setCopied] = useState(false);

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
        setHostManager(manager);

        if (onSignalRef.current !== undefined) {
            onSignalRef.current = (data, from) => manager.handleSignal(data, from);
        }

        return () => {
            manager.cleanup();
            KeepAwake.allowSleep().catch(() => { });
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
        }
    };

    // Start stream
    const startStream = () => {
        try {
            if (videoRef.current && hostManager) {
                // @ts-ignore
                const stream = videoRef.current.captureStream ? videoRef.current.captureStream() : (videoRef.current as any).mozCaptureStream?.();

                if (!stream) {
                    console.error("captureStream not supported");
                    return;
                }

                hostManager.setStream(stream);
                setStreamActive(true);
                videoRef.current.play();
                setIsPlaying(true);
            }
        } catch (e) {
            console.error("Failed to start stream:", e);
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
            videoRef.current.play();
            setIsPlaying(true);
            hostManager.broadcastSyncEvent({ action: 'play', time: videoRef.current.currentTime, timestamp: Date.now() });
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
        }
    };

    // Copy room ID
    const copyRoomId = async () => {
        if (roomId) {
            await navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Fullscreen
    const handleFullscreen = () => {
        videoRef.current?.requestFullscreen?.();
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-20 px-3 py-3 sm:px-4 sm:py-4 bg-gradient-to-b from-black/90 to-transparent">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 -ml-2 hover:bg-neutral-800 rounded-lg transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>

                    <ConnectionStatus viewerCount={viewers.length} roomId={roomId} isHost />

                    <button
                        onClick={copyRoomId}
                        className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                        aria-label="Copy room ID"
                    >
                        {copied ? (
                            <span className="text-green-400 text-sm">Copied</span>
                        ) : (
                            <ShareIcon className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </header>

            {/* Video Area */}
            <main className="flex-1 flex items-center justify-center pt-16 pb-32">
                <video
                    ref={videoRef}
                    className="w-full h-full max-h-[calc(100vh-12rem)] object-contain"
                    controls={false}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onSeeked={() => {
                        if (videoRef.current && hostManager) {
                            hostManager.broadcastSyncEvent({ action: 'seek', time: videoRef.current.currentTime, timestamp: Date.now() });
                        }
                    }}
                />

                {/* Empty State */}
                {!file && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 gap-6 px-6">
                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center">
                            <FilmIcon className="w-10 h-10 text-gray-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-semibold">Select a Video</h2>
                            <p className="text-gray-400 text-sm max-w-xs">
                                Choose a video file from your device to start streaming
                            </p>
                        </div>
                        <label className="cursor-pointer">
                            <Button
                                as="span"
                                icon={<UploadIcon className="w-5 h-5" />}
                                size="lg"
                            >
                                Choose File
                            </Button>
                            <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                )}
            </main>

            {/* Controls */}
            {file && (
                <div className="fixed bottom-0 left-0 right-0 z-20 safe-area-pb">
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
                    />
                </div>
            )}
        </div>
    );
}
