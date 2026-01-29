import { useState, useEffect } from 'react';
import { Radar, TrendingUp, Flame, RefreshCw, ExternalLink, Sparkles, Play, Eye, ThumbsUp, CheckCircle, AlertCircle } from 'lucide-react';

interface TrendingVideo {
    title: string;
    channel: string;
    views: string;
    likes: string;
    thumbnail: string;
    publishedAt: string;
}

interface Trend {
    title: string;
    category: string;
    growth: string;
    description: string;
    contentIdeas: string[];
    hashtags: string[];
    isRealData: boolean;
}

const categories = [
    { id: 'all', name: 'All', icon: '🔥' },
    { id: 'tech', name: 'Tech', icon: '💻' },
    { id: 'gaming', name: 'Gaming', icon: '🎮' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'lifestyle', name: 'Lifestyle', icon: '✨' }
];

export default function TrendRadar() {
    const [category, setCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [trends, setTrends] = useState<Trend[]>([]);
    const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([]);
    const [error, setError] = useState('');
    const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
    const [isRealData, setIsRealData] = useState(false);

    const fetchTrends = async () => {
        setLoading(true);
        setError('');
        setTrends([]);
        setTrendingVideos([]);
        setSelectedTrend(null);

        try {
            const response = await fetch('/.netlify/functions/get-trends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch trends');
            }

            setTrends(data.trends || []);
            setTrendingVideos(data.realTrendingVideos || []);
            setIsRealData(data.realTrendingVideos?.length > 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch trends');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrends();
    }, [category]);

    const getGrowthColor = (growth: string) => {
        if (growth.includes('🔥') || growth.includes('Exploding')) return 'var(--error)';
        if (growth.includes('↑') || parseInt(growth) > 50) return 'var(--success)';
        return 'var(--accent-primary)';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Radar size={32} style={{ color: 'var(--accent-primary)' }} />
                    Trend Radar
                </h1>
                <p>Real-time trending content from YouTube + AI-powered insights</p>
            </div>

            {/* Category Filter */}
            <div className="card mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setCategory(c.id)}
                                className={`btn ${category === c.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            >
                                {c.icon} {c.name}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchTrends}
                        className="btn btn-secondary btn-sm"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Data Source Indicator */}
            {!loading && (trendingVideos.length > 0 || trends.length > 0) && (
                <div className={`alert ${isRealData ? 'alert-success' : 'alert-warning'} mb-4`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: isRealData ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        borderColor: isRealData ? 'var(--success)' : 'var(--warning)'
                    }}>
                    {isRealData ? (
                        <>
                            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                            <span>Showing real YouTube trending data!</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
                            <span>Using AI-generated trends. Add YOUTUBE_API_KEY for real data.</span>
                        </>
                    )}
                </div>
            )}

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="card">
                    <div className="loading-overlay" style={{ minHeight: '300px' }}>
                        <div className="loading-spinner"></div>
                        <p>Scanning trending content...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Real Trending Videos Section */}
                    {trendingVideos.length > 0 && (
                        <div className="mb-6 animate-slideUp">
                            <h2 className="flex items-center gap-2 mb-4">
                                <Flame size={24} style={{ color: 'var(--accent-youtube)' }} />
                                Trending Right Now on YouTube
                            </h2>
                            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                                {trendingVideos.map((video, index) => (
                                    <div
                                        key={index}
                                        className="card"
                                        style={{ padding: '0', overflow: 'hidden' }}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                style={{
                                                    width: '100%',
                                                    height: '160px',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                            <span style={{
                                                position: 'absolute',
                                                top: '8px',
                                                left: '8px',
                                                background: 'var(--accent-youtube)',
                                                color: 'white',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.7rem',
                                                fontWeight: 600
                                            }}>
                                                #{index + 1} TRENDING
                                            </span>
                                        </div>
                                        <div style={{ padding: '1rem' }}>
                                            <h4 style={{
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                marginBottom: '0.5rem',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {video.title}
                                            </h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                                {video.channel}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                                                <span className="flex items-center gap-1">
                                                    <Eye size={14} /> {video.views}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ThumbsUp size={14} /> {video.likes}
                                                </span>
                                                <span>{formatDate(video.publishedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Trend Analysis */}
                    {trends.length > 0 && (
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2">
                                <h2 className="flex items-center gap-2 mb-4">
                                    <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
                                    Content Opportunities
                                </h2>
                                <div className="space-y-4">
                                    {trends.map((trend, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedTrend(trend)}
                                            className="card animate-slideUp"
                                            style={{
                                                cursor: 'pointer',
                                                border: selectedTrend === trend ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                                transition: 'all 0.2s ease',
                                                animationDelay: `${index * 0.1}s`
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div style={{ flex: 1 }}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span style={{
                                                            background: 'var(--bg-tertiary)',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.75rem'
                                                        }}>
                                                            {trend.category}
                                                        </span>
                                                        <span style={{
                                                            color: getGrowthColor(trend.growth),
                                                            fontSize: '0.875rem',
                                                            fontWeight: 600
                                                        }}>
                                                            {trend.growth}
                                                        </span>
                                                    </div>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                                        {trend.title}
                                                    </h3>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                        {trend.description}
                                                    </p>
                                                </div>
                                                <Flame size={24} style={{ color: getGrowthColor(trend.growth), flexShrink: 0 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Trend Details */}
                            <div className="col-span-1">
                                {selectedTrend ? (
                                    <div className="card sticky" style={{ top: '1rem' }}>
                                        <h3 className="card-title flex items-center gap-2 mb-4">
                                            <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                                            Content Ideas
                                        </h3>
                                        <div className="space-y-3 mb-6">
                                            {selectedTrend.contentIdeas.map((idea, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        background: 'var(--bg-tertiary)',
                                                        padding: '0.75rem',
                                                        borderRadius: '0.5rem',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    💡 {idea}
                                                </div>
                                            ))}
                                        </div>

                                        <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Hashtags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTrend.hashtags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        background: 'var(--accent-primary)',
                                                        color: 'white',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="card">
                                        <div className="empty-state" style={{ padding: '2rem' }}>
                                            <TrendingUp size={48} />
                                            <p>Click a trend to see content ideas</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
