import { useEffect, useState, useRef } from 'react';
import { SignalingService } from '../services/signaling';

export function useRoom(peerId: string) {
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [viewers, setViewers] = useState<string[]>([]);
    // We need a way to expose signals to Host/Viewer managers
    // Use event emitter or callback ref? 
    // Let's use a callback registry or expose the listener setup
    // Actually, useRoom is high level. managers need direct access or we pass callbacks to useRoom?

    // Better: SignalingService is singleton-ish or passed down.
    // The managers need to attach listeners.
    // But Supabase channel allows only one subscription per topic ideally? Or multiple listeners?
    // Multiple listeners on one channel is fine.

    const signaling = useRef(new SignalingService(peerId)).current;
    const [peers, setPeers] = useState<Set<string>>(new Set());

    // Callback refs for managers to hook into
    const onSignalRef = useRef<((payload: any, from: string) => void) | null>(null);

    const createRoom = async () => {
        const id = await signaling.createRoom();
        setRoomId(id);
        setIsHost(true);
        return id;
    };

    const joinRoom = async (id: string) => {
        await signaling.joinRoom(id);
        setRoomId(id);
        setIsHost(false);
    };

    const hostRoom = async (id: string) => {
        // Host also needs to subscribe to the channel
        setRoomId(id);
        setIsHost(true);
    };

    useEffect(() => {
        if (!roomId) return;

        signaling.subscribe(
            roomId,
            (pId) => {
                console.log("Peer Joined:", pId);
                setPeers(prev => {
                    const next = new Set(prev);
                    next.add(pId);
                    return next;
                });
                setViewers(Array.from(peers)); // Sync viewers state
            },
            (pId) => {
                console.log("Peer Left:", pId);
                setPeers(prev => {
                    const next = new Set(prev);
                    next.delete(pId);
                    return next;
                });
                setViewers(Array.from(peers));
            },
            (data, from) => {
                if (onSignalRef.current) {
                    onSignalRef.current(data, from);
                }
            }
        );

        return () => {
            signaling.leaveRoom();
        };
    }, [roomId, signaling]);

    // Sync viewers array
    useEffect(() => {
        setViewers(Array.from(peers));
    }, [peers]);

    return {
        roomId,
        isHost,
        viewers,
        createRoom,
        joinRoom,
        hostRoom,
        signaling,
        onSignalRef, // Expose for managers
        leaveRoom: () => roomId && signaling.leaveRoom()
    };
}
