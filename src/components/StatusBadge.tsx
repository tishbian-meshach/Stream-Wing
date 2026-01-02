import { cn } from '../lib/utils';

interface StatusBadgeProps {
    status: 'live' | 'connecting' | 'offline' | 'streaming';
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const configs = {
        live: {
            bg: 'bg-red-600',
            text: 'LIVE',
            pulse: true,
        },
        connecting: {
            bg: 'bg-yellow-600',
            text: 'Connecting',
            pulse: true,
        },
        offline: {
            bg: 'bg-gray-600',
            text: 'Offline',
            pulse: false,
        },
        streaming: {
            bg: 'bg-green-600',
            text: 'Streaming',
            pulse: true,
        },
    };

    const config = configs[status];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide',
                config.bg,
                className
            )}
        >
            {config.pulse && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
            )}
            {config.text}
        </span>
    );
}

interface ConnectionStatusProps {
    viewerCount: number;
    roomId?: string;
    isHost?: boolean;
    ping?: number;
    status?: 'live' | 'connecting' | 'offline' | 'streaming';
}

export function ConnectionStatus({ viewerCount, roomId, isHost, ping, status }: ConnectionStatusProps) {
    // Determine status color
    const currentStatus = status || (isHost ? 'live' : 'streaming');
    const statusColor = currentStatus === 'live' ? 'text-red-500' :
        currentStatus === 'connecting' ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="flex items-center gap-4 text-sm font-medium">
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColor} ${currentStatus === 'live' ? 'animate-pulse' : ''}`} />
                <span className="uppercase tracking-wider text-xs font-bold text-white/90">
                    {currentStatus === 'live' ? 'LIVE' : currentStatus}
                </span>
            </div>

            <div className="w-px h-3 bg-white/20" />

            {/* Room ID */}
            {roomId && (
                <div className="flex items-center gap-1.5 text-white/80">
                    <span className="text-xs uppercase tracking-wide opacity-60">ID</span>
                    <span className="font-mono tracking-wide">{roomId}</span>
                </div>
            )}

            {/* Viewer Count (Only explicit for Host or if pertinent) */}
            <div className="flex items-center gap-1.5 text-white/80">
                <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{viewerCount}</span>
            </div>

            {/* Ping Indicator - Subtle Signal Style */}
            {ping !== undefined && ping > 0 && (
                <div className="flex items-center gap-1.5" title={`${Math.round(ping)}ms`}>
                    <div className="relative flex items-end gap-[2px] h-3">
                        <div className={`w-[2px] rounded-sm transform transition-all duration-300 ${ping < 400 ? 'h-[40%] bg-white/90' : 'h-[40%] bg-red-500'}`} />
                        <div className={`w-[2px] rounded-sm transform transition-all duration-300 ${ping < 300 ? 'h-[60%] bg-white/90' : 'h-[60%] bg-white/20'}`} />
                        <div className={`w-[2px] rounded-sm transform transition-all duration-300 ${ping < 150 ? 'h-[80%] bg-white/90' : 'h-[80%] bg-white/20'}`} />
                        <div className={`w-[2px] rounded-sm transform transition-all duration-300 ${ping < 80 ? 'h-[100%] bg-white/90' : 'h-[100%] bg-white/20'}`} />
                    </div>
                </div>
            )}
        </div>
    );
}
