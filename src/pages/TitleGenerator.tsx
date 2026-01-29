import { useState } from 'react';
import { Type, Sparkles, Copy, Check, RefreshCw, MessageSquare, Send } from 'lucide-react';

interface GeneratedTitle {
    title: string;
    score: number;
    whyItWorks: string;
}

export default function TitleGenerator() {
    const [topic, setTopic] = useState('');
    const [niche, setNiche] = useState('');
    const [style, setStyle] = useState<'curiosity' | 'how-to' | 'listicle' | 'controversial'>('curiosity');
    const [loading, setLoading] = useState(false);
    const [titles, setTitles] = useState<GeneratedTitle[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [error, setError] = useState('');

    // AI Chat
    const [question, setQuestion] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setLoading(true);
        setError('');
        setTitles([]);

        try {
            const response = await fetch('/api/generate-titles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, niche, style })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate titles');
            }

            setTitles(data.titles);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate titles');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (title: string, index: number) => {
        await navigator.clipboard.writeText(title);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
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
            const context = titles.length > 0
                ? `User generated titles for "${topic}". Top titles: ${titles.slice(0, 3).map(t => t.title).join(', ')}. They ask:`
                : `User is creating titles for YouTube videos. They ask:`;

            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: `You are a YouTube title expert (Jan 2026). Help create viral, clickable titles. Be specific and creative. ${context}` },
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
                    <Type size={32} />
                    Viral Title Generator
                </h1>
                <p>AI-powered titles that maximize CTR and views</p>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
                {/* Main Content */}
                <div className="space-y-6">
                    {/* Form */}
                    <form onSubmit={handleGenerate} className="card">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Video Topic *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., iPhone 16 review, morning routine, day trading..."
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Niche (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Tech, Fitness, Finance..."
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label">Title Style</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { value: 'curiosity', label: '🧠 Curiosity Gap' },
                                    { value: 'how-to', label: '📚 How-To' },
                                    { value: 'listicle', label: '📋 Listicle' },
                                    { value: 'controversial', label: '🔥 Controversial' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`btn ${style === option.value ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setStyle(option.value as any)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || !topic.trim()}>
                            {loading ? (
                                <>
                                    <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Generate Viral Titles
                                </>
                            )}
                        </button>
                    </form>

                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Results */}
                    {titles.length > 0 && (
                        <div className="card animate-slideUp">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <Sparkles size={20} />
                                    Generated Titles
                                </h3>
                                <button onClick={handleGenerate} className="btn btn-secondary btn-sm" disabled={loading}>
                                    <RefreshCw size={14} /> Regenerate
                                </button>
                            </div>

                            <div className="space-y-4">
                                {titles.map((item, index) => (
                                    <div key={index} style={{
                                        padding: '1.25rem',
                                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(6, 182, 212, 0.02))',
                                        border: '1px solid rgba(139, 92, 246, 0.2)',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                                    {item.title}
                                                </h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {item.whyItWorks}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`score-circle ${getScoreClass(item.score)}`} style={{ width: 50, height: 50, fontSize: '0.9rem' }}>
                                                    {item.score}
                                                </div>
                                                <button
                                                    onClick={() => handleCopy(item.title, index)}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Chat Sidebar */}
                <div className="ai-chat-box" style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                    <div className="ai-chat-header">
                        <MessageSquare size={18} />
                        <span>Title AI Assistant</span>
                    </div>

                    <div className="ai-chat-messages">
                        {chatHistory.length === 0 ? (
                            <div className="ai-chat-placeholder">
                                <p>✍️ Need help with titles?</p>
                                <div className="suggestions">
                                    "Make it more clickable"<br />
                                    "Give me 5 variations"<br />
                                    "Which title is best?"
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
                            placeholder="Ask about titles..."
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
        </div>
    );
}
