import { useState } from 'react';
import { Calendar, Plus, Sparkles, Trash2, Check, Clock } from 'lucide-react';

interface ContentIdea {
    id: string;
    day: string;
    title: string;
    type: string;
    status: 'idea' | 'scripted' | 'filmed' | 'published';
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const contentTypes = ['📺 Long-form', '⚡ Short', '🎵 TikTok', '📸 Reel'];
const statuses = [
    { id: 'idea', label: '💡 Idea', color: 'var(--text-muted)' },
    { id: 'scripted', label: '📝 Scripted', color: 'var(--accent-primary)' },
    { id: 'filmed', label: '🎬 Filmed', color: 'var(--warning)' },
    { id: 'published', label: '✅ Published', color: 'var(--success)' }
];

export default function ContentCalendar() {
    const [ideas, setIdeas] = useState<ContentIdea[]>([]);
    const [niche, setNiche] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateWeek = async () => {
        if (!niche.trim()) {
            setError('Please enter your niche or topic area');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/.netlify/functions/generate-calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate calendar');
            }

            setIdeas(data.ideas || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate calendar');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = (id: string) => {
        setIdeas(ideas.map(idea => {
            if (idea.id === id) {
                const statusOrder = ['idea', 'scripted', 'filmed', 'published'];
                const currentIndex = statusOrder.indexOf(idea.status);
                const nextIndex = (currentIndex + 1) % statusOrder.length;
                return { ...idea, status: statusOrder[nextIndex] as ContentIdea['status'] };
            }
            return idea;
        }));
    };

    const removeIdea = (id: string) => {
        setIdeas(ideas.filter(i => i.id !== id));
    };

    const getStatusInfo = (status: string) => {
        return statuses.find(s => s.id === status) || statuses[0];
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Calendar size={32} style={{ color: 'var(--accent-primary)' }} />
                    Content Calendar
                </h1>
                <p>Plan your week with AI-generated content ideas</p>
            </div>

            <div className="card mb-6">
                <div className="flex gap-4">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Enter your niche (e.g., fitness, tech reviews, cooking)..."
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button
                        onClick={generateWeek}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate Week
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {ideas.length > 0 && (
                <div className="animate-slideUp">
                    {/* Status Legend */}
                    <div className="flex gap-4 mb-4">
                        {statuses.map(s => (
                            <span key={s.id} className="flex items-center gap-2 text-sm">
                                <span style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: s.color
                                }}></span>
                                {s.label}
                            </span>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {days.map(day => {
                            const dayIdeas = ideas.filter(i => i.day === day);
                            return (
                                <div key={day} className="card" style={{ padding: '1rem' }}>
                                    <h4 style={{
                                        fontWeight: 600,
                                        marginBottom: '0.75rem',
                                        paddingBottom: '0.5rem',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}>
                                        {day}
                                    </h4>
                                    <div className="space-y-2">
                                        {dayIdeas.map(idea => {
                                            const statusInfo = getStatusInfo(idea.status);
                                            return (
                                                <div
                                                    key={idea.id}
                                                    style={{
                                                        background: 'var(--bg-tertiary)',
                                                        padding: '0.5rem',
                                                        borderRadius: '0.5rem',
                                                        borderLeft: `3px solid ${statusInfo.color}`,
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                                            {idea.type}
                                                        </span>
                                                        <button
                                                            onClick={() => removeIdea(idea.id)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                opacity: 0.5,
                                                                padding: '2px'
                                                            }}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                                                        {idea.title}
                                                    </p>
                                                    <button
                                                        onClick={() => updateStatus(idea.id)}
                                                        style={{
                                                            background: statusInfo.color,
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.65rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {statusInfo.label}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {dayIdeas.length === 0 && (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: '1rem',
                                                opacity: 0.4,
                                                fontSize: '0.75rem'
                                            }}>
                                                No content
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {ideas.length === 0 && !loading && (
                <div className="card">
                    <div className="empty-state">
                        <Calendar size={64} />
                        <h3>No Content Planned</h3>
                        <p>Enter your niche above to generate a week of content ideas</p>
                    </div>
                </div>
            )}
        </div>
    );
}
