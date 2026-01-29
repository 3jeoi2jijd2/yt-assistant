import { useState } from 'react';
import { Video, Search, TrendingUp, Lightbulb, Target, Sparkles, ExternalLink, ThumbsUp, MessageSquare, Eye, CheckCircle, Send, BookOpen, Zap, FileText, Copy, Check } from 'lucide-react';

interface TranscriptLine {
    timestamp: string;
    text: string;
    startMs: number;
}

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
    keyMoments: string[];
    audienceInsight: string;
}

export default function VideoAnalyzer() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [video, setVideo] = useState<VideoInfo | null>(null);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [transcript, setTranscript] = useState<TranscriptLine[] | null>(null);
    const [transcriptText, setTranscriptText] = useState('');
    const [hasTranscript, setHasTranscript] = useState(false);
    const [error, setError] = useState('');
    const [question, setQuestion] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([]);
    const [showFullTranscript, setShowFullTranscript] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        setError('');
        setVideo(null);
        setAnalysis(null);
        setTranscript(null);
        setTranscriptText('');
        setHasTranscript(false);
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
            setTranscript(data.transcript);
            setTranscriptText(data.transcriptText || '');
            setHasTranscript(data.hasTranscript);
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

    const copyTranscript = () => {
        navigator.clipboard.writeText(transcriptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                <p>Get the FULL transcript + AI analysis of any YouTube video</p>
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
            </form>

            {error && (
                <div className="alert alert-error mb-4">{error}</div>
            )}

            {loading && (
                <div className="card">
                    <div className="loading-overlay" style={{ minHeight: '300px' }}>
                        <div className="loading-spinner"></div>
                        <p>Fetching transcript and analyzing...</p>
                    </div>
                </div>
            )}

            {video && !loading && (
                <div className="animate-slideUp space-y-6">
                    {/* Top Row: Video + Stats */}
                    <div className="grid grid-cols-4 gap-6">
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                            />
                            <div style={{ padding: '1rem' }}>
                                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    {video.title}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {video.channel}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="card flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye size={20} style={{ color: 'var(--accent-primary)' }} />
                                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{video.views}</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Views</span>
                        </div>

                        <div className="card flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                                <ThumbsUp size={20} style={{ color: 'var(--success)' }} />
                                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{video.likes}</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Likes</span>
                        </div>

                        {/* Viral Score */}
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

                    {/* FULL TRANSCRIPT */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="card-title flex items-center gap-2">
                                <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                                Full Transcript
                                {hasTranscript && (
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--success)', color: '#000', borderRadius: '1rem' }}>
                                        ✓ Real Data
                                    </span>
                                )}
                            </h3>
                            <div className="flex gap-2">
                                {hasTranscript && (
                                    <button onClick={copyTranscript} className="btn btn-secondary btn-sm">
                                        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy All</>}
                                    </button>
                                )}
                                {transcript && transcript.length > 10 && (
                                    <button
                                        onClick={() => setShowFullTranscript(!showFullTranscript)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        {showFullTranscript ? 'Show Less' : `Show All (${transcript.length} lines)`}
                                    </button>
                                )}
                            </div>
                        </div>

                        {!hasTranscript ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p>No transcript available for this video.</p>
                                <p style={{ fontSize: '0.85rem' }}>The video may not have captions enabled.</p>
                            </div>
                        ) : (
                            <div style={{
                                maxHeight: showFullTranscript ? 'none' : '400px',
                                overflowY: 'auto',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                padding: '1rem'
                            }}>
                                {transcript?.slice(0, showFullTranscript ? undefined : 20).map((line, i) => (
                                    <div key={i} className="flex gap-3" style={{ marginBottom: '0.5rem' }}>
                                        <span style={{
                                            color: 'var(--accent-primary)',
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            minWidth: '50px'
                                        }}>
                                            {line.timestamp}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {line.text}
                                        </span>
                                    </div>
                                ))}
                                {!showFullTranscript && transcript && transcript.length > 20 && (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                                        ... {transcript.length - 20} more lines
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-6">
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

                        {/* Analysis */}
                        {analysis && (
                            <>
                                <div className="card">
                                    <h3 className="card-title flex items-center gap-2 mb-3">
                                        <Target size={18} style={{ color: 'var(--accent-youtube)' }} />
                                        Hook Analysis
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{analysis.hookAnalysis}</p>
                                </div>

                                <div className="card">
                                    <h3 className="card-title flex items-center gap-2 mb-3">
                                        <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                                        Why It Works
                                    </h3>
                                    <div className="space-y-1">
                                        {analysis.whyItWorks?.slice(0, 3).map((reason, i) => (
                                            <p key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                ✓ {reason}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Lessons */}
                    {analysis?.lessonsForCreators && (
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <Lightbulb size={20} style={{ color: 'var(--warning)' }} />
                                Lessons to Apply
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
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
                    )}
                </div>
            )}
        </div>
    );
}
