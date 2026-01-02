import { createPeerConnection } from "./createPeer";
import { SignalingService } from "../services/signaling";

export class HostPeerManager {
    private peers: Map<string, RTCPeerConnection> = new Map();
    private dataChannels: Map<string, RTCDataChannel> = new Map();
    private stream: MediaStream | null = null;
    private signaling: SignalingService;

    private onSyncEvent?: (event: any) => void;
    private statsInterval: any;

    constructor(signaling: SignalingService, _roomId: string, onSyncEvent?: (event: any) => void) {
        this.signaling = signaling;

        this.onSyncEvent = onSyncEvent;
    }

    setStream(stream: MediaStream) {
        this.stream = stream;
        // Add to existing peers
        this.peers.forEach((pc, viewerId) => {
            stream.getTracks().forEach(track => {
                // Check if track already exists?
                const senders = pc.getSenders();
                const exists = senders.find(s => s.track?.kind === track.kind);
                if (!exists) {
                    pc.addTrack(track, stream);
                } else {
                    exists.replaceTrack(track);
                }
            });

            // Renegotiate
            this.renegotiate(viewerId);
        });
    }

    async renegotiate(viewerId: string) {
        const pc = this.peers.get(viewerId);
        if (!pc) return;
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await this.signaling.sendSignal(viewerId, 'offer', offer);
        } catch (e) {
            console.error("Renegotiation failed", e);
        }
    }

    private setupDataChannel(pc: RTCPeerConnection, viewerId: string) {
        const dc = pc.createDataChannel("sync");
        this.dataChannels.set(viewerId, dc);
        dc.onopen = () => console.log(`Data channel open for viewer ${viewerId}`);
        dc.onmessage = (e) => {
            if (this.onSyncEvent) this.onSyncEvent(JSON.parse(e.data));
        };
    }

    // Handle incoming signal from signaling service
    async handleSignal(data: any, fromPeerId: string) {
        if (data.type === 'answer') {
            const pc = this.peers.get(fromPeerId);
            if (pc && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(data.payload);
            }
        } else if (data.type === 'candidate' && data.payload.candidate) { // 'candidate' wrapped or raw?
            // Normalized by sender
            const pc = this.peers.get(fromPeerId);
            if (pc) {
                await pc.addIceCandidate(data.payload);
            }
        }
    }

    async handleViewerJoin(viewerId: string) {
        console.log(`Handling viewer join: ${viewerId}`);
        if (this.peers.has(viewerId)) return;

        const pc = createPeerConnection();
        this.peers.set(viewerId, pc);

        if (this.stream) {
            this.stream.getTracks().forEach(track => pc.addTrack(track, this.stream!));
        }

        this.setupDataChannel(pc, viewerId);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signaling.sendSignal(viewerId, 'candidate', event.candidate.toJSON());
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await this.signaling.sendSignal(viewerId, 'offer', offer);
    }

    handleViewerLeave(viewerId: string) {
        const pc = this.peers.get(viewerId);
        if (pc) {
            pc.close();
            this.peers.delete(viewerId);
            this.dataChannels.delete(viewerId);
        }
    }

    broadcastSyncEvent(event: any) {
        const msg = JSON.stringify(event);
        this.dataChannels.forEach(dc => {
            if (dc.readyState === 'open') {
                dc.send(msg);
            }
        });
    }

    cleanup() {
        if (this.statsInterval) clearInterval(this.statsInterval);
        this.peers.forEach(pc => pc.close());
        this.peers.clear();
        this.dataChannels.clear();
    }

    startStatsLoop(callback: (ping: number) => void) {
        if (this.statsInterval) clearInterval(this.statsInterval);
        this.statsInterval = setInterval(async () => {
            let totalRtt = 0;
            let count = 0;

            for (const [_, pc] of this.peers) {
                try {
                    const stats = await pc.getStats();
                    stats.forEach(report => {
                        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                            totalRtt += report.currentRoundTripTime * 1000;
                            count++;
                        }
                    });
                } catch (e) {
                    console.error("Failed to get stats:", e);
                }
            }

            if (count > 0) {
                callback(totalRtt / count);
            } else {
                callback(0);
            }
        }, 1000); // Update every second
    }
}
