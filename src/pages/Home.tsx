import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users } from 'lucide-react';
import { useRoom } from '../hooks/useRoom';

// Generate a random peerId for now, or persist it?
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
            alert('Failed to create room');
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                        P2P Watch Party
                    </h1>
                    <p className="text-gray-400">
                        Stream local videos to friends directly. No servers.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="flex items-center justify-center w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-lg font-medium shadow-lg disabled:opacity-50"
                    >
                        <Video className="w-6 h-6 mr-2" />
                        {loading ? 'Creating...' : 'Start Hosting'}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-neutral-900 px-2 text-gray-500">Or join existing</span>
                        </div>
                    </div>

                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label htmlFor="roomId" className="sr-only">Room ID</label>
                            <input
                                id="roomId"
                                type="text"
                                required
                                value={joinId}
                                onChange={(e) => setJoinId(e.target.value)}
                                placeholder="Enter Room ID"
                                className="block w-full rounded-lg border-0 bg-gray-800 py-4 px-4 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            />
                        </div>
                        <button
                            type="submit"
                            className="flex items-center justify-center w-full py-4 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-lg font-medium shadow-lg"
                        >
                            <Users className="w-6 h-6 mr-2" />
                            Join Room
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
