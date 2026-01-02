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
}

export function ConnectionStatus({ viewerCount, roomId, isHost, ping }: ConnectionStatusProps) {
    console.log('Rendering ConnectionStatus', { viewerCount, roomId, isHost, ping });
    return (
        <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={isHost ? 'live' : 'streaming'} />
            {roomId && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 rounded-lg">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span className="font-mono text-sm text-gray-300">{roomId}</span>
                </div>
            )}

            {/* Ping Indicator */}
            {ping !== undefined && ping > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 rounded-lg">
                    <svg className={`w-4 h-4 ${ping < 100 ? 'text-green-400' : ping < 300 ? 'text-yellow-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className={`text-sm font-mono ${ping < 100 ? 'text-green-400' : ping < 300 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {Math.round(ping)}ms
                    </span>
                </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 rounded-lg">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm text-gray-300">{viewerCount}</span>
            </div>
        </div>
    );
}
