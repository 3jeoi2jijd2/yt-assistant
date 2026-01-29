import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Mail, Lock, ArrowRight, Check, Zap, Video, TrendingUp } from 'lucide-react';

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

    const features = [
        { icon: <Zap size={18} />, text: 'AI Script Generator' },
        { icon: <Video size={18} />, text: 'Video Analyzer' },
        { icon: <TrendingUp size={18} />, text: 'Trend Radar' },
    ];

    return (
        <div className="auth-container">
            <div className="auth-card animate-slideUp">
                {/* Logo & Title */}
                <div className="auth-header">
                    <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)'
                    }}>
                        <Sparkles size={28} color="white" />
                    </div>
                    <h1>YT Assistant</h1>
                    <p className="text-muted">Your AI-powered YouTube toolkit</p>
                </div>

                {/* Features Preview */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap'
                }}>
                    {features.map((f, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            background: 'rgba(168, 85, 247, 0.1)',
                            padding: '0.35rem 0.7rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(168, 85, 247, 0.2)'
                        }}>
                            <span style={{ color: 'var(--accent-primary)' }}>{f.icon}</span>
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
                                placeholder="Enter your email"
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
                                placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 chars)'}
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
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)'
                }}>
                    By continuing, you agree to our Terms of Service
                </div>
            </div>
        </div>
    );
}
