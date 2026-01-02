import { supabase } from "../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export class SignalingService {
    private peerId: string;
    private channel: RealtimeChannel | null = null;
    private roomId: string | null = null;

    constructor(peerId: string) {
        this.peerId = peerId;
    }

    async subscribe(
        roomId: string,
        onPeerJoined: (peerId: string) => void,
        onPeerLeft: (peerId: string) => void,
        onSignal: (payload: any, fromPeerId: string) => void
    ) {
        if (this.channel) await this.leaveRoom();
        this.roomId = roomId;

        this.channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: {
                    key: this.peerId,
                },
            },
        });

        this.channel
            .on('presence', { event: 'sync' }, () => {
                const state = this.channel?.presenceState();
                // state is object: { key: [presenceObject, ...], ... }
                if (state) {
                    const allPeers = Object.keys(state);
                    console.log("Presence State:", allPeers);

                    // We need to diff against known peers or just notify full list?
                    // The callback expects "joined" and "left".
                    // Let's rely on the caller to diff, OR we do it here.
                    // Actually, `useRoom` maintains a Set. We can just emit "current peers" event?
                    // But our interface is `onPeerJoined` and `onPeerLeft`.

                    // Let's iterate and call onPeerJoined for everyone we see (idempotency required in caller)
                    allPeers.forEach(id => {
                        if (id !== this.peerId) onPeerJoined(id);
                    });

                    // For "left", it's harder with just "sync".
                    // We'll stick to 'join'/'leave' BUT we will log them to debug.
                    // And we will also trigger onPeerJoined for existing state on sync.
                }
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('Presence Join:', key, newPresences);
                // Supabase sends 'key' as the grouping key.
                if (key && key !== this.peerId) onPeerJoined(key);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('Presence Leave:', key, leftPresences);
                if (key && key !== this.peerId) onPeerLeft(key);
            })
            .on('broadcast', { event: 'signal' }, ({ payload }) => {
                // message directed to specific peer?
                if (payload.to && payload.to !== this.peerId) return;
                if (payload.from === this.peerId) return;
                onSignal(payload.data, payload.from);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await this.channel?.track({ online_at: new Date().toISOString() });
                }
            });
    }

    // Generate ID locally
    async createRoom(): Promise<string> {
        return Math.random().toString(36).substr(2, 9);
    }

    async joinRoom(roomId: string) {
        // No-op, subscription happens in hooks
        return roomId;
    }

    async leaveRoom() {
        if (this.channel) {
            await this.channel.unsubscribe();
            this.channel = null;
        }
    }

    async sendSignal(toPeerId: string, type: string, payload: any) {
        if (!this.channel) return;
        await this.channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
                to: toPeerId,
                from: this.peerId,
                data: { type, payload } // Wrap standard WebRTC types
            }
        });
    }
}
