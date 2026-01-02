import { useEffect, useRef, useState } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { useParams, useLocation } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { ViewerPeerManager } from '../webrtc/viewer';

export function ViewerRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const peerId = location.state?.peerId || Math.random().toString(36).substr(2, 9);

    const { isHost, joinRoom, signaling, onSignalRef } = useRoom(peerId);
    const [viewerManager, setViewerManager] = useState<ViewerPeerManager | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState('Connecting...');

    // Auto-join
    useEffect(() => {
        if (roomId) {
            joinRoom(roomId);
        }
    }, [roomId]);

    // Init Manager
    useEffect(() => {
        if (!roomId) return;

        // Prevent Sleep
        const keepAwake = async () => {
            try { await KeepAwake.keepAwake(); } catch (e) { console.warn('KeepAwake not supported', e); }
        };
        keepAwake();

        const manager = new ViewerPeerManager(
            signaling,
            roomId,
            (stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(console.error); // Auto-play
                    setStatus('Streaming');
                }
            },
            (event) => {
                // Handle Sync
                console.log("Sync Event", event);
                if (!videoRef.current) return;
                const TOLERANCE = 0.5; // seconds

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
    }, [roomId, signaling, peerId]);

    return (
        <div className="flex flex-col h-screen bg-black justify-center items-center">
            {status !== 'Streaming' && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                    <div className="animate-pulse text-white font-mono">{status}</div>
                </div>
            )}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls // Viewer can have controls but usually hidden to force sync
                playsInline
            />
        </div>
    );
}
