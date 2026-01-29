import { useState } from 'react';
import { TrendingUp, Sparkles, Bookmark, BookmarkCheck, Zap, Target, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { saveNiche } from '../lib/supabase';

interface Niche {
    name: string;
    competition: 'low' | 'medium' | 'high';
    potential: number;
    description: string;
    trendingTopics: string[];
    monthlySearches: string;
}

export default function NicheFinder() {
    const { user } = useAuth();
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [niches, setNiches] = useState<Niche[]>([]);
    const [savedNiches, setSavedNiches] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');

    const handleFind = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNiches([]);
        setLoading(true);

        try {
            const response = await fetch('/api/find-niches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to find niches');
            }

            setNiches(data.niches || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to find niches');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNiche = async (niche: Niche) => {
        if (!user) return;

        const { error } = await saveNiche(user.id, niche.name, niche.competition, niche.potential);
        if (!error) {
            setSavedNiches(prev => new Set([...prev, niche.name]));
        }
    };

    const getCompetitionColor = (competition: string) => {
        switch (competition) {
            case 'low': return 'var(--success)';
            case 'medium': return 'var(--warning)';
            case 'high': return 'var(--error)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <TrendingUp size={32} style={{ color: 'var(--success)' }} />
                    Unsaturated Niche Finder
                </h1>
                <p>Discover low-competition, high-potential niches for YouTube and TikTok</p>
            </div>

            <div className="card mb-6">
                <form onSubmit={handleFind}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Interest Area or Broad Category</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Technology, Health, Education, Entertainment..."
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        />
                        <p className="text-sm text-muted mt-2">
                            Enter a broad category and AI will find specific unsaturated sub-niches with high potential
                        </p>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                                Analyzing Market...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Find Unsaturated Niches
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

            {niches.length > 0 && (
                <div className="flex flex-col gap-4">
                    {niches.map((niche, index) => (
                        <div key={index} className="card niche-card animate-slideUp">
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title flex items-center gap-2">
                                        <Target size={20} style={{ color: 'var(--accent-primary)' }} />
                                        {niche.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span
                                            className="badge"
                                            style={{
                                                background: `${getCompetitionColor(niche.competition)}20`,
                                                color: getCompetitionColor(niche.competition)
                                            }}
                                        >
                                            {niche.competition.toUpperCase()} Competition
                                        </span>
                                        <span className="text-sm text-muted flex items-center gap-1">
                                            <BarChart3 size={14} />
                                            {niche.monthlySearches} monthly searches
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSaveNiche(niche)}
                                    className={`btn ${savedNiches.has(niche.name) ? 'btn-primary' : 'btn-outline'} btn-sm`}
                                    disabled={savedNiches.has(niche.name)}
                                >
                                    {savedNiches.has(niche.name) ? (
                                        <>
                                            <BookmarkCheck size={16} />
                                            Saved
                                        </>
                                    ) : (
                                        <>
                                            <Bookmark size={16} />
                                            Save
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-secondary mb-4">{niche.description}</p>

                            <div className="niche-score mb-4">
                                <span className="text-sm" style={{ minWidth: '100px' }}>Viral Potential:</span>
                                <div className="score-bar">
                                    <div
                                        className="score-fill"
                                        style={{ width: `${niche.potential}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-semibold" style={{ minWidth: '40px', textAlign: 'right' }}>
                                    {niche.potential}%
                                </span>
                            </div>

                            <div>
                                <p className="text-sm text-muted mb-2 flex items-center gap-1">
                                    <Zap size={14} />
                                    Trending Topics in this Niche:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {niche.trendingTopics.map((topic, i) => (
                                        <span key={i} className="badge badge-primary">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && niches.length === 0 && !error && (
                <div className="card">
                    <div className="empty-state">
                        <TrendingUp size={64} />
                        <h3>Discover Your Niche</h3>
                        <p>Enter a category to find unsaturated sub-niches with low competition and high growth potential</p>
                    </div>
                </div>
            )}
        </div>
    );
}
