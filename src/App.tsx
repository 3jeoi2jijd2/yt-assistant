import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import {
    FileText,
    Search,
    TrendingUp,
    LayoutDashboard,
    LogOut,
    Sparkles,
    Menu,
    X,
    AlertTriangle,
    Image,
    Type,
    Hash,
    Zap,
    AlignLeft,
    Calendar,
    Radar,
    Eye,
    Video,
    Music,
    Settings as SettingsIcon,
    User,
    Wrench
} from 'lucide-react';
import { useState } from 'react';

// Pages
import ScriptGenerator from './pages/ScriptGenerator';
import ChannelFinder from './pages/ChannelFinder';
import NicheFinder from './pages/NicheFinder';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import SettingsPage from './pages/Settings';
import Resources from './pages/Resources';

// Tool Pages
import ThumbnailAnalyzer from './pages/ThumbnailAnalyzer';
import TitleGenerator from './pages/TitleGenerator';
import HashtagGenerator from './pages/HashtagGenerator';
import HookGenerator from './pages/HookGenerator';
import DescriptionWriter from './pages/DescriptionWriter';
import ContentCalendar from './pages/ContentCalendar';
import TrendRadar from './pages/TrendRadar';
import CompetitorSpy from './pages/CompetitorSpy';
import VideoAnalyzer from './pages/VideoAnalyzer';
import TikTokAnalyzer from './pages/TikTokAnalyzer';

import './index.css';

function Sidebar() {
    const { user, isMockMode, signOut } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <button
                className="mobile-menu-btn btn btn-icon"
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 200 }}
            >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="mobile-overlay active"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <Sparkles size={28} />
                    <h1>YT Assistant</h1>
                </div>

                {isMockMode && (
                    <div className="alert alert-warning mb-4" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>
                        <AlertTriangle size={14} />
                        Demo Mode
                    </div>
                )}

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Plan</span>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <LayoutDashboard size={20} />
                            Dashboard
                        </NavLink>
                        <NavLink to="/content-calendar" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Calendar size={20} />
                            Content Calendar
                        </NavLink>
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-title">Create</span>
                        <NavLink to="/script-generator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <FileText size={20} />
                            Script Generator
                        </NavLink>
                        <NavLink to="/title-generator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Type size={20} />
                            Viral Titles
                        </NavLink>
                        <NavLink to="/hook-generator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Zap size={20} />
                            Hook Generator
                        </NavLink>
                        <NavLink to="/description-writer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <AlignLeft size={20} />
                            Description Writer
                        </NavLink>
                        <NavLink to="/hashtag-generator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Hash size={20} />
                            Hashtag Generator
                        </NavLink>
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-title">Analyze</span>
                        <NavLink to="/resources" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Wrench size={20} />
                            Creator Tools
                        </NavLink>
                        <NavLink to="/thumbnail-analyzer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Image size={20} />
                            Thumbnail Analyzer
                        </NavLink>
                        <NavLink to="/competitor-spy" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Eye size={20} />
                            Competitor Spy
                        </NavLink>
                        <NavLink to="/video-analyzer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Video size={20} />
                            Video Analyzer
                        </NavLink>
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-title">Research</span>
                        <NavLink to="/trend-radar" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Radar size={20} />
                            Trend Radar
                        </NavLink>
                        <NavLink to="/niche-finder" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <TrendingUp size={20} />
                            Niche Finder
                        </NavLink>
                        <NavLink to="/channel-finder" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Search size={20} />
                            Channel Finder
                        </NavLink>
                        <NavLink to="/tiktok-analyzer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <Music size={20} />
                            TikTok Analyzer
                        </NavLink>
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-title">Account</span>
                        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <SettingsIcon size={20} />
                            Settings
                        </NavLink>
                    </div>
                </nav>

                {user && (
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
                            {user.email}
                        </div>
                        <button onClick={signOut} className="btn btn-secondary w-full">
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}

function AppContent() {
    const { user, loading, isMockMode } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay" style={{ minHeight: '100vh' }}>
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    const showApp = user || isMockMode;

    return (
        <div className="app-layout">
            <div className="floating-shapes">
                {/* Global shapes for all pages */}
                <div className="shape shape-yellow"></div>
                <div className="shape shape-blue"></div>
                <div className="shape shape-red"></div>
                <div className="shape shape-green"></div>
                <div className="shape shape-purple"></div>
            </div>

            {showApp && <Sidebar />}
            <main className="main-content" style={!showApp ? { marginLeft: 0 } : {}}>
                <Routes>
                    <Route path="/auth" element={showApp ? <Navigate to="/dashboard" /> : <Auth />} />

                    {/* Create */}
                    <Route path="/script-generator" element={showApp ? <ScriptGenerator /> : <Navigate to="/auth" />} />
                    <Route path="/title-generator" element={showApp ? <TitleGenerator /> : <Navigate to="/auth" />} />
                    <Route path="/hook-generator" element={showApp ? <HookGenerator /> : <Navigate to="/auth" />} />
                    <Route path="/description-writer" element={showApp ? <DescriptionWriter /> : <Navigate to="/auth" />} />
                    <Route path="/hashtag-generator" element={showApp ? <HashtagGenerator /> : <Navigate to="/auth" />} />

                    {/* Analyze */}
                    <Route path="/resources" element={showApp ? <Resources /> : <Navigate to="/auth" />} />
                    <Route path="/thumbnail-analyzer" element={showApp ? <ThumbnailAnalyzer /> : <Navigate to="/auth" />} />
                    <Route path="/competitor-spy" element={showApp ? <CompetitorSpy /> : <Navigate to="/auth" />} />
                    <Route path="/video-analyzer" element={showApp ? <VideoAnalyzer /> : <Navigate to="/auth" />} />

                    {/* Research */}
                    <Route path="/trend-radar" element={showApp ? <TrendRadar /> : <Navigate to="/auth" />} />
                    <Route path="/niche-finder" element={showApp ? <NicheFinder /> : <Navigate to="/auth" />} />
                    <Route path="/channel-finder" element={showApp ? <ChannelFinder /> : <Navigate to="/auth" />} />
                    <Route path="/tiktok-analyzer" element={showApp ? <TikTokAnalyzer /> : <Navigate to="/auth" />} />

                    {/* Plan */}
                    <Route path="/content-calendar" element={showApp ? <ContentCalendar /> : <Navigate to="/auth" />} />
                    <Route path="/dashboard" element={showApp ? <Dashboard /> : <Navigate to="/auth" />} />
                    <Route path="/settings" element={showApp ? <SettingsPage /> : <Navigate to="/auth" />} />

                    <Route path="*" element={<Navigate to={showApp ? "/dashboard" : "/auth"} replace />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;
