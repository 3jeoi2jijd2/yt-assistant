import { useState } from 'react';
import { Image, Upload, Sparkles, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AnalysisResult {
    score: number;
    strengths: string[];
    improvements: string[];
    clickPrediction: string;
    colorAnalysis: string;
    textAnalysis: string;
    faceAnalysis: string;
}

export default function ThumbnailAnalyzer() {
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!imageUrl.trim()) {
            setError('Please enter a thumbnail URL');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const response = await fetch('/.netlify/functions/analyze-thumbnail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze thumbnail');
            }

            setAnalysis(data.analysis);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze thumbnail');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 60) return 'var(--accent-primary)';
        if (score >= 40) return 'var(--warning)';
        return 'var(--error)';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Needs Work';
        return 'Poor';
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Image size={32} style={{ color: 'var(--accent-youtube)' }} />
                    Thumbnail Analyzer
                </h1>
                <p>AI-powered analysis to create thumbnails that drive clicks</p>
            </div>

            <div className="card mb-6">
                <div className="form-group mb-4">
                    <label className="form-label">Thumbnail URL</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Paste your thumbnail image URL..."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button
                            onClick={handleAnalyze}
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Analyze
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-muted mt-2">
                        Tip: Right-click any YouTube thumbnail and select "Copy image address"
                    </p>
                </div>

                {imageUrl && (
                    <div style={{
                        background: 'var(--bg-tertiary)',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <img
                            src={imageUrl}
                            alt="Thumbnail preview"
                            style={{
                                maxWidth: '400px',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                            onError={() => setError('Could not load image. Check the URL.')}
                        />
                    </div>
                )}
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="animate-slideUp">
                    {/* Score Card */}
                    <div className="card mb-6">
                        <div className="flex items-center gap-6">
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: `conic-gradient(${getScoreColor(analysis.score)} ${analysis.score}%, var(--bg-tertiary) 0%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 700, color: getScoreColor(analysis.score) }}>
                                        {analysis.score}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</span>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                    {getScoreLabel(analysis.score)} Thumbnail
                                </h3>
                                <p style={{ color: 'var(--text-muted)' }}>
                                    {analysis.clickPrediction}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Strengths */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                                Strengths
                            </h3>
                            <div className="space-y-3">
                                {analysis.strengths.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <span style={{ color: 'var(--success)' }}>✓</span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Improvements */}
                        <div className="card">
                            <h3 className="card-title flex items-center gap-2 mb-4">
                                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                                Suggested Improvements
                            </h3>
                            <div className="space-y-3">
                                {analysis.improvements.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <span style={{ color: 'var(--warning)' }}>→</span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Analysis */}
                    <div className="card mt-6">
                        <h3 className="card-title mb-4">Detailed Analysis</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>🎨 Colors</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{analysis.colorAnalysis}</p>
                            </div>
                            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>📝 Text</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{analysis.textAnalysis}</p>
                            </div>
                            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>👤 Faces</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{analysis.faceAnalysis}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!analysis && !loading && !error && (
                <div className="card">
                    <div className="empty-state">
                        <Image size={64} />
                        <h3>No Thumbnail Analyzed</h3>
                        <p>Paste a thumbnail URL above to get AI-powered insights</p>
                    </div>
                </div>
            )}
        </div>
    );
}
