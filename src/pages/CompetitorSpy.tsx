import { useState } from 'react';
import { Eye, Search, Sparkles, TrendingUp, Users, Video, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

interface CompetitorAnalysis {
    channelName: string;
    channelId: string | null;
    thumbnail: string | null;
    subscribers: string;
    totalViews: string;
    videoCount: string | number;
    uploadFrequency: string;
    isRealData: boolean;
    topPerforming: { title: string; views: string; why: string }[];
    contentPattern: string;
    audience: string;
    opportunities: string[];
    lessonsToLearn: string[];
}

export default function CompetitorSpy() {
    const [channelName, setChannelName] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!channelName.trim()) {
            setError('Please enter a channel name or handle');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const response = await fetch('/api/analyze-competitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelName })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze competitor');
            }

            setAnalysis(data.analysis);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Eye size={32} style={{ color: 'var(--accent-primary)' }} />
                    Competitor Spy
                </h1>
                <p>Analyze successful creators with real YouTube data</p>
            </div>

            <div className="card mb-6">
                <div className="flex gap-4">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Enter channel handle (e.g., @MrBeast) or name..."
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        style={{ flex: 1 }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                    <button
                        onClick={handleAnalyze}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                        ) : (
                            <>
                                <Search size={18} />
                                Analyze
                            </>
                        )}
                    </button>
                </div>
                <p className="text-sm text-muted mt-2">
                    💡 Tip: Use the channel handle (e.g., @MrBeast, @MKBHD) for best results
                </p>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="animate-slideUp">
                    {/* Data Source Indicator */}
                    <div className={`alert ${analysis.isRealData ? 'alert-success' : 'alert-warning'} mb-4`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: analysis.isRealData ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            borderColor: analysis.isRealData ? 'var(--success)' : 'var(--warning)'
                        }}>
                        {analysis.isRealData ? (
                            <>
                                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                                <span>Real YouTube data fetched successfully!</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
                                <span>Using AI-generated estimates. Add YOUTUBE_API_KEY in Netlify for real data.</span>
                            </>
                        )}
                    </div>

                    {/* Channel Overview */}
                    <div className="card mb-6">
                        <div className="flex items-center gap-6">
                            {analysis.thumbnail ? (
                                <img
                                    src={analysis.thumbnail}
                                    alt={analysis.channelName}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-youtube) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '2rem' }}>📺</span>
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                                        {analysis.channelName}
                                    </h2>
                                    {analysis.channelId && (
                                        <a
                                            href={`https://youtube.com/channel/${analysis.channelId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary btn-sm"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                                <div className="flex gap-6 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} style={{ color: 'var(--accent-youtube)' }} />
                                        <span><strong>{analysis.subscribers}</strong> subscribers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                                        <span><strong>{analysis.totalViews}</strong> total views</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Video size={16} style={{ color: 'var(--accent-primary)' }} />
                                        <span><strong>{analysis.videoCount}</strong> videos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Top Performing Videos */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <Sparkles size={20} style={{ color: 'var(--accent-youtube)' }} />
                                Top Videos {analysis.isRealData && <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>(REAL)</span>}
                            </h3>
                            <div className="space-y-4">
                                {analysis.topPerforming.map((video, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            background: 'var(--bg-tertiary)',
                                            padding: '1rem',
                                            borderRadius: '0.5rem'
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{video.title}</h4>
                                            <span style={{
                                                background: 'var(--accent-youtube)',
                                                color: 'white',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {video.views} views
                                            </span>
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            📊 {video.why}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Insights */}
                        <div className="space-y-6">
                            <div className="card">
                                <h3 className="card-title mb-3">📈 Content Pattern</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>{analysis.contentPattern}</p>
                            </div>
                            <div className="card">
                                <h3 className="card-title mb-3">👥 Target Audience</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>{analysis.audience}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-6">
                        {/* Opportunities */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                🎯 Opportunities for You
                            </h3>
                            <div className="space-y-3">
                                {analysis.opportunities.map((opp, i) => (
                                    <div key={i} className="flex items-start gap-2" style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                        <span style={{ color: 'var(--success)' }}>→</span>
                                        <span>{opp}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Lessons */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                📚 Lessons to Learn
                            </h3>
                            <div className="space-y-3">
                                {analysis.lessonsToLearn.map((lesson, i) => (
                                    <div key={i} className="flex items-start gap-2" style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                        <span style={{ color: 'var(--accent-primary)' }}>✦</span>
                                        <span>{lesson}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!analysis && !loading && (
                <div className="card">
                    <div className="empty-state">
                        <Eye size={64} />
                        <h3>Spy on the Competition</h3>
                        <p>Enter a YouTube channel handle to get real statistics and AI-powered insights</p>
                    </div>
                </div>
            )}
        </div>
    );
}
