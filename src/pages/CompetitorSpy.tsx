import { useState } from 'react';
import { Eye, Search, TrendingUp, Users, Video, Lightbulb, Target, AlertTriangle, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

interface TopVideo {
    id: string;
    title: string;
    thumbnail: string;
    views: string;
    likes: string;
    comments: string;
}

interface Analysis {
    channelName: string;
    channelId: string | null;
    thumbnail: string | null;
    subscribers: string;
    totalViews: string;
    videoCount: number;
    avgViews: string;
    engagementRate: string;
    isRealData: boolean;
    topVideos: TopVideo[];
    contentStrategy: string;
    viralFormula: string;
    uploadPattern: string;
    audienceInsight: string;
    growthStatus: string;
    weaknesses: string[];
    lessonsToSteal: string[];
    contentIdeas: string[];
    overallScore: number;
    verdict: string;
}

export default function CompetitorSpy() {
    const [channelName, setChannelName] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [error, setError] = useState('');

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channelName.trim()) return;

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
                throw new Error(data.error || 'Failed to analyze');
            }

            setAnalysis(data.analysis);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze competitor');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 60) return 'var(--warning)';
        return 'var(--error)';
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Eye size={32} style={{ color: 'var(--accent-primary)' }} />
                    Competitor Spy
                </h1>
                <p>Deep AI analysis of any YouTube channel - uncover their secrets</p>
            </div>

            {/* Search */}
            <form onSubmit={handleAnalyze} className="card mb-6">
                <div className="flex gap-3">
                    <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter channel name or @handle (e.g., @MrBeast)"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading || !channelName.trim()}>
                        {loading ? (
                            <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                        ) : (
                            <><Search size={18} /> Analyze</>
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="card">
                    <div className="loading-overlay" style={{ minHeight: '400px' }}>
                        <div className="loading-spinner"></div>
                        <p>Deep AI analysis in progress...</p>
                    </div>
                </div>
            )}

            {analysis && !loading && (
                <div className="animate-slideUp space-y-6">
                    {/* Channel Header */}
                    <div className="card">
                        <div className="flex items-start gap-4">
                            {analysis.thumbnail && (
                                <img
                                    src={analysis.thumbnail}
                                    alt={analysis.channelName}
                                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{analysis.channelName}</h2>
                                    {analysis.isRealData && (
                                        <span className="flex items-center gap-1" style={{ color: 'var(--success)', fontSize: '0.8rem' }}>
                                            <CheckCircle size={14} /> Real Data
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-5 gap-4">
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Subscribers</p>
                                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{analysis.subscribers}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Views</p>
                                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{analysis.totalViews}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Videos</p>
                                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{analysis.videoCount}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Avg Views</p>
                                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{analysis.avgViews}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Engagement</p>
                                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{analysis.engagementRate}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Overall Score */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    border: `4px solid ${getScoreColor(analysis.overallScore || 75)}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    color: getScoreColor(analysis.overallScore || 75)
                                }}>
                                    {analysis.overallScore || 75}
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Score</p>
                            </div>
                        </div>

                        {analysis.verdict && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
                                <strong>Verdict:</strong> {analysis.verdict}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Top Videos */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <Video size={20} style={{ color: 'var(--accent-youtube)' }} />
                                Top Performing Videos
                            </h3>
                            <div className="space-y-3">
                                {analysis.topVideos?.slice(0, 5).map((video, i) => (
                                    <div key={i} className="flex items-center gap-3" style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
                                        {video.thumbnail && (
                                            <img src={video.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: '0.25rem' }} />
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {video.title}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {video.views} views • {video.likes} likes
                                            </p>
                                        </div>
                                        {video.id && (
                                            <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content Strategy */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <Target size={20} style={{ color: 'var(--accent-primary)' }} />
                                Content Strategy
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{analysis.contentStrategy}</p>

                            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Viral Formula</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{analysis.viralFormula}</p>
                        </div>

                        {/* Lessons to Steal */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <Lightbulb size={20} style={{ color: 'var(--warning)' }} />
                                Lessons to Steal
                            </h3>
                            <div className="space-y-2">
                                {analysis.lessonsToSteal?.map((lesson, i) => (
                                    <div key={i} style={{
                                        padding: '0.75rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem',
                                        borderLeft: '3px solid var(--success)'
                                    }}>
                                        {lesson}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Weaknesses */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
                                Opportunities (Their Weaknesses)
                            </h3>
                            <div className="space-y-2">
                                {analysis.weaknesses?.map((weakness, i) => (
                                    <div key={i} style={{
                                        padding: '0.75rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem',
                                        borderLeft: '3px solid var(--error)'
                                    }}>
                                        {weakness}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Ideas */}
                    <div className="card">
                        <h3 className="card-title flex items-center gap-2 mb-4">
                            <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                            Video Ideas Inspired by This Channel
                        </h3>
                        <div className="grid grid-cols-5 gap-3">
                            {analysis.contentIdeas?.map((idea, i) => (
                                <div key={i} style={{
                                    padding: '1rem',
                                    background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))',
                                    borderRadius: '0.5rem',
                                    textAlign: 'center',
                                    fontSize: '0.85rem'
                                }}>
                                    💡 {idea}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Audience & Growth */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-3">
                                <Users size={20} />
                                Audience Insight
                            </h3>
                            <p style={{ color: 'var(--text-secondary)' }}>{analysis.audienceInsight}</p>
                        </div>
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-3">
                                <TrendingUp size={20} />
                                Growth Status
                            </h3>
                            <p style={{ color: 'var(--text-secondary)' }}>{analysis.growthStatus}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
