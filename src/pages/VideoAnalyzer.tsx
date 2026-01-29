import { useState } from 'react';
import { Video, Search, TrendingUp, Lightbulb, Target, Sparkles, ExternalLink, ThumbsUp, MessageSquare, Eye, CheckCircle, Send, BookOpen, Zap } from 'lucide-react';

interface VideoInfo {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    views: string;
    likes: string;
    comments: string;
    publishedAt: string;
}

interface Analysis {
    viralScore: number;
    hookAnalysis: string;
    contentStructure: string;
    whyItWorks: string[];
    viralFormulas: string[];
    lessonsForCreators: string[];
    suggestedImprovements: string[];
    estimatedRetention: string;
    audienceInsight: string;
    transcriptSummary: string;
    keyMoments: string[];
}

export default function VideoAnalyzer() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [video, setVideo] = useState<VideoInfo | null>(null);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [error, setError] = useState('');
    const [question, setQuestion] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([]);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        setError('');
        setVideo(null);
        setAnalysis(null);
        setChatHistory([]);

        try {
            const response = await fetch('/api/analyze-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl: url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze video');
            }

            setVideo(data.video);
            setAnalysis(data.analysis);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze video');
        } finally {
            setLoading(false);
        }
    };

    const askQuestion = async () => {
        if (!question.trim() || chatLoading || !video) return;

        const userQuestion = question;
        setQuestion('');
        setChatHistory(prev => [...prev, { role: 'user', content: userQuestion }]);
        setChatLoading(true);

        try {
            const response = await fetch('/api/analyze-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl: url, question: userQuestion })
            });

            const data = await response.json();

            if (data.chatResponse) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: data.chatResponse }]);
            }
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not answer that question.' }]);
        } finally {
            setChatLoading(false);
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
                    <Video size={32} style={{ color: 'var(--accent-youtube)' }} />
                    Video Analyzer
                </h1>
                <p>Analyze any YouTube video or Short - understand what makes it work + ask AI questions</p>
            </div>

            {/* Search */}
            <form onSubmit={handleAnalyze} className="card mb-6">
                <div className="flex gap-3">
                    <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Paste any YouTube URL (watch, shorts, youtu.be)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading || !url.trim()}>
                        {loading ? (
                            <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                        ) : (
                            <><Search size={18} /> Analyze</>
                        )}
                    </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Supports: youtube.com/watch, youtube.com/shorts, youtu.be
                </p>
            </form>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="card">
                    <div className="loading-overlay" style={{ minHeight: '300px' }}>
                        <div className="loading-spinner"></div>
                        <p>Analyzing video with AI...</p>
                    </div>
                </div>
            )}

            {video && !loading && (
                <div className="grid grid-cols-3 gap-6 animate-slideUp">
                    {/* Left Column - Video Info + Chat */}
                    <div className="col-span-1 space-y-4">
                        {/* Video Card */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                            />
                            <div style={{ padding: '1rem' }}>
                                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                    {video.title}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    {video.channel}
                                </p>

                                <div className="grid grid-cols-3 gap-3" style={{ marginBottom: '1rem' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="flex items-center justify-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                                            <Eye size={16} />
                                            <span style={{ fontWeight: 600 }}>{video.views}</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Views</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="flex items-center justify-center gap-1" style={{ color: 'var(--success)' }}>
                                            <ThumbsUp size={16} />
                                            <span style={{ fontWeight: 600 }}>{video.likes}</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Likes</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="flex items-center justify-center gap-1" style={{ color: 'var(--warning)' }}>
                                            <MessageSquare size={16} />
                                            <span style={{ fontWeight: 600 }}>{video.comments}</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Comments</span>
                                    </div>
                                </div>

                                <a
                                    href={`https://youtube.com/watch?v=${video.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ width: '100%' }}
                                >
                                    <ExternalLink size={14} /> Watch on YouTube
                                </a>
                            </div>
                        </div>

                        {/* AI Chat */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-3">
                                <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
                                Ask AI About This Video
                            </h3>

                            {chatHistory.length > 0 && (
                                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }} className="space-y-2">
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                            marginLeft: msg.role === 'user' ? '1rem' : 0,
                                            marginRight: msg.role === 'assistant' ? '1rem' : 0,
                                            fontSize: '0.85rem'
                                        }}>
                                            {msg.content}
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                                            Thinking...
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ask anything about this video..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                                    style={{ fontSize: '0.85rem' }}
                                />
                                <button
                                    onClick={askQuestion}
                                    className="btn btn-primary btn-sm"
                                    disabled={chatLoading || !question.trim()}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Analysis */}
                    {analysis && (
                        <div className="col-span-2 space-y-4">
                            {/* Viral Score */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="card-title flex items-center gap-2">
                                        <TrendingUp size={20} />
                                        Viral Score
                                    </h3>
                                    <div style={{
                                        fontSize: '2rem',
                                        fontWeight: 700,
                                        color: getScoreColor(analysis.viralScore)
                                    }}>
                                        {analysis.viralScore}/100
                                    </div>
                                </div>
                                <div style={{
                                    height: '8px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${analysis.viralScore}%`,
                                        background: `linear-gradient(90deg, ${getScoreColor(analysis.viralScore)}, var(--accent-primary))`,
                                        borderRadius: '4px'
                                    }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Hook Analysis */}
                                <div className="card">
                                    <h3 className="card-title flex items-center gap-2 mb-3">
                                        <Target size={18} style={{ color: 'var(--accent-youtube)' }} />
                                        Hook Analysis
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{analysis.hookAnalysis}</p>
                                </div>

                                {/* Content Summary */}
                                <div className="card">
                                    <h3 className="card-title flex items-center gap-2 mb-3">
                                        <BookOpen size={18} style={{ color: 'var(--accent-primary)' }} />
                                        Content Summary
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{analysis.transcriptSummary}</p>
                                </div>
                            </div>

                            {/* Key Moments */}
                            {analysis.keyMoments && analysis.keyMoments.length > 0 && (
                                <div className="card">
                                    <h3 className="card-title flex items-center gap-2 mb-3">
                                        <Zap size={18} style={{ color: 'var(--warning)' }} />
                                        Key Moments
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.keyMoments.map((moment, i) => (
                                            <span key={i} style={{
                                                padding: '0.4rem 0.75rem',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '1rem',
                                                fontSize: '0.85rem'
                                            }}>
                                                {moment}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Why It Works */}
                            <div className="card">
                                <h3 className="card-title flex items-center gap-2 mb-3">
                                    <Sparkles size={18} style={{ color: 'var(--success)' }} />
                                    Why It Works
                                </h3>
                                <div className="space-y-2">
                                    {analysis.whyItWorks.map((reason, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <CheckCircle size={16} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Viral Formulas Used */}
                            {analysis.viralFormulas && analysis.viralFormulas.length > 0 && (
                                <div className="card">
                                    <h3 className="card-title flex items-center gap-2 mb-3">
                                        🔥 Viral Formulas Detected
                                    </h3>
                                    <div className="space-y-2">
                                        {analysis.viralFormulas.map((formula, i) => (
                                            <div key={i} style={{
                                                padding: '0.75rem',
                                                background: 'linear-gradient(135deg, var(--bg-tertiary), transparent)',
                                                borderRadius: '0.5rem',
                                                borderLeft: '3px solid var(--accent-primary)',
                                                fontSize: '0.9rem'
                                            }}>
                                                {formula}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Lessons */}
                            <div className="card">
                                <h3 className="card-title flex items-center gap-2 mb-3">
                                    <Lightbulb size={18} style={{ color: 'var(--warning)' }} />
                                    Lessons to Apply
                                </h3>
                                <div className="space-y-2">
                                    {analysis.lessonsForCreators.map((lesson, i) => (
                                        <div key={i} style={{
                                            padding: '0.75rem',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.9rem'
                                        }}>
                                            💡 {lesson}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
