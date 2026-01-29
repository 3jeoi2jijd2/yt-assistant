import { useState } from 'react';
import { Zap, Copy, Check, RefreshCw, Sparkles, Clock, Send, MessageSquare } from 'lucide-react';

const hookTypes = [
    { id: 'question', name: 'Question Hook', emoji: '❓', example: '"What if I told you..."' },
    { id: 'statistic', name: 'Shocking Stat', emoji: '📊', example: '"97% of people don\'t know..."' },
    { id: 'story', name: 'Story Hook', emoji: '📖', example: '"Last week, something crazy happened..."' },
    { id: 'controversy', name: 'Controversial', emoji: '🔥', example: '"Nobody talks about this but..."' },
    { id: 'promise', name: 'Promise Hook', emoji: '✨', example: '"By the end of this video..."' },
    { id: 'pov', name: 'POV Hook', emoji: '👀', example: '"POV: You just discovered..."' }
];

const durations = [
    { id: 'short', name: '3 seconds', icon: Clock },
    { id: 'medium', name: '5 seconds', icon: Clock },
    { id: 'long', name: '10 seconds', icon: Clock }
];

export default function HookGenerator() {
    const [topic, setTopic] = useState('');
    const [hookType, setHookType] = useState('question');
    const [duration, setDuration] = useState('short');
    const [loading, setLoading] = useState(false);
    const [hooks, setHooks] = useState<string[]>([]);
    const [copied, setCopied] = useState<number | null>(null);
    const [error, setError] = useState('');

    // AI Chat
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
        setHooks([]);

        try {
            const response = await fetch('/api/generate-hooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, hookType, duration })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate hooks');
            }

            setHooks(data.hooks || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate hooks');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (hook: string, index: number) => {
        await navigator.clipboard.writeText(hook);
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
            const context = hooks.length > 0
                ? `User generated these hooks for "${topic}":\n${hooks.join('\n')}\n\nNow they ask:`
                : `User is creating hooks for "${topic || 'their video'}". They ask:`;

            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: `You are an expert at viral video hooks that stop the scroll in 3 seconds. Help improve hooks. Be specific. ${context}` },
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
                    <Zap size={32} style={{ color: 'var(--accent-youtube)' }} />
                    Hook Generator
                </h1>
                <p>Create scroll-stopping hooks that grab attention in 3 seconds</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                    <div className="card mb-6">
                        <div className="form-group mb-4">
                            <label className="form-label">What's your video about?</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., how to grow on YouTube, making money online..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label">Hook Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {hookTypes.map((h) => (
                                    <button
                                        key={h.id}
                                        onClick={() => setHookType(h.id)}
                                        className={`btn ${hookType === h.id ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ flexDirection: 'column', padding: '0.75rem', gap: '0.25rem', alignItems: 'flex-start' }}
                                    >
                                        <span>{h.emoji} {h.name}</span>
                                        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{h.example}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label">Hook Duration</label>
                            <div className="flex gap-2">
                                {durations.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDuration(d.id)}
                                        className={`btn ${duration === d.id ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ flex: 1 }}
                                    >
                                        <Clock size={16} />
                                        {d.name}
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
                                    Creating Hooks...
                                </>
                            ) : (
                                <>
                                    <Zap size={20} />
                                    Generate Hooks
                                </>
                            )}
                        </button>
                    </div>

                    {error && <div className="alert alert-error mb-4">{error}</div>}

                    {hooks.length > 0 && (
                        <div className="card animate-slideUp">
                            <div className="card-header">
                                <h3 className="card-title flex items-center gap-2">
                                    <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                                    Your Scroll-Stopping Hooks
                                </h3>
                                <button onClick={handleGenerate} className="btn btn-secondary btn-sm">
                                    <RefreshCw size={16} />
                                    Regenerate
                                </button>
                            </div>
                            <div className="space-y-4">
                                {hooks.map((hook, index) => (
                                    <div
                                        key={index}
                                        className="p-4"
                                        style={{
                                            background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
                                            borderRadius: '0.75rem',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span style={{
                                                background: 'var(--accent-youtube)',
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
                                            <p style={{ flex: 1, fontWeight: 500, fontSize: '1.1rem', lineHeight: 1.5 }}>
                                                "{hook}"
                                            </p>
                                            <button
                                                onClick={() => handleCopy(hook, index)}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                {copied === index ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Chat Sidebar */}
                <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '1rem' }}>
                    <h3 className="card-title flex items-center gap-2 mb-4">
                        <MessageSquare size={20} style={{ color: 'var(--accent-youtube)' }} />
                        AI Hook Expert
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
                                Ask me about hooks!
                                <br /><br />
                                Examples:
                                <br />• "Make this more controversial"
                                <br />• "Give me a fear-based hook"
                                <br />• "Which hook is strongest?"
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} style={{
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        background: msg.role === 'user' ? 'var(--accent-youtube)' : 'var(--bg-secondary)',
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
                            placeholder="Ask about hooks..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && askAI()}
                            style={{ fontSize: '0.85rem' }}
                        />
                        <button onClick={askAI} className="btn btn-primary btn-sm" disabled={chatLoading} style={{ background: 'var(--accent-youtube)' }}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
