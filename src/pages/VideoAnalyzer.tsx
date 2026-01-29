import { useState } from 'react';
import { Video, Search, TrendingUp, Lightbulb, Target, ThumbsUp, Eye, CheckCircle, Send, ListOrdered, MessageSquare, Copy, Check, Clapperboard } from 'lucide-react';

interface VideoInfo {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    views: string;
    likes: string;
    comments: string;
    publishedAt: string;
    description?: string;
}

interface Analysis {
    viralScore: number;
    hookAnalysis: string;
    contentStructure: string;
    whyItWorks: string[];
    viralFormulas: string[];
    lessonsForCreators: string[];
    keyMoments: string[];
    audienceInsight: string;
    recreationSteps: string[];
    estimatedBudget: string;
    difficulty: string;
    equipmentNeeded: string[];
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
    const [copied, setCopied] = useState(false);

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
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: `You are analyzing the video "${video.title}" by ${video.channel}. It has ${video.views} views. Help the user understand this video and how to recreate similar content.` },
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
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not answer that question.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const copyRecreationSteps = () => {
        if (!analysis?.recreationSteps) return;
        const text = analysis.recreationSteps.map((step, i) => `${i + 1}. ${step}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getScoreClass = (score: number) => {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    };

    const getDifficultyColor = (diff: string) => {
        if (diff?.toLowerCase().includes('easy')) return 'var(--success)';
        if (diff?.toLowerCase().includes('medium')) return 'var(--warning)';
        return 'var(--error)';
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1>
                    <Video size={32} />
                    Video Analyzer
                </h1>
                <p>Analyze any YouTube video and get step-by-step recreation guide</p>
            </div>

            {/* Search */}
            <form onSubmit={handleAnalyze} className="card mb-6">
                <div className="flex gap-3">
                    <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Paste any YouTube URL (youtube.com/watch, youtu.be, shorts)..."
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
            </form>

            {error && <div className="alert alert-error mb-4">{error}</div>}

            {loading && (
                <div className="card">
                    <div className="loading-overlay" style={{ minHeight: '300px' }}>
                        <div className="loading-spinner"></div>
                        <p>Analyzing video content and creating recreation guide...</p>
                    </div>
                </div>
            )}

            {video && !loading && (
                <div className="animate-slideUp space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="stat-card">
                            <div className="icon">
                                <Eye size={24} />
                            </div>
                            <div className="value">{video.views}</div>
                            <div className="label">Views</div>
                        </div>
                        <div className="stat-card">
                            <div className="icon" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                                <ThumbsUp size={24} />
                            </div>
                            <div className="value">{video.likes}</div>
                            <div className="label">Likes</div>
                        </div>
                        <div className="stat-card">
                            <div className="icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #22d3ee)' }}>
                                <MessageSquare size={24} />
                            </div>
                            <div className="value">{video.comments}</div>
                            <div className="label">Comments</div>
                        </div>
                        {analysis && (
                            <div className="stat-card">
                                <div className={`score-circle ${getScoreClass(analysis.viralScore)}`} style={{ margin: '0 auto 0.5rem' }}>
                                    {analysis.viralScore}
                                </div>
                                <div className="label">Viral Score</div>
                            </div>
                        )}
                    </div>

                    {/* Video Info + AI Chat */}
                    <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        {/* Video Card */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                            />
                            <div style={{ padding: '1.25rem' }}>
                                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                                    {video.title}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {video.channel}
                                </p>
                            </div>
                        </div>

                        {/* AI Chat */}
                        <div className="ai-chat-box">
                            <div className="ai-chat-header">
                                <MessageSquare size={18} />
                                <span>Ask About This Video</span>
                            </div>

                            <div className="ai-chat-messages">
                                {chatHistory.length === 0 ? (
                                    <div className="ai-chat-placeholder">
                                        <p>🎬 Ask me anything about this video!</p>
                                        <div className="suggestions">
                                            "What editing software did they use?"<br />
                                            "How can I make my version unique?"<br />
                                            "What's the filming technique?"
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
                                    placeholder="Ask anything..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                                />
                                <button onClick={askQuestion} disabled={chatLoading}>
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recreation Steps */}
                    {analysis?.recreationSteps && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <ListOrdered size={20} />
                                    How to Recreate This Video
                                </h3>
                                <button onClick={copyRecreationSteps} className="btn btn-secondary btn-sm">
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? 'Copied!' : 'Copy Steps'}
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Difficulty</p>
                                    <p style={{ fontWeight: 700, color: getDifficultyColor(analysis.difficulty), fontSize: '1.1rem' }}>{analysis.difficulty}</p>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Est. Budget</p>
                                    <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{analysis.estimatedBudget}</p>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Equipment</p>
                                    <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{analysis.equipmentNeeded?.length || 0} items</p>
                                </div>
                            </div>

                            <div className="step-list">
                                {analysis.recreationSteps.map((step, i) => (
                                    <div key={i} className="step-item">
                                        <div className="step-number">{i + 1}</div>
                                        <div className="step-content">{step}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Equipment */}
                    {analysis?.equipmentNeeded && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <Clapperboard size={20} style={{ color: 'var(--warning)' }} />
                                    Equipment Needed
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {analysis.equipmentNeeded.map((item, i) => (
                                    <span key={i} className="badge badge-primary">{item}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Analysis Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Hook Analysis */}
                        {analysis && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <Target size={20} style={{ color: 'var(--accent-youtube)' }} />
                                        Hook Analysis
                                    </h3>
                                </div>
                                <p style={{ color: 'var(--text-secondary)' }}>{analysis.hookAnalysis}</p>
                            </div>
                        )}

                        {/* Why It Works */}
                        {analysis && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                                        Why It Works
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {analysis.whyItWorks?.map((reason, i) => (
                                        <div key={i} style={{
                                            padding: '0.75rem',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.9rem',
                                            borderLeft: '3px solid var(--success)'
                                        }}>
                                            ✓ {reason}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Viral Formulas */}
                        {analysis && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <TrendingUp size={20} />
                                        Viral Formulas Used
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.viralFormulas?.map((formula, i) => (
                                        <span key={i} className="badge badge-primary">{formula}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Lessons */}
                        {analysis && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <Lightbulb size={20} style={{ color: 'var(--warning)' }} />
                                        Key Lessons
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {analysis.lessonsForCreators?.map((lesson, i) => (
                                        <div key={i} style={{
                                            padding: '0.75rem',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.9rem'
                                        }}>
                                            💡 {lesson}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
