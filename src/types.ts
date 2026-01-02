export interface SignalData {
    type: 'offer' | 'answer' | 'candidate';
    payload: any;
    sender: string;
    target?: string;
}

export interface Room {
    id: string;
    hostId: string;
    status: 'waiting' | 'streaming';
    createdAt: number;
}

export interface Viewer {
    id: string;
    joinedAt: number;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
}

export const CONSTANTS = {
    ROOMS_REF: 'rooms',
};

export interface SyncEvent {
    action: 'play' | 'pause' | 'seek';
    time: number;
    timestamp: number;
}
