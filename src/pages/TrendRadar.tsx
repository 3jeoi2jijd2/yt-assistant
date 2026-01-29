import { useState, useEffect } from 'react';
import { Radar, TrendingUp, Flame, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';

interface Trend {
    title: string;
    category: string;
    growth: string;
    description: string;
    contentIdeas: string[];
    hashtags: string[];
}

const categories = [
    { id: 'all', name: 'All' },
    { id: 'tech', name: 'Tech' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'business', name: 'Business' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'education', name: 'Education' }
];

export default function TrendRadar() {
    const [category, setCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [trends, setTrends] = useState<Trend[]>([]);
    const [error, setError] = useState('');
    const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);

    const fetchTrends = async () => {
        setLoading(true);
        setError('');
        setTrends([]);
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
        if (growth.includes('🔥') || growth.includes('100')) return 'var(--error)';
        if (growth.includes('↑') || parseInt(growth) > 50) return 'var(--success)';
        return 'var(--accent-primary)';
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Radar size={32} style={{ color: 'var(--accent-primary)' }} />
                    Trend Radar
                </h1>
                <p>Discover trending topics and viral content ideas for January 2026</p>
            </div>

            <div className="card mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setCategory(c.id)}
                                className={`btn ${category === c.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            >
                                {c.name}
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

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="card">
                    <div className="loading-overlay" style={{ minHeight: '300px' }}>
                        <div className="loading-spinner"></div>
                        <p>Scanning for trends...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-6">
                    {/* Trends List */}
                    <div className="col-span-2">
                        <div className="space-y-4">
                            {trends.map((trend, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedTrend(trend)}
                                    className="card animate-slideUp"
                                    style={{
                                        cursor: 'pointer',
                                        border: selectedTrend === trend ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                        transition: 'all 0.2s ease'
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
                                        <Flame size={24} style={{ color: getGrowthColor(trend.growth) }} />
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

                                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Suggested Hashtags</h4>
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
                                <div className="empty-state">
                                    <TrendingUp size={48} />
                                    <p>Select a trend to see content ideas</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
