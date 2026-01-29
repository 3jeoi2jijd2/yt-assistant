import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Mail, Lock, ArrowRight, Check, Zap, Video, TrendingUp, Star } from 'lucide-react';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (isLogin) {
            const { error } = await signIn(email, password);
            if (error) {
                setError(error.message);
            }
        } else {
            const { error } = await signUp(email, password);
            if (error) {
                setError(error.message);
            } else {
                setSuccess('Check your email to confirm your account!');
            }
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            {/* Floating Shapes */}
            <div className="floating-shapes">
                <div className="shape shape-yellow" style={{ top: '10%', left: '8%', transform: 'rotate(15deg)' }}></div>
                <div className="shape shape-blue" style={{ bottom: '25%', left: '12%' }}></div>
                <div className="shape shape-red" style={{ top: '20%', right: '10%' }}></div>
                <div className="shape shape-green" style={{ bottom: '15%', right: '8%', transform: 'rotate(-15deg)' }}></div>
            </div>

            <div className="auth-card animate-slideUp">
                {/* Badge */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 1rem',
                        background: 'var(--success-bg)',
                        color: 'var(--success)',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid var(--success)'
                    }}>
                        <Star size={14} fill="currentColor" />
                        Free to Use
                    </span>
                </div>

                {/* Logo & Title */}
                <div className="auth-header">
                    <h1>
                        Chat with <span>AI.</span>
                    </h1>
                    <h1 style={{ marginTop: '-0.25rem' }}>
                        <span>Go viral</span> on YouTube.
                    </h1>
                    <p className="text-muted" style={{ marginTop: '0.75rem' }}>
                        Your AI-powered content creation toolkit
                    </p>
                </div>

                {/* Feature Icons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    marginBottom: '2rem',
                    flexWrap: 'wrap'
                }}>
                    {[
                        { icon: <Zap size={16} />, text: 'Scripts' },
                        { icon: <Video size={16} />, text: 'Analyzer' },
                        { icon: <TrendingUp size={16} />, text: 'Trends' },
                        { icon: <Sparkles size={16} />, text: 'AI Chat' }
                    ].map((f, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-tertiary)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)'
                        }}>
                            {f.icon}
                            {f.text}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="alert alert-error mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success mb-4">
                        <Check size={16} />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)'
                                }}
                            />
                            <input
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)'
                                }}
                            />
                            <input
                                type="password"
                                className="form-input"
                                placeholder={isLogin ? '••••••••' : 'Min 6 characters'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {loading ? (
                            <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-toggle">
                    <span className="text-muted">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                    </span>
                    {' '}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setSuccess('');
                        }}
                        style={{
                            background: 'var(--accent-yellow)',
                            border: '2px solid var(--text-primary)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>

                {/* Features Line */}
                <div style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    No install • Browser based • Instant access
                </div>
            </div>
        </div>
    );
}
