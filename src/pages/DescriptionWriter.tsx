import { useState } from 'react';
import { AlignLeft, Copy, Check, Sparkles, Youtube, Hash, Link } from 'lucide-react';

const platforms = [
    { id: 'youtube', name: 'YouTube', icon: '📺' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'instagram', name: 'Instagram', icon: '📸' }
];

export default function DescriptionWriter() {
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState('youtube');
    const [includeTimestamps, setIncludeTimestamps] = useState(true);
    const [includeCTA, setIncludeCTA] = useState(true);
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!title.trim()) {
            setError('Please enter a video title');
            return;
        }

        setLoading(true);
        setError('');
        setDescription('');

        try {
            const response = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    topic,
                    platform,
                    includeTimestamps,
                    includeCTA
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate description');
            }

            setDescription(data.description || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate description');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(description);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <AlignLeft size={32} style={{ color: 'var(--accent-primary)' }} />
                    Description Writer
                </h1>
                <p>Create SEO-optimized video descriptions that boost discoverability</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="card-title mb-4">Video Details</h3>

                    <div className="form-group mb-4">
                        <label className="form-label">Video Title</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your video title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label className="form-label">What's the video about? (optional)</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Brief summary of the video content..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label className="form-label">Platform</label>
                        <div className="flex gap-2">
                            {platforms.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPlatform(p.id)}
                                    className={`btn ${platform === p.id ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                >
                                    {p.icon} {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group mb-4">
                        <label className="form-label">Include</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeTimestamps}
                                    onChange={(e) => setIncludeTimestamps(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>📍 Timestamps (chapters)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeCTA}
                                    onChange={(e) => setIncludeCTA(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>🔔 Call-to-Action (subscribe, like)</span>
                            </label>
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
                                Writing Description...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate Description
                            </>
                        )}
                    </button>
                </div>

                <div className="card">
                    <div className="card-header" style={{ padding: 0, marginBottom: '1rem' }}>
                        <h3 className="card-title">Generated Description</h3>
                        {description && (
                            <button onClick={handleCopy} className="btn btn-primary btn-sm">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="alert alert-error mb-4">
                            {error}
                        </div>
                    )}

                    {description ? (
                        <div
                            className="script-content animate-slideUp"
                            style={{
                                whiteSpace: 'pre-wrap',
                                background: 'var(--bg-tertiary)',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                minHeight: '400px',
                                maxHeight: '500px',
                                overflow: 'auto'
                            }}
                        >
                            {description}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ minHeight: '400px' }}>
                            <AlignLeft size={48} style={{ opacity: 0.3 }} />
                            <p>Your optimized description will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
