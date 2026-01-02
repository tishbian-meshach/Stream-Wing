import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { VideoIcon, UsersIcon, WifiIcon } from '../components/Icons';

const peerId = Math.random().toString(36).substr(2, 9);

export function Home() {
    const navigate = useNavigate();
    const { createRoom } = useRoom(peerId);
    const [joinId, setJoinId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const roomId = await createRoom();
            navigate(`/host/${roomId}`, { state: { peerId } });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinId.trim()) return;
        navigate(`/viewer/${joinId}`, { state: { peerId } });
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col safe-area-p">
            {/* Header */}
            <header className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <WifiIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold">StreamWing</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8 sm:px-6">
                <div className="w-full max-w-sm space-y-8">
                    {/* Hero */}
                    <div className="text-center space-y-3">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Watch Together
                        </h1>
                        <p className="text-gray-400 text-base sm:text-lg">
                            Stream videos to friends directly. No servers, no uploads.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <Button
                            onClick={handleCreate}
                            loading={loading}
                            icon={<VideoIcon className="w-5 h-5" />}
                            size="lg"
                            className="w-full"
                        >
                            Start Hosting
                        </Button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-neutral-800" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-neutral-950 px-3 text-gray-500">or join a room</span>
                            </div>
                        </div>

                        {/* Join Form */}
                        <form onSubmit={handleJoin} className="space-y-4">
                            <Input
                                type="text"
                                value={joinId}
                                onChange={(e) => setJoinId(e.target.value)}
                                placeholder="Enter Room ID"
                                required
                            />
                            <Button
                                type="submit"
                                variant="secondary"
                                icon={<UsersIcon className="w-5 h-5" />}
                                size="lg"
                                className="w-full"
                            >
                                Join Room
                            </Button>
                        </form>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3 pt-4">
                        {[
                            { icon: '256-bit', label: 'Encrypted' },
                            { icon: 'P2P', label: 'Direct' },
                            { icon: '5s', label: 'Latency' },
                        ].map((feature, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-neutral-900/50">
                                <div className="text-lg font-bold text-indigo-400">{feature.icon}</div>
                                <div className="text-xs text-gray-500 mt-1">{feature.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="px-4 py-4 text-center text-xs text-gray-600">
                Peer-to-peer streaming. Your data stays yours.
            </footer>
        </div>
    );
}
