import { useState } from 'react';
import { Video, Search, TrendingUp, Lightbulb, Target, Sparkles, ThumbsUp, Eye, CheckCircle, Send, BookOpen, ListOrdered, MessageSquare, Copy, Check, Clapperboard } from 'lucide-react';

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

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 60) return 'var(--warning)';
        return 'var(--error)';
    };

    const getDifficultyColor = (diff: string) => {
        if (diff?.toLowerCase().includes('easy')) return 'var(--success)';
        if (diff?.toLowerCase().includes('medium')) return 'var(--warning)';
        return 'var(--error)';
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Video size={32} style={{ color: 'var(--accent-youtube)' }} />
                    Video Analyzer
                </h1>
                <p>Analyze any YouTube video and get step-by-step recreation guide</p>
            </div>

            {/* Search */}
            <form onSubmit={handleAnalyze} className="card mb-6">
                <div className="flex gap-3 flex-wrap">
                    <div className="form-group flex-1" style={{ marginBottom: 0, minWidth: '200px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Paste any YouTube URL..."
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
                    {/* Top Row: Video + Stats + Score */}
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                            />
                            <div style={{ padding: '1rem' }}>
                                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', lineHeight: 1.3 }}>
                                    {video.title}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {video.channel}
                                </p>
                            </div>
                        </div>

                        <div className="card flex flex-col justify-center items-center">
                            <Eye size={24} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
                            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{video.views}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Views</span>
                        </div>

                        <div className="card flex flex-col justify-center items-center">
                            <ThumbsUp size={24} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{video.likes}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Likes</span>
                        </div>

                        {analysis && (
                            <div className="card flex flex-col justify-center items-center">
                                <div style={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: '50%',
                                    border: `4px solid ${getScoreColor(analysis.viralScore)}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.3rem',
                                    fontWeight: 700,
                                    color: getScoreColor(analysis.viralScore)
                                }}>
                                    {analysis.viralScore}
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Viral Score</span>
                            </div>
                        )}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        {/* Left Column: Recreation Guide */}
                        <div className="space-y-4">
                            {/* Step-by-Step Recreation */}
                            {analysis?.recreationSteps && (
                                <div className="card">
                                    <div className="card-header" style={{ marginBottom: '1rem' }}>
                                        <h3 className="card-title flex items-center gap-2">
                                            <ListOrdered size={20} style={{ color: 'var(--accent-primary)' }} />
                                            How to Recreate This Video
                                        </h3>
                                        <button onClick={copyRecreationSteps} className="btn btn-secondary btn-sm">
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {analysis.recreationSteps.map((step, i) => (
                                            <div key={i} className="flex gap-3" style={{
                                                padding: '0.75rem',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '0.5rem',
                                                borderLeft: '3px solid var(--accent-primary)'
                                            }}>
                                                <span style={{
                                                    background: 'var(--accent-primary)',
                                                    color: 'white',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    flexShrink: 0
                                                }}>
                                                    {i + 1}
                                                </span>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{step}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Difficulty</p>
                                            <p style={{ fontWeight: 600, color: getDifficultyColor(analysis.difficulty) }}>{analysis.difficulty}</p>
                                        </div>
                                        <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Est. Budget</p>
                                            <p style={{ fontWeight: 600 }}>{analysis.estimatedBudget}</p>
                                        </div>
                                        <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Equipment</p>
                                            <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{analysis.equipmentNeeded?.length || 0} items</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Equipment Needed */}
                            {analysis?.equipmentNeeded && (
                                <div className="card">
                                    <h3 className="card-title flex items-center gap-2 mb-3">
                                        <Clapperboard size={18} style={{ color: 'var(--warning)' }} />
                                        Equipment Needed
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.equipmentNeeded.map((item, i) => (
                                            <span key={i} className="badge badge-primary">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Chat */}
                            <div className="card">
                                <h3 className="card-title flex items-center gap-2 mb-3">
                                    <MessageSquare size={18} style={{ color: 'var(--accent-primary)' }} />
                                    Ask About This Video
                                </h3>

                                <div style={{
                                    minHeight: '150px',
                                    maxHeight: '250px',
                                    overflowY: 'auto',
                                    marginBottom: '1rem',
                                    padding: '0.5rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem'
                                }}>
                                    {chatHistory.length === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
                                            Ask anything!
                                            <br /><br />
                                            • "What editing software did they use?"
                                            <br />• "How can I make my version unique?"
                                            <br />• "What's the filming technique?"
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {chatHistory.map((msg, i) => (
                                                <div key={i} style={{
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '0.5rem',
                                                    background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {msg.content}
                                                </div>
                                            ))}
                                            {chatLoading && (
                                                <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    Thinking...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ask anything..."
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                    <button onClick={askQuestion} className="btn btn-primary btn-sm" disabled={chatLoading}>
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Analysis */}
                        <div className="space-y-4">
                            {analysis && (
                                <>
                                    {/* Hook Analysis */}
                                    <div className="card">
                                        <h3 className="card-title flex items-center gap-2 mb-3">
                                            <Target size={18} style={{ color: 'var(--accent-youtube)' }} />
                                            Hook Analysis
                                        </h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{analysis.hookAnalysis}</p>
                                    </div>

                                    {/* Why It Works */}
                                    <div className="card">
                                        <h3 className="card-title flex items-center gap-2 mb-3">
                                            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                                            Why It Works
                                        </h3>
                                        <div className="space-y-2">
                                            {analysis.whyItWorks?.map((reason, i) => (
                                                <div key={i} style={{
                                                    padding: '0.5rem 0.75rem',
                                                    background: 'var(--bg-tertiary)',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.9rem',
                                                    borderLeft: '3px solid var(--success)'
                                                }}>
                                                    ✓ {reason}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Viral Formulas Used */}
                                    <div className="card">
                                        <h3 className="card-title flex items-center gap-2 mb-3">
                                            <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
                                            Viral Formulas Used
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.viralFormulas?.map((formula, i) => (
                                                <span key={i} style={{
                                                    padding: '0.5rem 0.75rem',
                                                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500
                                                }}>
                                                    {formula}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Lessons */}
                                    <div className="card">
                                        <h3 className="card-title flex items-center gap-2 mb-3">
                                            <Lightbulb size={18} style={{ color: 'var(--warning)' }} />
                                            Key Lessons
                                        </h3>
                                        <div className="space-y-2">
                                            {analysis.lessonsForCreators?.map((lesson, i) => (
                                                <div key={i} style={{
                                                    padding: '0.5rem 0.75rem',
                                                    background: 'var(--bg-tertiary)',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    💡 {lesson}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
