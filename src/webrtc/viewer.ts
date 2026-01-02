import { createPeerConnection } from "./createPeer";
import { SignalingService } from "../services/signaling";

export class ViewerPeerManager {
    public pc: RTCPeerConnection;
    private signaling: SignalingService;
    private roomId: string;
    private hostId: string | null = null; // We discover host from Offer
    private onTrack: (stream: MediaStream) => void;
    private onSyncEvent: (event: any) => void;

    constructor(
        signaling: SignalingService,
        roomId: string,
        onTrack: (stream: MediaStream) => void,
        onSyncEvent: (event: any) => void
    ) {
        this.signaling = signaling;
        this.roomId = roomId;
        this.onTrack = onTrack;
        this.onSyncEvent = onSyncEvent;

        this.pc = createPeerConnection();
        this.setupDataChannel();
        this.setupMedia();
        this.setupIce();
    }

    private setupMedia() {
        this.pc.ontrack = (event) => {
            console.log("Received track", event.streams[0]);
            if (event.streams && event.streams[0]) {
                this.onTrack(event.streams[0]);
            }
        };
    }

    private setupDataChannel() {
        this.pc.ondatachannel = (event) => {
            const dc = event.channel;
            dc.onmessage = (e) => {
                const data = JSON.parse(e.data);
                this.onSyncEvent(data);
            };
        };
    }

    private setupIce() {
        this.pc.onicecandidate = (event) => {
            if (event.candidate && this.hostId) {
                this.signaling.sendSignal(this.hostId, 'candidate', event.candidate.toJSON());
            }
        };
    }

    async handleSignal(data: any, fromPeerId: string) {
        if (data.type === 'offer') {
            this.hostId = fromPeerId; // Found host!

            if (this.pc.signalingState === 'stable') {
                await this.pc.setRemoteDescription(data.payload);
                const answer = await this.pc.createAnswer();
                await this.pc.setLocalDescription(answer);
                await this.signaling.sendSignal(this.hostId, 'answer', answer);
            }
        } else if (data.type === 'candidate' && data.payload) {
            await this.pc.addIceCandidate(data.payload);
        }
    }

    connect(myId: string) {
        // nothing specific needed, waiting for offer
    }

    cleanup() {
        this.pc.close();
    }
}
