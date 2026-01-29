import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTranscripts, getScripts, getSavedNiches } from '../lib/supabase';
import {
    LayoutDashboard,
    Video,
    FileText,
    TrendingUp,
    Clock,
    Trash2,
    ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TranscriptItem {
    id: string;
    video_id: string;
    title: string;
    created_at: string;
}

interface ScriptItem {
    id: string;
    title: string;
    platform: string;
    niche: string;
    created_at: string;
}

interface NicheItem {
    id: string;
    name: string;
    competition: string;
    potential: number;
    created_at: string;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
    const [scripts, setScripts] = useState<ScriptItem[]>([]);
    const [niches, setNiches] = useState<NicheItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'transcripts' | 'scripts' | 'niches'>('transcripts');

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);

        const [transcriptsRes, scriptsRes, nichesRes] = await Promise.all([
            getTranscripts(user.id),
            getScripts(user.id),
            getSavedNiches(user.id)
        ]);

        setTranscripts(transcriptsRes.data || []);
        setScripts(scriptsRes.data || []);
        setNiches(nichesRes.data || []);
        setLoading(false);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <LayoutDashboard size={32} style={{ color: 'var(--accent-primary)' }} />
                    Dashboard
                </h1>
                <p>Your saved transcripts, scripts, and niches</p>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-grid mb-6">
                <div className="card stat-card">
                    <div className="stat-icon">
                        <Video size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{transcripts.length}</div>
                        <div className="stat-label">Saved Transcripts</div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{scripts.length}</div>
                        <div className="stat-label">Generated Scripts</div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{niches.length}</div>
                        <div className="stat-label">Saved Niches</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mb-6">
                <Link to="/transcriber" className="btn btn-secondary">
                    <Video size={18} />
                    New Transcript
                    <ChevronRight size={16} />
                </Link>
                <Link to="/script-generator" className="btn btn-secondary">
                    <FileText size={18} />
                    Generate Script
                    <ChevronRight size={16} />
                </Link>
                <Link to="/niche-finder" className="btn btn-secondary">
                    <TrendingUp size={18} />
                    Find Niche
                    <ChevronRight size={16} />
                </Link>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'transcripts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transcripts')}
                >
                    <Video size={16} style={{ marginRight: '0.5rem' }} />
                    Transcripts ({transcripts.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'scripts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scripts')}
                >
                    <FileText size={16} style={{ marginRight: '0.5rem' }} />
                    Scripts ({scripts.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'niches' ? 'active' : ''}`}
                    onClick={() => setActiveTab('niches')}
                >
                    <TrendingUp size={16} style={{ marginRight: '0.5rem' }} />
                    Niches ({niches.length})
                </button>
            </div>

            {/* Content */}
            <div className="card">
                {loading ? (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Loading your data...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'transcripts' && (
                            <div className="history-list">
                                {transcripts.length === 0 ? (
                                    <div className="empty-state">
                                        <Video size={48} />
                                        <h3>No Transcripts Yet</h3>
                                        <p>Your saved transcripts will appear here</p>
                                        <Link to="/transcriber" className="btn btn-primary mt-4">
                                            Transcribe a Video
                                        </Link>
                                    </div>
                                ) : (
                                    transcripts.map((item) => (
                                        <div key={item.id} className="history-item">
                                            <div className="flex items-center gap-3">
                                                <div className="stat-icon" style={{ width: '40px', height: '40px' }}>
                                                    <Video size={18} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontWeight: 500 }}>{item.title}</h4>
                                                    <p className="text-sm text-muted flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {formatDate(item.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="btn btn-icon btn-secondary btn-sm">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'scripts' && (
                            <div className="history-list">
                                {scripts.length === 0 ? (
                                    <div className="empty-state">
                                        <FileText size={48} />
                                        <h3>No Scripts Yet</h3>
                                        <p>Your generated scripts will appear here</p>
                                        <Link to="/script-generator" className="btn btn-primary mt-4">
                                            Generate a Script
                                        </Link>
                                    </div>
                                ) : (
                                    scripts.map((item) => (
                                        <div key={item.id} className="history-item">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="stat-icon"
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                                    }}
                                                >
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontWeight: 500 }}>{item.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`badge ${item.platform === 'youtube' ? 'badge-youtube' : 'badge-tiktok'}`}>
                                                            {item.platform}
                                                        </span>
                                                        <span className="text-sm text-muted">{item.niche}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted">{formatDate(item.created_at)}</span>
                                                <button className="btn btn-icon btn-secondary btn-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'niches' && (
                            <div className="history-list">
                                {niches.length === 0 ? (
                                    <div className="empty-state">
                                        <TrendingUp size={48} />
                                        <h3>No Saved Niches</h3>
                                        <p>Your saved niches will appear here</p>
                                        <Link to="/niche-finder" className="btn btn-primary mt-4">
                                            Find a Niche
                                        </Link>
                                    </div>
                                ) : (
                                    niches.map((item) => (
                                        <div key={item.id} className="history-item">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="stat-icon"
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                                    }}
                                                >
                                                    <TrendingUp size={18} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontWeight: 500 }}>{item.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="badge badge-success">
                                                            {item.competition} competition
                                                        </span>
                                                        <span className="text-sm text-muted">{item.potential}% potential</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted">{formatDate(item.created_at)}</span>
                                                <button className="btn btn-icon btn-secondary btn-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
