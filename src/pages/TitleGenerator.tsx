import { useState } from 'react';
import { Type, Copy, Check, RefreshCw, Sparkles, Send, MessageSquare } from 'lucide-react';

const platforms = [
    { id: 'youtube', name: 'YouTube', icon: '📺' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'instagram', name: 'Instagram Reels', icon: '📸' },
    { id: 'shorts', name: 'YouTube Shorts', icon: '⚡' }
];

const titleStyles = [
    { id: 'curiosity', name: 'Curiosity Gap', emoji: '🤔', desc: 'Creates mystery' },
    { id: 'listicle', name: 'Listicle', emoji: '📝', desc: 'Numbered lists' },
    { id: 'howto', name: 'How-To', emoji: '🔧', desc: 'Tutorial style' },
    { id: 'controversial', name: 'Controversial', emoji: '🔥', desc: 'Bold takes' },
    { id: 'emotional', name: 'Emotional', emoji: '💔', desc: 'Feelings-based' },
    { id: 'urgency', name: 'Urgency', emoji: '⚡', desc: 'Time-sensitive' }
];

export default function TitleGenerator() {
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState('youtube');
    const [style, setStyle] = useState('curiosity');
    const [loading, setLoading] = useState(false);
    const [titles, setTitles] = useState<string[]>([]);
    const [copied, setCopied] = useState<number | null>(null);
    const [error, setError] = useState('');

    // AI Chat state
    const [question, setQuestion] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([]);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setLoading(true);
        setError('');
        setTitles([]);

        try {
            const response = await fetch('/api/generate-titles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, platform, style })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate titles');
            }

            setTitles(data.titles || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate titles');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (title: string, index: number) => {
        await navigator.clipboard.writeText(title);
        setCopied(index);
        setTimeout(() => setCopied(null), 2000);
    };

    const askAI = async () => {
        if (!question.trim() || chatLoading) return;

        const userQuestion = question;
        setQuestion('');
        setChatHistory(prev => [...prev, { role: 'user', content: userQuestion }]);
        setChatLoading(true);

        try {
            const context = titles.length > 0
                ? `User generated these titles for "${topic}":\n${titles.join('\n')}\n\nNow they're asking:`
                : `User is working on titles for "${topic || 'their video'}". They're asking:`;

            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: `You are an expert at viral YouTube/TikTok titles. Help the user improve their titles. Be specific and actionable. ${context}` },
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
                <h1 className="flex items-center gap-3">
                    <Type size={32} style={{ color: 'var(--accent-primary)' }} />
                    Viral Title Generator
                </h1>
                <p>Generate click-worthy titles that drive views and engagement</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="col-span-2">
                    <div className="card mb-6">
                        <div className="form-group mb-4">
                            <label className="form-label">What's your video about?</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., morning routine for productivity, how I made $10k..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label">Platform</label>
                            <div className="grid grid-cols-4 gap-2">
                                {platforms.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPlatform(p.id)}
                                        className={`btn ${platform === p.id ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ flexDirection: 'column', padding: '0.75rem', gap: '0.25rem' }}
                                    >
                                        <span style={{ fontSize: '1.25rem' }}>{p.icon}</span>
                                        <span style={{ fontSize: '0.75rem' }}>{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label">Title Style</label>
                            <div className="grid grid-cols-3 gap-2">
                                {titleStyles.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setStyle(s.id)}
                                        className={`btn ${style === s.id ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ flexDirection: 'column', padding: '0.75rem', gap: '0.25rem', alignItems: 'flex-start' }}
                                    >
                                        <span>{s.emoji} {s.name}</span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{s.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                                    Generating Viral Titles...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Generate Titles
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-error mb-4">{error}</div>
                    )}

                    {titles.length > 0 && (
                        <div className="card animate-slideUp">
                            <div className="card-header">
                                <h3 className="card-title flex items-center gap-2">
                                    <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                                    Generated Titles ({titles.length})
                                </h3>
                                <button onClick={handleGenerate} className="btn btn-secondary btn-sm">
                                    <RefreshCw size={16} />
                                    Regenerate
                                </button>
                            </div>
                            <div className="space-y-3">
                                {titles.map((title, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-4"
                                        style={{
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '0.75rem',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        <span style={{
                                            background: 'var(--accent-primary)',
                                            color: 'white',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            flexShrink: 0
                                        }}>
                                            {index + 1}
                                        </span>
                                        <span style={{ flex: 1, fontWeight: 500 }}>{title}</span>
                                        <button
                                            onClick={() => handleCopy(title, index)}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            {copied === index ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Chat Sidebar */}
                <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '1rem' }}>
                    <h3 className="card-title flex items-center gap-2 mb-4">
                        <MessageSquare size={20} style={{ color: 'var(--accent-primary)' }} />
                        AI Title Assistant
                    </h3>

                    <div style={{
                        height: '300px',
                        overflowY: 'auto',
                        marginBottom: '1rem',
                        padding: '0.5rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '0.5rem'
                    }}>
                        {chatHistory.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
                                Ask me anything about titles!
                                <br /><br />
                                Examples:
                                <br />• "Make this title more clickable"
                                <br />• "Which title is best?"
                                <br />• "Give me a controversial angle"
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} style={{
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        fontSize: '0.85rem',
                                        marginLeft: msg.role === 'user' ? '1rem' : 0,
                                        marginRight: msg.role === 'assistant' ? '1rem' : 0
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
                            placeholder="Ask about titles..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && askAI()}
                            style={{ fontSize: '0.85rem' }}
                        />
                        <button onClick={askAI} className="btn btn-primary btn-sm" disabled={chatLoading}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
