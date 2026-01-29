import { useState } from 'react';
import { Search, Users, Eye, TrendingUp, ExternalLink, Bookmark } from 'lucide-react';

interface Channel {
    id: string;
    title: string;
    handle?: string;
    description: string;
    thumbnail: string;
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
    youtubeUrl?: string;
}

export default function ChannelFinder() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [error, setError] = useState('');

    const formatNumber = (num: string): string => {
        const n = parseInt(num);
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setChannels([]);
        setLoading(true);

        try {
            const response = await fetch('/api/search-channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to search channels');
            }

            setChannels(data.channels || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search channels');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Search size={32} style={{ color: 'var(--accent-primary)' }} />
                    Channel Finder
                </h1>
                <p>Discover high-performing YouTube channels in any niche</p>
            </div>

            <div className="card mb-6">
                <form onSubmit={handleSearch}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Search Niche or Keywords</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Tech Reviews, Cooking Tips, Fitness Motivation..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                                Searching Channels...
                            </>
                        ) : (
                            <>
                                <Search size={20} />
                                Find Channels
                            </>
                        )}
                    </button>
                </form>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {channels.length > 0 && (
                <div className="channel-grid">
                    {channels.map((channel) => (
                        <div key={channel.id} className="card channel-card animate-slideUp">
                            <div className="flex items-center gap-4">
                                <img
                                    src={channel.thumbnail}
                                    alt={channel.title}
                                    className="channel-avatar"
                                />
                                <div className="channel-info" style={{ flex: 1 }}>
                                    <h4>{channel.title}</h4>
                                    {channel.handle && (
                                        <span className="text-sm" style={{ color: 'var(--accent-primary)' }}>{channel.handle}</span>
                                    )}
                                    <p className="text-sm text-muted" style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                    }}>
                                        {channel.description || 'No description available'}
                                    </p>
                                </div>
                            </div>

                            <div className="channel-stats">
                                <div className="stat-item">
                                    <span className="stat-value flex items-center gap-1">
                                        <Users size={16} />
                                        {formatNumber(channel.subscriberCount)}
                                    </span>
                                    <span className="stat-label">Subscribers</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value flex items-center gap-1">
                                        <Eye size={16} />
                                        {formatNumber(channel.viewCount)}
                                    </span>
                                    <span className="stat-label">Total Views</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value flex items-center gap-1">
                                        <TrendingUp size={16} />
                                        {formatNumber(channel.videoCount)}
                                    </span>
                                    <span className="stat-label">Videos</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <a
                                    href={channel.youtubeUrl || `https://youtube.com/${channel.handle || '@' + channel.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ flex: 1 }}
                                >
                                    <ExternalLink size={16} />
                                    View Channel
                                </a>
                                <button className="btn btn-outline btn-sm">
                                    <Bookmark size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && channels.length === 0 && !error && (
                <div className="card">
                    <div className="empty-state">
                        <Search size={64} />
                        <h3>Find Top Channels</h3>
                        <p>Search for a niche to discover successful YouTube channels and their performance metrics</p>
                    </div>
                </div>
            )}
        </div>
    );
}
