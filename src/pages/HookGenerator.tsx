import { useState } from 'react';
import { Zap, Copy, Check, RefreshCw, Sparkles, Clock } from 'lucide-react';

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

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Zap size={32} style={{ color: 'var(--accent-youtube)' }} />
                    Hook Generator
                </h1>
                <p>Create scroll-stopping hooks that grab attention in 3 seconds</p>
            </div>

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

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

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
                                    border: '1px solid var(--border-color)',
                                    position: 'relative'
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
    );
}
