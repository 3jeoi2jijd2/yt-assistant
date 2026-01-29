import { useState } from 'react';
import { FileText, Sparkles, Copy, Check, Save, Youtube, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { saveScript } from '../lib/supabase';

export default function ScriptGenerator() {
    const { user } = useAuth();
    const [niche, setNiche] = useState('');
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState<'youtube' | 'tiktok'>('youtube');
    const [scriptLength, setScriptLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [loading, setLoading] = useState(false);
    const [script, setScript] = useState('');
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setScript('');
        setSaved(false);
        setLoading(true);

        try {
            const response = await fetch('/.netlify/functions/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche, topic, platform, scriptLength })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate script');
            }

            setScript(data.script);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate script');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!user || !script) return;

        const title = topic || `${niche} - ${platform}`;
        const { error } = await saveScript(user.id, title, script, platform, niche);
        if (!error) {
            setSaved(true);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <FileText size={32} style={{ color: 'var(--accent-primary)' }} />
                    AI Script Generator
                </h1>
                <p>Generate viral, SEO-optimized scripts for YouTube and TikTok</p>
            </div>

            <div className="card mb-6">
                <form onSubmit={handleGenerate}>
                    <div className="flex gap-4 mb-4">
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="form-label">Niche / Category</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Tech, Gaming, Fitness, Finance..."
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="form-label">Specific Topic (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., iPhone 16 Review, Morning Routine..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="form-label">Platform</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className={`btn ${platform === 'youtube' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setPlatform('youtube')}
                                    style={{ flex: 1 }}
                                >
                                    <Youtube size={18} />
                                    YouTube
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${platform === 'tiktok' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setPlatform('tiktok')}
                                    style={{ flex: 1 }}
                                >
                                    <Zap size={18} />
                                    TikTok
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="form-label">Script Length</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className={`btn ${scriptLength === 'short' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setScriptLength('short')}
                                    style={{ flex: 1 }}
                                >
                                    Short
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${scriptLength === 'medium' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setScriptLength('medium')}
                                    style={{ flex: 1 }}
                                >
                                    Medium
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${scriptLength === 'long' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setScriptLength('long')}
                                    style={{ flex: 1 }}
                                >
                                    Long
                                </button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                                Generating Viral Script...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate Script
                            </>
                        )}
                    </button>
                </form>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {script && (
                <div className="card animate-slideUp">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title flex items-center gap-2">
                                <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                                Generated Script
                            </h3>
                            <div className="flex gap-2 mt-2">
                                <span className={`badge ${platform === 'youtube' ? 'badge-youtube' : 'badge-tiktok'}`}>
                                    {platform.toUpperCase()}
                                </span>
                                <span className="badge badge-primary">{scriptLength}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="btn btn-secondary btn-sm">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button onClick={handleSave} className="btn btn-secondary btn-sm" disabled={saved}>
                                <Save size={16} />
                                {saved ? 'Saved!' : 'Save'}
                            </button>
                        </div>
                    </div>
                    <div className="script-content">
                        {script}
                    </div>
                </div>
            )}

            {!script && !loading && (
                <div className="card">
                    <div className="empty-state">
                        <FileText size={64} />
                        <h3>Ready to Create</h3>
                        <p>Enter your niche and topic to generate a viral script with hooks, CTAs, and SEO optimization</p>
                    </div>
                </div>
            )}
        </div>
    );
}
