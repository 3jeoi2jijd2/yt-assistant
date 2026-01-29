import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
    Moon,
    Sun,
    User,
    Bell,
    Shield,
    CreditCard,
    LogOut,
    Check,
    Smartphone
} from 'lucide-react';

export default function Settings() {
    const { user, signOut } = useAuth();
    const [theme, setTheme] = useState('light');
    const [notifications, setNotifications] = useState(true);

    useEffect(() => {
        // Load theme from local storage or system preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.body.setAttribute('data-theme', newTheme);
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1>Settings</h1>
                <p>Manage your preferences and account</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Appearance Settings */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Sun size={20} />
                            Appearance
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div className="flex items-center gap-3">
                                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                                <div>
                                    <p className="font-bold">Theme</p>
                                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                                        {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className="btn btn-secondary btn-sm"
                            >
                                Switch to {theme === 'light' ? 'Dark' : 'Light'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <User size={20} />
                            Profile
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={user?.email || ''}
                                disabled
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="badge badge-success">
                                <Check size={12} /> Pro Plan
                            </div>
                            <div className="badge badge-blue">
                                <CreditCard size={12} /> Active
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Bell size={20} />
                            Notifications
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {['Email Updates', 'Trend Alerts', 'Weekly Reports'].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>{item}</span>
                                <div
                                    onClick={() => setNotifications(!notifications)}
                                    style={{
                                        width: '40px',
                                        height: '22px',
                                        background: notifications ? 'var(--accent-success, #22c55e)' : 'var(--bg-tertiary)',
                                        borderRadius: '20px',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        background: 'white',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        top: '2px',
                                        left: notifications ? '20px' : '2px',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Shield size={20} />
                            Security
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <button className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>
                            <Smartphone size={18} />
                            Manage Devices
                        </button>
                        <button
                            onClick={signOut}
                            className="btn w-full"
                            style={{
                                justifyContent: 'flex-start',
                                background: 'var(--error-bg)',
                                color: 'var(--error)',
                                borderColor: 'var(--error)'
                            }}
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
