import { useEffect, useRef, useState } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';

import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { HostPeerManager } from '../webrtc/host';
import { Play, Pause, Film } from 'lucide-react';
import { SignalingService } from '../services/signaling'; // Import specifically

export function HostRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const peerId = location.state?.peerId || Math.random().toString(36).substr(2, 9);

    const { viewers, isHost, hostRoom, signaling, onSignalRef } = useRoom(peerId);
    const [hostManager, setHostManager] = useState<HostPeerManager | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initialize Room (Host Mode) - Subscribe to the signaling channel
    useEffect(() => {
        if (roomId) {
            console.log("Host subscribing to room:", roomId);
            hostRoom(roomId);
        }
    }, [roomId]);

    // Initialize HostManager
    useEffect(() => {
        if (!roomId) return;

        // Prevent Sleep
        const keepAwake = async () => {
            try { await KeepAwake.keepAwake(); } catch (e) { console.warn('KeepAwake not supported', e); }
        };
        keepAwake();

        const manager = new HostPeerManager(signaling, roomId);
        setHostManager(manager);

        // Hook up signal listener
        if (onSignalRef.current !== undefined) {
            onSignalRef.current = (data, from) => manager.handleSignal(data, from);
        }

        return () => {
            manager.cleanup();
            KeepAwake.allowSleep().catch(() => { });
            if (onSignalRef.current) onSignalRef.current = null;
        };
    }, [roomId, signaling]);

    // Handle Video Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected && videoRef.current) {
            setFile(selected);
            const url = URL.createObjectURL(selected);
            videoRef.current.src = url;

            // Capture stream
            // Note: captureStream might need a play() first or be initiated
            // videoRef.current.play().then(() => videoRef.current.pause()); 
        }
    };

    const startStream = () => {
        try {
            if (videoRef.current && hostManager) {
                // @ts-ignore
                const stream = videoRef.current.captureStream ? videoRef.current.captureStream() : (videoRef.current as any).mozCaptureStream ? (videoRef.current as any).mozCaptureStream() : null;

                if (!stream) {
                    console.error("captureStream not supported");
                    alert("Browser does not support captureStream");
                    return;
                }

                hostManager.setStream(stream);
                console.log("Stream set and broadcasting");

                // Force play to ensure stream data flows
                videoRef.current.play();
                setIsPlaying(true);
            }
        } catch (e) {
            console.error("Failed to start stream:", e);
        }
    };

    // Handle Viewers
    useEffect(() => {
        if (!hostManager) return;

        // Check for new viewers (naive diffing)
        // Ideally we track which ones we've already added.
        // HostPeerManager.handleViewerJoin checks duplication internally.
        viewers.forEach(v => {
            hostManager.handleViewerJoin(v);
        });
    }, [viewers, hostManager]);

    // Sync Controls
    const togglePlay = () => {
        if (!videoRef.current || !hostManager) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
            hostManager.broadcastSyncEvent({
                action: 'play',
                time: videoRef.current.currentTime,
                timestamp: Date.now()
            });
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
            hostManager.broadcastSyncEvent({
                action: 'pause',
                time: videoRef.current.currentTime,
                timestamp: Date.now()
            });
        }
    };

    const handleSeek = () => {
        // similar logic for seek
        if (!videoRef.current || !hostManager) return;
        hostManager.broadcastSyncEvent({
            action: 'seek',
            time: videoRef.current.currentTime,
            timestamp: Date.now()
        });
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <header className="fixed top-0 w-full bg-gradient-to-b from-black/80 to-transparent p-4 z-10 flex justify-between items-center">
                <div>
                    <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold mr-2">LIVE</span>
                    <span className="font-mono text-sm">{roomId}</span>
                </div>
                <div className="text-sm text-gray-400">
                    {viewers.length} Viewer(s)
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center relative">
                <video
                    ref={videoRef}
                    className="w-full max-h-screen object-contain"
                    controls={false} // Custom controls
                    onSeeked={handleSeek}
                    playsInline
                />

                {!file && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 gap-4">
                        <Film className="w-16 h-16 text-gray-500" />
                        <label className="cursor-pointer bg-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                            Select Video File
                            <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                )}
            </main>

            {file && (
                <div className="fixed bottom-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent flex justify-center gap-6 pb-12">
                    <button onClick={startStream} className="bg-gray-800 p-3 rounded-full hover:bg-gray-700">
                        Start Stream (Internal)
                    </button>
                    <button onClick={togglePlay} className="bg-white text-black p-4 rounded-full hover:bg-gray-200 shadow-lg scale-100 active:scale-95 transition-transform">
                        {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
                    </button>
                    {/* Add Scrubber/Seekbar here */}
                </div>
            )}
        </div>
    );
}
