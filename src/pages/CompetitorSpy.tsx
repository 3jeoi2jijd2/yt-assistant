import { useState } from 'react';
import { Eye, Search, TrendingUp, Users, Video, Lightbulb, Target, AlertTriangle, CheckCircle, ExternalLink, Send, MessageSquare } from 'lucide-react';

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

    // AI Chat
    const [question, setQuestion] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([]);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channelName.trim()) return;

        setLoading(true);
        setError('');
        setAnalysis(null);
        setChatHistory([]);

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

    const getScoreClass = (score: number) => {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    };

    const askAI = async () => {
        if (!question.trim() || chatLoading) return;

        const userQuestion = question;
        setQuestion('');
        setChatHistory(prev => [...prev, { role: 'user', content: userQuestion }]);
        setChatLoading(true);

        try {
            const context = analysis
                ? `User analyzed ${analysis.channelName} (${analysis.subscribers} subs, ${analysis.totalViews} views). Lessons: ${analysis.lessonsToSteal?.join(', ')}. Weaknesses: ${analysis.weaknesses?.join(', ')}. They ask:`
                : `User is researching competitors. They ask:`;

            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: `You are a YouTube growth strategist. Help the user beat their competition. Be specific about tactics they can use. ${context}` },
                        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userQuestion }
                    ]
                })
            });

            const data = await response.json();
            if (data.message) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
            }
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not respond.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1>
                    <Eye size={32} />
                    Competitor Spy
                </h1>
                <p>Deep AI analysis of any YouTube channel - uncover their secrets</p>
            </div>

            {/* Search + Chat Row */}
            <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <form onSubmit={handleAnalyze} className="card">
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

                {/* AI Chat Box */}
                <div className="ai-chat-box">
                    <div className="ai-chat-header">
                        <MessageSquare size={18} />
                        <span>Ask Competition AI</span>
                    </div>

                    <div className="ai-chat-messages">
                        {chatHistory.length === 0 ? (
                            <div className="ai-chat-placeholder">
                                <p>💡 Ask me anything about beating your competition!</p>
                                <div className="suggestions">
                                    "How do I stand out from them?"<br />
                                    "What content gaps can I exploit?"
                                </div>
                            </div>
                        ) : (
                            chatHistory.map((msg, i) => (
                                <div key={i} className={`ai-message ${msg.role}`}>
                                    {msg.content}
                                </div>
                            ))
                        )}
                        {chatLoading && (
                            <div className="ai-message assistant">
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="ai-chat-input">
                        <input
                            type="text"
                            placeholder="How do I beat them?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && askAI()}
                        />
                        <button onClick={askAI} disabled={chatLoading}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-error mb-4">{error}</div>}

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
                        <div className="flex gap-6 items-start">
                            {analysis.thumbnail && (
                                <img
                                    src={analysis.thumbnail}
                                    alt={analysis.channelName}
                                    style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)' }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 style={{ fontSize: '1.5rem' }}>{analysis.channelName}</h2>
                                    {analysis.isRealData && (
                                        <span className="badge badge-success">
                                            <CheckCircle size={12} /> Real Data
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-5 gap-4">
                                    <div className="stat-card">
                                        <div className="value">{analysis.subscribers}</div>
                                        <div className="label">Subscribers</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="value">{analysis.totalViews}</div>
                                        <div className="label">Total Views</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="value">{analysis.videoCount}</div>
                                        <div className="label">Videos</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="value">{analysis.avgViews}</div>
                                        <div className="label">Avg Views</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="value">{analysis.engagementRate}</div>
                                        <div className="label">Engagement</div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className={`score-circle ${getScoreClass(analysis.overallScore || 75)}`}>
                                    {analysis.overallScore || 75}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Score</p>
                            </div>
                        </div>

                        {analysis.verdict && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-primary)' }}>
                                <strong style={{ color: 'var(--accent-primary)' }}>Verdict:</strong> {analysis.verdict}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Top Videos */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <Video size={20} style={{ color: 'var(--accent-youtube)' }} />
                                    Top Performing Videos
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {analysis.topVideos?.slice(0, 5).map((video, i) => (
                                    <div key={i} className="flex items-center gap-3" style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-md)' }}>
                                        {video.thumbnail && (
                                            <img src={video.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p className="truncate" style={{ fontWeight: 500, fontSize: '0.85rem' }}>
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
                            <div className="card-header">
                                <h3 className="card-title">
                                    <Target size={20} />
                                    Content Strategy
                                </h3>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{analysis.contentStrategy}</p>

                            <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>🔥 Viral Formula</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{analysis.viralFormula}</p>
                        </div>

                        {/* Lessons to Steal */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <Lightbulb size={20} style={{ color: 'var(--warning)' }} />
                                    Lessons to Steal
                                </h3>
                            </div>
                            <div className="step-list">
                                {analysis.lessonsToSteal?.map((lesson, i) => (
                                    <div key={i} className="step-item" style={{ borderLeft: '3px solid var(--success)' }}>
                                        <div className="step-number" style={{ background: 'var(--success)' }}>{i + 1}</div>
                                        <div className="step-content">{lesson}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Weaknesses */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
                                    Opportunities (Their Weaknesses)
                                </h3>
                            </div>
                            <div className="step-list">
                                {analysis.weaknesses?.map((weakness, i) => (
                                    <div key={i} className="step-item" style={{ borderLeft: '3px solid var(--error)' }}>
                                        <div className="step-number" style={{ background: 'var(--error)' }}>{i + 1}</div>
                                        <div className="step-content">{weakness}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Ideas */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <Lightbulb size={20} />
                                Video Ideas Inspired by This Channel
                            </h3>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {analysis.contentIdeas?.map((idea, i) => (
                                <div key={i} style={{
                                    padding: '1rem',
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(139, 92, 246, 0.2)'
                                }}>
                                    💡 {idea}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Audience & Growth */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title"><Users size={20} /> Audience Insight</h3>
                            </div>
                            <p style={{ color: 'var(--text-secondary)' }}>{analysis.audienceInsight}</p>
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title"><TrendingUp size={20} /> Growth Status</h3>
                            </div>
                            <p style={{ color: 'var(--text-secondary)' }}>{analysis.growthStatus}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
