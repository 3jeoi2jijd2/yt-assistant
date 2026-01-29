import { useState } from 'react';
import { Music, TrendingUp, Zap, Lightbulb, Target, Send, Sparkles, Volume2, Film, MessageSquare } from 'lucide-react';

interface Sound {
    name: string;
    description: string;
    usage: string;
    potential: string;
}

interface Format {
    name: string;
    description: string;
    example: string;
    difficulty: string;
}

interface Hook {
    hook: string;
    whyItWorks: string;
}

interface NicheOpp {
    niche: string;
    growth: string;
    strategy: string;
}

interface ContentIdea {
    idea: string;
    format: string;
    estimatedViews: string;
    difficulty: string;
}

interface Trends {
    trendingSounds: Sound[];
    trendingFormats: Format[];
    viralHooks: Hook[];
    nicheOpportunities: NicheOpp[];
    algorithmTips: string[];
    contentIdeas: ContentIdea[];
}

export default function TikTokAnalyzer() {
    const [niche, setNiche] = useState('');
    const [loading, setLoading] = useState(false);
    const [trends, setTrends] = useState<Trends | null>(null);
    const [error, setError] = useState('');
    const [question, setQuestion] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([]);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/tiktok-trends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze');
            }

            setTrends(data.trends);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get trends');
        } finally {
            setLoading(false);
        }
    };

    const askQuestion = async () => {
        if (!question.trim() || chatLoading) return;

        const userQuestion = question;
        setQuestion('');
        setChatHistory(prev => [...prev, { role: 'user', content: userQuestion }]);
        setChatLoading(true);

        try {
            const response = await fetch('/api/tiktok-trends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userQuestion })
            });

            const data = await response.json();

            if (data.chatResponse) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: data.chatResponse }]);
            }
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not answer that.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const getPotentialColor = (potential: string) => {
        if (potential === 'high') return 'var(--success)';
        if (potential === 'medium') return 'var(--warning)';
        return 'var(--text-muted)';
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Music size={32} style={{ color: '#00f2ea' }} />
                    TikTok Analyzer
                </h1>
                <p>Discover trending sounds, viral formats, and growth opportunities on TikTok</p>
            </div>

            {/* Search + Chat */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="col-span-2">
                    <form onSubmit={handleAnalyze} className="card">
                        <div className="flex gap-3">
                            <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter your niche (optional) - e.g., fitness, comedy, cooking..."
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                                ) : (
                                    <><TrendingUp size={18} /> Analyze Trends</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* AI Chat */}
                <div className="card">
                    <h3 className="card-title flex items-center gap-2 mb-3" style={{ fontSize: '0.9rem' }}>
                        <MessageSquare size={16} style={{ color: '#00f2ea' }} />
                        Ask TikTok AI
                    </h3>

                    {chatHistory.length > 0 && (
                        <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '0.75rem' }} className="space-y-2">
                            {chatHistory.map((msg, i) => (
                                <div key={i} style={{
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: '0.4rem',
                                    background: msg.role === 'user' ? '#00f2ea' : 'var(--bg-tertiary)',
                                    color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
                                    fontSize: '0.8rem'
                                }}>
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ask about TikTok..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                        />
                        <button
                            onClick={askQuestion}
                            className="btn btn-primary btn-sm"
                            disabled={chatLoading}
                            style={{ background: '#00f2ea', color: '#000' }}
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error mb-4">{error}</div>
            )}

            {loading && (
                <div className="card">
                    <div className="loading-overlay" style={{ minHeight: '300px' }}>
                        <div className="loading-spinner"></div>
                        <p>Analyzing TikTok trends...</p>
                    </div>
                </div>
            )}

            {trends && !loading && (
                <div className="animate-slideUp space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Trending Sounds */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <Volume2 size={20} style={{ color: '#00f2ea' }} />
                                Trending Sounds
                            </h3>
                            <div className="space-y-3">
                                {trends.trendingSounds?.map((sound, i) => (
                                    <div key={i} style={{
                                        padding: '0.75rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem'
                                    }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span style={{ fontWeight: 600 }}>🎵 {sound.name}</span>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '1rem',
                                                background: getPotentialColor(sound.potential),
                                                color: '#000'
                                            }}>
                                                {sound.potential}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            {sound.description}
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            💡 {sound.usage}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trending Formats */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <Film size={20} style={{ color: '#fe2c55' }} />
                                Viral Formats
                            </h3>
                            <div className="space-y-3">
                                {trends.trendingFormats?.map((format, i) => (
                                    <div key={i} style={{
                                        padding: '0.75rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '0.5rem'
                                    }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span style={{ fontWeight: 600 }}>{format.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {format.difficulty}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            {format.description}
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                                            📹 {format.example}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Viral Hooks */}
                    <div className="card">
                        <h3 className="card-title flex items-center gap-2 mb-4">
                            <Zap size={20} style={{ color: 'var(--warning)' }} />
                            Viral Hook Formulas
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {trends.viralHooks?.map((hook, i) => (
                                <div key={i} style={{
                                    padding: '0.75rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem',
                                    borderLeft: '3px solid var(--warning)'
                                }}>
                                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>"{hook.hook}"</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        🧠 {hook.whyItWorks}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Algorithm Tips */}
                    <div className="card">
                        <h3 className="card-title flex items-center gap-2 mb-4">
                            <Target size={20} style={{ color: 'var(--success)' }} />
                            Algorithm Tips (Jan 2026)
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {trends.algorithmTips?.map((tip, i) => (
                                <div key={i} style={{
                                    padding: '0.75rem',
                                    background: 'linear-gradient(135deg, var(--bg-tertiary), transparent)',
                                    borderRadius: '0.5rem',
                                    textAlign: 'center',
                                    fontSize: '0.9rem'
                                }}>
                                    ✅ {tip}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Ideas */}
                    <div className="card">
                        <h3 className="card-title flex items-center gap-2 mb-4">
                            <Lightbulb size={20} style={{ color: 'var(--accent-primary)' }} />
                            Content Ideas for You
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {trends.contentIdeas?.map((idea, i) => (
                                <div key={i} style={{
                                    padding: '1rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '0.5rem'
                                }}>
                                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>💡 {idea.idea}</p>
                                    <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '0.75rem' }}>
                                        <span style={{ padding: '0.2rem 0.4rem', background: 'var(--bg-secondary)', borderRadius: '0.25rem' }}>
                                            {idea.format}
                                        </span>
                                        <span style={{ padding: '0.2rem 0.4rem', background: 'var(--bg-secondary)', borderRadius: '0.25rem' }}>
                                            📈 {idea.estimatedViews}
                                        </span>
                                        <span style={{ padding: '0.2rem 0.4rem', background: 'var(--bg-secondary)', borderRadius: '0.25rem' }}>
                                            {idea.difficulty}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
