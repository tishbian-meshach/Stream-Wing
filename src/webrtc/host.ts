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
            const data = JSON.parse(e.data);

            // Handle quality change requests from viewer
            if (data.action === 'quality-request') {
                console.log(`Viewer ${viewerId} requested quality: ${data.quality}`);
                this.setQualityForViewer(viewerId, data.quality);
            } else if (this.onSyncEvent) {
                this.onSyncEvent(data);
            }
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

    // Bitrate presets for quality levels (maxBitrate only - minBitrate not supported)
    private qualityBitrates = {
        'high': 10000000,   // 10 Mbps - Very high to allow original quality
        'sd': 1500000,      // 1.5 Mbps
        'low': 500000       // 500 Kbps
    };

    // Set video quality for a specific viewer
    async setQualityForViewer(viewerId: string, quality: 'high' | 'sd' | 'low') {
        const pc = this.peers.get(viewerId);
        if (!pc) {
            console.warn(`No peer connection for viewer ${viewerId}`);
            return;
        }

        const senders = pc.getSenders();
        const videoSender = senders.find(sender => sender.track?.kind === 'video');

        if (!videoSender) {
            console.warn(`No video sender for viewer ${viewerId}`);
            return;
        }

        try {
            const params = videoSender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
                params.encodings = [{}];
            }

            const maxBitrate = this.qualityBitrates[quality];
            params.encodings[0].maxBitrate = maxBitrate;

            // CRITICAL: Configure quality settings properly
            if (quality === 'high') {
                // Remove any constraints for highest quality
                delete params.encodings[0].scaleResolutionDownBy;
                params.encodings[0].maxFramerate = undefined; // No limit
                // @ts-ignore
                params.degradationPreference = 'maintain-resolution'; // Prioritize quality over framerate
            } else if (quality === 'sd') {
                params.encodings[0].scaleResolutionDownBy = 1.5;
                params.encodings[0].maxFramerate = 30;
                // @ts-ignore
                params.degradationPreference = 'balanced';
            } else { // low
                params.encodings[0].scaleResolutionDownBy = 2;
                params.encodings[0].maxFramerate = 24;
                // @ts-ignore
                params.degradationPreference = 'maintain-framerate';
            }

            await videoSender.setParameters(params);
            console.log(`✓ Quality set for viewer ${viewerId}:`, {
                quality,
                maxBitrate: (maxBitrate / 1000000).toFixed(1) + ' Mbps',
                scale: params.encodings[0].scaleResolutionDownBy || 'none',
                maxFps: params.encodings[0].maxFramerate || 'unlimited'
            });
        } catch (e) {
            console.error(`Failed to set quality for viewer ${viewerId}:`, e);
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
            }
        }, 1000); // Update every second
    }
}
