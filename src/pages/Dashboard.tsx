import { useState, useEffect } from 'react';
import {
    Sparkles,
    Video,
    FileText,
    TrendingUp,
    Zap,
    ArrowRight,
    Star,
    Target,
    Trophy
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    const quickActions = [
        {
            title: 'Write a Script',
            desc: 'AI-powered viral scripts in seconds',
            icon: <FileText size={24} />,
            link: '/script-generator',
            color: 'var(--accent-yellow)'
        },
        {
            title: 'Analyze Video',
            desc: 'Learn what makes videos go viral',
            icon: <Video size={24} />,
            link: '/video-analyzer',
            color: 'var(--accent-blue)'
        },
        {
            title: 'Find Trends',
            desc: 'Discover what\'s trending now',
            icon: <TrendingUp size={24} />,
            link: '/trend-radar',
            color: 'var(--accent-green)'
        },
        {
            title: 'Spy Competitors',
            desc: 'Uncover their secrets',
            icon: <Target size={24} />,
            link: '/competitor-spy',
            color: 'var(--accent-red)'
        }
    ];

    const tips = [
        "🎬 Hook viewers in the first 3 seconds",
        "📊 Post consistently at the same times",
        "💡 Use pattern interrupts every 30 seconds",
        "🔥 Controversial titles get 2x more clicks",
        "⚡ Shorts under 30 seconds perform best"
    ];

    const [currentTip, setCurrentTip] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTip(prev => (prev + 1) % tips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="animate-fadeIn">
            {/* Welcome Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {greeting}, <span className="highlight">Creator</span> 👋
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Ready to make some viral content today?
                </p>
            </div>

            {/* Pro Tip Banner */}
            <div style={{
                background: 'var(--accent-yellow)',
                border: '2px solid var(--text-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <Sparkles size={24} />
                <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700 }}>Pro Tip: </span>
                    <span style={{ fontWeight: 500 }}>{tips[currentTip]}</span>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '4px'
                }}>
                    {tips.map((_, i) => (
                        <div key={i} style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: i === currentTip ? 'var(--text-primary)' : 'rgba(0,0,0,0.2)'
                        }} />
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>
                    <Zap size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-4 gap-4">
                    {quickActions.map((action, i) => (
                        <Link key={i} to={action.link} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{
                                cursor: 'pointer',
                                borderWidth: '2px'
                            }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    background: action.color,
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1rem',
                                    color: 'var(--text-primary)',
                                    border: '2px solid var(--text-primary)'
                                }}>
                                    {action.icon}
                                </div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                                    {action.title}
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {action.desc}
                                </p>
                                <div style={{
                                    marginTop: '0.75rem',
                                    color: 'var(--accent-blue)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}>
                                    Start <ArrowRight size={14} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="icon"><FileText size={24} /></div>
                    <div className="value">0</div>
                    <div className="label">Scripts Created</div>
                </div>
                <div className="stat-card">
                    <div className="icon" style={{ background: 'var(--accent-blue)', color: 'white', border: 'none' }}>
                        <Video size={24} />
                    </div>
                    <div className="value">0</div>
                    <div className="label">Videos Analyzed</div>
                </div>
                <div className="stat-card">
                    <div className="icon" style={{ background: 'var(--accent-green)', color: 'white', border: 'none' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="value">0</div>
                    <div className="label">Trends Found</div>
                </div>
                <div className="stat-card">
                    <div className="icon" style={{ background: 'var(--accent-purple)', color: 'white', border: 'none' }}>
                        <Trophy size={24} />
                    </div>
                    <div className="value">New</div>
                    <div className="label">Creator Level</div>
                </div>
            </div>

            {/* Recent Activity & Tips */}
            <div className="grid grid-cols-2 gap-6">
                {/* Get Started */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Star size={20} />
                            Getting Started
                        </h3>
                    </div>
                    <div className="step-list">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <strong>Analyze a Viral Video</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Learn what makes top videos successful
                                </p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <strong>Generate Your Script</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    AI will write a viral script for you
                                </p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <strong>Create & Publish</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Record your video and go viral!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Growth Tools */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <TrendingUp size={20} />
                            Growth Tools
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {[
                            { name: 'Trend Radar', desc: 'Find trending topics', link: '/trend-radar' },
                            { name: 'Title Generator', desc: 'High-CTR titles', link: '/title-generator' },
                            { name: 'Hook Generator', desc: 'Attention-grabbing hooks', link: '/hook-generator' },
                            { name: 'Competitor Spy', desc: 'Steal their strategy', link: '/competitor-spy' }
                        ].map((tool, i) => (
                            <Link key={i} to={tool.link} style={{ textDecoration: 'none', display: 'block' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-sm)',
                                    transition: 'all 0.2s',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{tool.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tool.desc}</p>
                                    </div>
                                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
