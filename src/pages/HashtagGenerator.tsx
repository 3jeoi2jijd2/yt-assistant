import { useState } from 'react';
import { Hash, Copy, Check, RefreshCw, Sparkles } from 'lucide-react';

const platforms = [
    { id: 'youtube', name: 'YouTube', icon: '📺', maxTags: 15 },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', maxTags: 8 },
    { id: 'instagram', name: 'Instagram', icon: '📸', maxTags: 30 },
    { id: 'twitter', name: 'X / Twitter', icon: '🐦', maxTags: 5 }
];

export default function HashtagGenerator() {
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState('youtube');
    const [loading, setLoading] = useState(false);
    const [hashtags, setHashtags] = useState<{ tag: string; popularity: string }[]>([]);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic or niche');
            return;
        }

        setLoading(true);
        setError('');
        setHashtags([]);

        try {
            const response = await fetch('/api/generate-hashtags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, platform })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate hashtags');
            }

            setHashtags(data.hashtags || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate hashtags');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyAll = async () => {
        const allHashtags = hashtags.map(h => h.tag).join(' ');
        await navigator.clipboard.writeText(allHashtags);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getPopularityColor = (popularity: string) => {
        switch (popularity.toLowerCase()) {
            case 'high': return 'var(--success)';
            case 'medium': return 'var(--accent-primary)';
            case 'low': return 'var(--text-muted)';
            default: return 'var(--accent-primary)';
        }
    };

    const selectedPlatform = platforms.find(p => p.id === platform);

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Hash size={32} style={{ color: 'var(--accent-tiktok)' }} />
                    Hashtag Generator
                </h1>
                <p>Generate optimized hashtags to boost your content discoverability</p>
            </div>

            <div className="card mb-6">
                <div className="form-group mb-4">
                    <label className="form-label">Topic or Niche</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., fitness motivation, cooking recipes, tech reviews..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>

                <div className="form-group mb-4">
                    <label className="form-label">Platform</label>
                    <div className="grid grid-cols-2 gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
                    <p className="text-sm text-muted mt-2">
                        {selectedPlatform?.icon} {selectedPlatform?.name} recommends up to {selectedPlatform?.maxTags} hashtags
                    </p>
                </div>

                <button
                    onClick={handleGenerate}
                    className="btn btn-primary btn-lg w-full"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                            Generating Hashtags...
                        </>
                    ) : (
                        <>
                            <Hash size={20} />
                            Generate Hashtags
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {hashtags.length > 0 && (
                <div className="card animate-slideUp">
                    <div className="card-header">
                        <h3 className="card-title flex items-center gap-2">
                            <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                            Generated Hashtags ({hashtags.length})
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={handleGenerate} className="btn btn-secondary btn-sm">
                                <RefreshCw size={16} />
                                New
                            </button>
                            <button onClick={handleCopyAll} className="btn btn-primary btn-sm">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy All'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {hashtags.map((h, index) => (
                            <span
                                key={index}
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '2rem',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {h.tag}
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: getPopularityColor(h.popularity)
                                }} title={`${h.popularity} popularity`}></span>
                            </span>
                        ))}
                    </div>

                    <div style={{
                        background: 'var(--bg-tertiary)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        wordBreak: 'break-word'
                    }}>
                        {hashtags.map(h => h.tag).join(' ')}
                    </div>

                    <div className="flex gap-4 mt-4 text-sm">
                        <span className="flex items-center gap-2">
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
                            High popularity
                        </span>
                        <span className="flex items-center gap-2">
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></span>
                            Medium
                        </span>
                        <span className="flex items-center gap-2">
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                            Niche
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
