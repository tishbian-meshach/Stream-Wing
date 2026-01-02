import { useEffect, useRef, useState, useCallback } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { ViewerPeerManager } from '../webrtc/viewer';
import { StatusBadge } from '../components/StatusBadge';
import { ViewerControls } from '../components/ViewerControls';
import { ArrowLeftIcon, WifiIcon } from '../components/Icons';

export function ViewerRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const peerId = location.state?.peerId || Math.random().toString(36).substr(2, 9);

    const { joinRoom, signaling, onSignalRef } = useRoom(peerId);
    const [_viewerManager, setViewerManager] = useState<ViewerPeerManager | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'connecting' | 'streaming' | 'offline'>('connecting');
    const pendingStreamRef = useRef<MediaStream | null>(null);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isBuffering, setIsBuffering] = useState(false);

    // Volume controls
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    // Auto-join
    useEffect(() => {
        if (roomId) {
            joinRoom(roomId);
        }
    }, [roomId]);

    // Apply stream to video when available
    const applyStream = useCallback((stream: MediaStream) => {
        console.log("Applying stream to video element");
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
            setStatus('streaming');
            pendingStreamRef.current = null;
        } else {
            console.log("Video ref not ready, storing stream");
            pendingStreamRef.current = stream;
        }
    }, []);

    // Check for pending stream when video ref is ready
    useEffect(() => {
        if (videoRef.current && pendingStreamRef.current) {
            console.log("Applying pending stream");
            videoRef.current.srcObject = pendingStreamRef.current;
            videoRef.current.play().catch(console.error);
            setStatus('streaming');
            pendingStreamRef.current = null;
        }
    });

    // Init Manager
    useEffect(() => {
        if (!roomId) return;

        const keepAwake = async () => {
            try { await KeepAwake.keepAwake(); } catch (e) { console.warn('KeepAwake not supported', e); }
        };
        keepAwake();

        const manager = new ViewerPeerManager(
            signaling,
            roomId,
            (stream) => {
                console.log("ViewerRoom received stream");
                applyStream(stream);
            },
            (event) => {
                console.log("Sync Event", event);
                if (!videoRef.current) return;
                const TOLERANCE = 0.5;

                if (event.action === 'play') {
                    videoRef.current.play();
                    if (Math.abs(videoRef.current.currentTime - event.time) > TOLERANCE) {
                        videoRef.current.currentTime = event.time;
                    }
                } else if (event.action === 'pause') {
                    videoRef.current.pause();
                    videoRef.current.currentTime = event.time;
                } else if (event.action === 'seek') {
                    videoRef.current.currentTime = event.time;
                }
            }
        );

        console.log("Viewer Manager connecting as:", peerId);
        manager.connect(peerId);
        setViewerManager(manager);

        if (onSignalRef.current !== undefined) {
            onSignalRef.current = (data, from) => manager.handleSignal(data, from);
        }

        return () => {
            manager.cleanup();
            KeepAwake.allowSleep().catch(() => { });
            if (onSignalRef.current) onSignalRef.current = null;
        };
    }, [roomId, signaling, peerId, applyStream]);

    // Volume control
    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const handleMuteToggle = () => {
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    // Fullscreen
    const handleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    const handleVideoTap = () => {
        setShowControls(prev => !prev);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (!showControls) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black text-white overflow-hidden">
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-30 px-3 sm:px-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 safe-area-pt ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex items-center justify-between gap-3 min-h-[56px]">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        {roomId && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                                <span className="font-mono text-xs text-gray-200">{roomId}</span>
                            </div>
                        )}
                    </div>

                    <div className="w-10" />
                </div>
            </header>

            {/* Video Area */}
            <div
                className="absolute inset-0 flex items-center justify-center bg-black"
                onClick={handleVideoTap}
            >
                {/* Initial Connection Loading */}
                {status !== 'streaming' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/90 gap-4 px-6">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-neutral-700 border-t-indigo-500 animate-spin" />
                            <WifiIcon className="absolute inset-0 m-auto w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-lg font-medium">Connecting to stream</p>
                            <p className="text-sm text-gray-400">Waiting for host to start...</p>
                        </div>
                    </div>
                )}

                {/* Buffering Indicator */}
                {status === 'streaming' && isBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-[2px]">
                        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                    </div>
                )}

                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls={false}
                    playsInline
                    autoPlay
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                    onCanPlay={() => setIsBuffering(false)}
                />
            </div>

            {/* Viewer Controls - Overlay */}
            {status === 'streaming' && (
                <div className={`fixed bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <ViewerControls
                        onFullscreen={handleFullscreen}
                        volume={volume}
                        onVolumeChange={handleVolumeChange}
                        isMuted={isMuted}
                        onMuteToggle={handleMuteToggle}
                    />
                </div>
            )}

            {/* Bottom safe area spacer */}
            <div className="fixed bottom-0 left-0 right-0 h-safe-area-inset-bottom bg-black z-0" />
        </div>
    );
}
