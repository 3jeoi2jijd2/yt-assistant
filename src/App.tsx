import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import {
    Video,
    FileText,
    Search,
    TrendingUp,
    LayoutDashboard,
    LogOut,
    Sparkles,
    Menu,
    X,
    AlertTriangle
} from 'lucide-react';
import { useState } from 'react';

// Pages
import Transcriber from './pages/Transcriber';
import ScriptGenerator from './pages/ScriptGenerator';
import ChannelFinder from './pages/ChannelFinder';
import NicheFinder from './pages/NicheFinder';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';

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

            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <Sparkles size={28} />
                    <h1>YT Assistant</h1>
                </div>

                {isMockMode && (
                    <div className="alert alert-warning mb-4" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>
                        <AlertTriangle size={14} />
                        Demo Mode - Setup Supabase for full features
                    </div>
                )}

                <nav className="sidebar-nav">
                    <NavLink to="/transcriber" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Video size={20} />
                        Transcriber
                    </NavLink>
                    <NavLink to="/script-generator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <FileText size={20} />
                        Script Generator
                    </NavLink>
                    <NavLink to="/channel-finder" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Search size={20} />
                        Channel Finder
                    </NavLink>
                    <NavLink to="/niche-finder" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <TrendingUp size={20} />
                        Niche Finder
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </NavLink>
                </nav>

                {user && (
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
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

    // In mock mode, always show the app (skip auth)
    const showApp = user || isMockMode;

    return (
        <div className="app-layout">
            {showApp && <Sidebar />}
            <main className="main-content" style={!showApp ? { marginLeft: 0 } : {}}>
                <Routes>
                    <Route path="/auth" element={showApp ? <Navigate to="/transcriber" /> : <Auth />} />
                    <Route path="/transcriber" element={showApp ? <Transcriber /> : <Navigate to="/auth" />} />
                    <Route path="/script-generator" element={showApp ? <ScriptGenerator /> : <Navigate to="/auth" />} />
                    <Route path="/channel-finder" element={showApp ? <ChannelFinder /> : <Navigate to="/auth" />} />
                    <Route path="/niche-finder" element={showApp ? <NicheFinder /> : <Navigate to="/auth" />} />
                    <Route path="/dashboard" element={showApp ? <Dashboard /> : <Navigate to="/auth" />} />
                    <Route path="*" element={<Navigate to={showApp ? "/transcriber" : "/auth"} replace />} />
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
