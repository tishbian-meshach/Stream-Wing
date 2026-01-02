import { useEffect, useRef, useState, useCallback } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { ViewerPeerManager } from '../webrtc/viewer';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeftIcon, WifiIcon } from '../components/Icons';

export function ViewerRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const peerId = location.state?.peerId || Math.random().toString(36).substr(2, 9);

    const { joinRoom, signaling, onSignalRef } = useRoom(peerId);
    const [viewerManager, setViewerManager] = useState<ViewerPeerManager | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'connecting' | 'streaming' | 'offline'>('connecting');
    const pendingStreamRef = useRef<MediaStream | null>(null);

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

                    <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        {roomId && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neutral-800 rounded-lg">
                                <span className="font-mono text-sm text-gray-300">{roomId}</span>
                            </div>
                        )}
                    </div>

                    <div className="w-10" />
                </div>
            </header>

            {/* Video Area */}
            <main className="flex-1 flex items-center justify-center">
                {status !== 'streaming' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80 gap-4 px-6">
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

                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls={false}
                    playsInline
                    autoPlay
                    muted={false}
                />
            </main>

            <div className="h-safe-area-inset-bottom bg-black" />
        </div>
    );
}
